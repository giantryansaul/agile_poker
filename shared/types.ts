export const FIB_DECK = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89] as const;
export type CardValue = (typeof FIB_DECK)[number];

export type RoomPhase = 'voting' | 'revealed';

export interface User {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  connected: boolean;
  hasPicked: boolean;
  /** Hidden (null) for other users while phase === 'voting'. */
  pick: CardValue | null;
}

export interface RoundLogEntry {
  roundNumber: number;
  average: number | null;
  picks: { name: string; color: string; value: CardValue }[];
  revealedAt: number;
}

export interface RoomState {
  code: string;
  phase: RoomPhase;
  roundNumber: number;
  users: User[];
  average: number | null;
  log: RoundLogEntry[];
}

export type AckError =
  | 'ROOM_NOT_FOUND'
  | 'NAME_TAKEN'
  | 'NOT_HOST'
  | 'ALREADY_REVEALED'
  | 'INVALID_INPUT';

export type Ack<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: AckError };

export interface JoinPayload {
  code: string;
  userId: string;
  name: string;
  color: string;
}

export interface ClientToServerEvents {
  create_room: (
    payload: Omit<JoinPayload, 'code'>,
    ack: (res: Ack<{ code: string }>) => void,
  ) => void;
  join_room: (
    payload: JoinPayload,
    ack: (res: Ack<{ state: RoomState }>) => void,
  ) => void;
  pick_card: (
    payload: { value: CardValue },
    ack: (res: Ack) => void,
  ) => void;
  flip: (ack: (res: Ack) => void) => void;
  new_round: (ack: (res: Ack) => void) => void;
  leave_room: () => void;
}

export interface ServerToClientEvents {
  room_state: (state: RoomState) => void;
  room_closed: () => void;
}
