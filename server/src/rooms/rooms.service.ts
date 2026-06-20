import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  AckError,
  CardValue,
  FIB_DECK,
  RoomPhase,
  RoomState,
  RoundLogEntry,
} from '../../../shared/types';

export interface ServerUser {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  connected: boolean;
  pick: CardValue | null;
  socketId: string | null;
  joinedAt: number;
}

export interface ServerRoom {
  code: string;
  phase: RoomPhase;
  roundNumber: number;
  users: Map<string, ServerUser>;
  log: RoundLogEntry[];
  average: number | null;
  emptySince: number | null;
}

export type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: AckError };

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const EMPTY_ROOM_TTL_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

@Injectable()
export class RoomsService implements OnModuleDestroy {
  private readonly rooms = new Map<string, ServerRoom>();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(
      () => this.cleanupEmptyRooms(),
      CLEANUP_INTERVAL_MS,
    );
    this.cleanupTimer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }

  getRoom(code: string): ServerRoom | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  createRoom(
    userId: string,
    name: string,
    color: string,
    socketId: string,
  ): Result<ServerRoom> {
    if (!this.isValidProfile(userId, name, color)) {
      return { ok: false, error: 'INVALID_INPUT' };
    }
    let code = this.generateCode();
    while (this.rooms.has(code)) {
      code = this.generateCode();
    }
    const room: ServerRoom = {
      code,
      phase: 'voting',
      roundNumber: 1,
      users: new Map(),
      log: [],
      average: null,
      emptySince: null,
    };
    room.users.set(userId, {
      id: userId,
      name: name.trim(),
      color,
      isHost: true,
      connected: true,
      pick: null,
      socketId,
      joinedAt: Date.now(),
    });
    this.rooms.set(code, room);
    return { ok: true, data: room };
  }

  joinRoom(
    code: string,
    userId: string,
    name: string,
    color: string,
    socketId: string,
  ): Result<ServerRoom> {
    if (!this.isValidProfile(userId, name, color)) {
      return { ok: false, error: 'INVALID_INPUT' };
    }
    const room = this.getRoom(code);
    if (!room) {
      return { ok: false, error: 'ROOM_NOT_FOUND' };
    }
    const trimmed = name.trim();
    const existing = room.users.get(userId);
    const nameTaken = [...room.users.values()].some(
      (u) => u.id !== userId && u.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (nameTaken) {
      return { ok: false, error: 'NAME_TAKEN' };
    }
    if (existing) {
      // Rejoin: reclaim the seat, keeping pick and host flag.
      existing.name = trimmed;
      existing.color = color;
      existing.connected = true;
      existing.socketId = socketId;
    } else {
      room.users.set(userId, {
        id: userId,
        name: trimmed,
        color,
        isHost: room.users.size === 0,
        connected: true,
        pick: null,
        socketId,
        joinedAt: Date.now(),
      });
    }
    room.emptySince = null;
    return { ok: true, data: room };
  }

  pick(code: string, userId: string, value: CardValue): Result<ServerRoom> {
    const room = this.getRoom(code);
    const user = room?.users.get(userId);
    if (!room || !user) {
      return { ok: false, error: 'ROOM_NOT_FOUND' };
    }
    if (room.phase === 'revealed') {
      return { ok: false, error: 'ALREADY_REVEALED' };
    }
    if (!FIB_DECK.includes(value)) {
      return { ok: false, error: 'INVALID_INPUT' };
    }
    user.pick = value;
    return { ok: true, data: room };
  }

  flip(code: string, userId: string): Result<ServerRoom> {
    const room = this.getRoom(code);
    if (!room) {
      return { ok: false, error: 'ROOM_NOT_FOUND' };
    }
    if (!room.users.get(userId)?.isHost) {
      return { ok: false, error: 'NOT_HOST' };
    }
    if (room.phase === 'revealed') {
      return { ok: false, error: 'ALREADY_REVEALED' };
    }
    const picks = [...room.users.values()]
      .filter((u) => u.pick !== null)
      .map((u) => ({ name: u.name, color: u.color, value: u.pick! }));
    room.phase = 'revealed';
    room.average =
      picks.length > 0
        ? Math.round(
            (picks.reduce((sum, p) => sum + p.value, 0) / picks.length) * 10,
          ) / 10
        : null;
    room.log.unshift({
      roundNumber: room.roundNumber,
      average: room.average,
      picks,
      revealedAt: Date.now(),
    });
    return { ok: true, data: room };
  }

  newRound(code: string, userId: string): Result<ServerRoom> {
    const room = this.getRoom(code);
    if (!room) {
      return { ok: false, error: 'ROOM_NOT_FOUND' };
    }
    if (!room.users.get(userId)?.isHost) {
      return { ok: false, error: 'NOT_HOST' };
    }
    room.phase = 'voting';
    room.average = null;
    room.roundNumber += 1;
    for (const user of room.users.values()) {
      user.pick = null;
    }
    return { ok: true, data: room };
  }

  /**
   * Marks a user as disconnected (only if the given socket still owns the
   * seat) and reassigns host if needed. Returns the room when state changed.
   */
  markDisconnected(
    code: string,
    userId: string,
    socketId: string,
  ): ServerRoom | undefined {
    const room = this.getRoom(code);
    const user = room?.users.get(userId);
    if (!room || !user || user.socketId !== socketId) {
      return undefined;
    }
    user.connected = false;
    user.socketId = null;
    this.reassignHost(room, user);
    return room;
  }

  /** Removes a user for good (grace period expired or explicit leave). */
  removeUser(code: string, userId: string): ServerRoom | undefined {
    const room = this.getRoom(code);
    const user = room?.users.get(userId);
    if (!room || !user) {
      return undefined;
    }
    room.users.delete(userId);
    this.reassignHost(room, user);
    if (room.users.size === 0) {
      room.emptySince = Date.now();
    }
    return room;
  }

  toRoomState(room: ServerRoom, viewerUserId: string): RoomState {
    const users = [...room.users.values()].sort(
      (a, b) => a.joinedAt - b.joinedAt,
    );
    return {
      code: room.code,
      phase: room.phase,
      roundNumber: room.roundNumber,
      average: room.average,
      log: room.log,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        color: u.color,
        isHost: u.isHost,
        connected: u.connected,
        hasPicked: u.pick !== null,
        pick:
          room.phase === 'revealed' || u.id === viewerUserId ? u.pick : null,
      })),
    };
  }

  private reassignHost(room: ServerRoom, leaving: ServerUser): void {
    if (!leaving.isHost) {
      return;
    }
    const successor = [...room.users.values()]
      .filter((u) => u.connected && u.id !== leaving.id)
      .sort((a, b) => a.joinedAt - b.joinedAt)[0];
    if (successor) {
      leaving.isHost = false;
      successor.isHost = true;
    }
  }

  private cleanupEmptyRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (
        room.emptySince !== null &&
        now - room.emptySince > EMPTY_ROOM_TTL_MS
      ) {
        this.rooms.delete(code);
      }
    }
  }

  private generateCode(): string {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    return code;
  }

  private isValidProfile(userId: string, name: string, color: string): boolean {
    return (
      typeof userId === 'string' &&
      userId.length > 0 &&
      typeof name === 'string' &&
      name.trim().length > 0 &&
      name.trim().length <= 24 &&
      typeof color === 'string' &&
      /^#[0-9a-fA-F]{6}$/.test(color)
    );
  }
}
