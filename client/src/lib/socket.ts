import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@shared/types'

const SERVER_URL =
  import.meta.env.VITE_WS_URL ?? `http://${window.location.hostname}:3000`

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  SERVER_URL,
  { autoConnect: false },
)
