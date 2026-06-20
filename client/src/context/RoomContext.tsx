/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AckError, CardValue, RoomState, User } from '@shared/types'
import { socket } from '../lib/socket'
import { getUserId, type Profile } from '../lib/session'

interface RoomContextValue {
  state: RoomState
  selfId: string
  self: User | undefined
  isHost: boolean
  pickCard: (value: CardValue) => void
  flip: () => void
  newRound: () => void
}

const RoomContext = createContext<RoomContextValue | null>(null)

export function useRoom(): RoomContextValue {
  const ctx = useContext(RoomContext)
  if (!ctx) throw new Error('useRoom must be used inside RoomProvider')
  return ctx
}

interface RoomConnection {
  state: RoomState | null
  joinError: AckError | null
  connected: boolean
}

/** Connects to the room, auto-rejoining on refresh and socket reconnects. */
export function useRoomConnection(
  code: string,
  profile: Profile | null,
): RoomConnection {
  const [state, setState] = useState<RoomState | null>(null)
  const [joinError, setJoinError] = useState<AckError | null>(null)
  const [connected, setConnected] = useState(socket.connected)

  useEffect(() => {
    if (!profile) return

    const join = () => {
      setConnected(true)
      socket.emit(
        'join_room',
        { code, userId: getUserId(), ...profile },
        (res) => {
          if (res.ok) {
            setState(res.data.state)
            setJoinError(null)
          } else {
            setJoinError(res.error)
          }
        },
      )
    }
    const onState = (next: RoomState) => setState(next)
    const onDisconnect = () => setConnected(false)

    socket.on('room_state', onState)
    socket.on('connect', join)
    socket.on('disconnect', onDisconnect)
    socket.connect()
    if (socket.connected) join()

    return () => {
      socket.off('room_state', onState)
      socket.off('connect', join)
      socket.off('disconnect', onDisconnect)
      socket.disconnect()
    }
  }, [code, profile])

  return { state, joinError, connected }
}

export function RoomProvider({
  state,
  children,
}: {
  state: RoomState
  children: ReactNode
}) {
  const selfId = getUserId()

  const value = useMemo<RoomContextValue>(() => {
    const self = state.users.find((u) => u.id === selfId)
    return {
      state,
      selfId,
      self,
      isHost: self?.isHost ?? false,
      pickCard: (v) => socket.emit('pick_card', { value: v }, () => {}),
      flip: () => socket.emit('flip', () => {}),
      newRound: () => socket.emit('new_round', () => {}),
    }
  }, [state, selfId])

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
}
