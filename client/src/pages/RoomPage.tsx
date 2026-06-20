import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import type { AckError } from '@shared/types'
import JoinForm from '../components/JoinForm'
import RoomView from '../components/RoomView'
import { RoomProvider, useRoomConnection } from '../context/RoomContext'
import { socket } from '../lib/socket'
import {
  clearProfile,
  getProfile,
  getUserId,
  saveProfile,
  type Profile,
} from '../lib/session'

const ERROR_MESSAGES: Record<AckError, string> = {
  ROOM_NOT_FOUND: 'Room not found. It may have expired.',
  NAME_TAKEN: 'That name is already taken in this room.',
  NOT_HOST: 'Only the host can do that.',
  ALREADY_REVEALED: 'Cards are already revealed.',
  INVALID_INPUT: 'That input is not valid.',
}

export default function RoomPage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const isNew = code.toLowerCase() === 'new'
  const roomCode = code.toUpperCase()

  const [profile, setProfile] = useState<Profile | null>(() =>
    isNew ? null : getProfile(roomCode),
  )
  const [createError, setCreateError] = useState<AckError | null>(null)

  // The route param changes in place when create navigates to the real code.
  useEffect(() => {
    setProfile(isNew ? null : getProfile(roomCode))
  }, [isNew, roomCode])

  const { state, joinError } = useRoomConnection(
    roomCode,
    isNew ? null : profile,
  )

  const handleCreate = (p: Profile) => {
    setCreateError(null)
    socket.connect()
    socket.emit('create_room', { userId: getUserId(), ...p }, (res) => {
      if (res.ok) {
        saveProfile(res.data.code, p)
        navigate(`/room/${res.data.code}`, { replace: true })
      } else {
        setCreateError(res.error)
      }
    })
  }

  if (isNew) {
    return (
      <JoinForm
        title="Create a room"
        submitLabel="Create room"
        error={createError && ERROR_MESSAGES[createError]}
        onSubmit={handleCreate}
      />
    )
  }

  if (joinError === 'ROOM_NOT_FOUND') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">
          Room <span className="font-mono text-indigo-400">{roomCode}</span>{' '}
          not found
        </h1>
        <p className="text-slate-400">{ERROR_MESSAGES.ROOM_NOT_FOUND}</p>
        <Link
          to="/"
          className="rounded-xl bg-indigo-500 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-400"
        >
          Back to start
        </Link>
      </div>
    )
  }

  if (!profile || joinError) {
    return (
      <JoinForm
        title={`Join room ${roomCode}`}
        submitLabel="Join room"
        error={joinError && ERROR_MESSAGES[joinError]}
        onSubmit={(p) => {
          saveProfile(roomCode, p)
          setProfile(p)
        }}
      />
    )
  }

  if (!state) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-3 text-slate-400">
        <Loader2 className="size-5 animate-spin" />
        Joining {roomCode}…
      </div>
    )
  }

  return (
    <RoomProvider state={state}>
      <RoomView
        onLeave={() => {
          socket.emit('leave_room')
          clearProfile(roomCode)
          navigate('/')
        }}
      />
    </RoomProvider>
  )
}
