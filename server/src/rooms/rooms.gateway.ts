import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type {
  Ack,
  CardValue,
  ClientToServerEvents,
  JoinPayload,
  RoomState,
  ServerToClientEvents,
} from '../../../shared/types';
import { RoomsService, type ServerRoom } from './rooms.service';

interface SocketData {
  userId?: string;
  code?: string;
}

type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

const DISCONNECT_GRACE_MS = 60 * 1000;

@WebSocketGateway({ cors: { origin: true } })
export class RoomsGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >;

  private readonly graceTimers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly rooms: RoomsService) {}

  @SubscribeMessage('create_room')
  handleCreateRoom(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() payload: Omit<JoinPayload, 'code'>,
  ): Ack<{ code: string }> {
    const result = this.rooms.createRoom(
      payload?.userId,
      payload?.name,
      payload?.color,
      socket.id,
    );
    if (!result.ok) {
      return result;
    }
    this.seatSocket(socket, result.data, payload.userId);
    return { ok: true, data: { code: result.data.code } };
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() payload: JoinPayload,
  ): Ack<{ state: RoomState }> {
    const result = this.rooms.joinRoom(
      payload?.code ?? '',
      payload?.userId,
      payload?.name,
      payload?.color,
      socket.id,
    );
    if (!result.ok) {
      return result;
    }
    this.seatSocket(socket, result.data, payload.userId);
    return {
      ok: true,
      data: { state: this.rooms.toRoomState(result.data, payload.userId) },
    };
  }

  @SubscribeMessage('pick_card')
  handlePickCard(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() payload: { value: CardValue },
  ): Ack {
    const { code, userId } = socket.data;
    if (!code || !userId) {
      return { ok: false, error: 'ROOM_NOT_FOUND' };
    }
    const result = this.rooms.pick(code, userId, payload?.value);
    if (!result.ok) {
      return result;
    }
    this.broadcastState(result.data);
    return { ok: true, data: undefined };
  }

  @SubscribeMessage('flip')
  handleFlip(@ConnectedSocket() socket: AppSocket): Ack {
    const { code, userId } = socket.data;
    if (!code || !userId) {
      return { ok: false, error: 'ROOM_NOT_FOUND' };
    }
    const result = this.rooms.flip(code, userId);
    if (!result.ok) {
      return result;
    }
    this.broadcastState(result.data);
    return { ok: true, data: undefined };
  }

  @SubscribeMessage('new_round')
  handleNewRound(@ConnectedSocket() socket: AppSocket): Ack {
    const { code, userId } = socket.data;
    if (!code || !userId) {
      return { ok: false, error: 'ROOM_NOT_FOUND' };
    }
    const result = this.rooms.newRound(code, userId);
    if (!result.ok) {
      return result;
    }
    this.broadcastState(result.data);
    return { ok: true, data: undefined };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@ConnectedSocket() socket: AppSocket): void {
    const { code, userId } = socket.data;
    if (!code || !userId) {
      return;
    }
    this.clearGraceTimer(code, userId);
    const room = this.rooms.removeUser(code, userId);
    socket.leave(code);
    socket.data.code = undefined;
    socket.data.userId = undefined;
    if (room) {
      this.broadcastState(room);
    }
  }

  handleDisconnect(socket: AppSocket): void {
    const { code, userId } = socket.data;
    if (!code || !userId) {
      return;
    }
    const room = this.rooms.markDisconnected(code, userId, socket.id);
    if (!room) {
      return;
    }
    this.broadcastState(room);
    this.clearGraceTimer(code, userId);
    const timer = setTimeout(() => {
      this.graceTimers.delete(`${code}:${userId}`);
      const user = this.rooms.getRoom(code)?.users.get(userId);
      if (user && !user.connected) {
        const updated = this.rooms.removeUser(code, userId);
        if (updated) {
          this.broadcastState(updated);
        }
      }
    }, DISCONNECT_GRACE_MS);
    this.graceTimers.set(`${code}:${userId}`, timer);
  }

  /** Sends each connected member its own sanitized view of the room. */
  private broadcastState(room: ServerRoom): void {
    for (const user of room.users.values()) {
      if (!user.connected || !user.socketId) {
        continue;
      }
      const memberSocket = this.server.sockets.sockets.get(user.socketId);
      memberSocket?.emit('room_state', this.rooms.toRoomState(room, user.id));
    }
  }

  private seatSocket(
    socket: AppSocket,
    room: ServerRoom,
    userId: string,
  ): void {
    this.clearGraceTimer(room.code, userId);
    socket.data.userId = userId;
    socket.data.code = room.code;
    void socket.join(room.code);
    this.broadcastState(room);
  }

  private clearGraceTimer(code: string, userId: string): void {
    const key = `${code}:${userId}`;
    const timer = this.graceTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.graceTimers.delete(key);
    }
  }
}
