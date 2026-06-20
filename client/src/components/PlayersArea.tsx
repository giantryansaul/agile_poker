import { useRoom } from '../context/RoomContext'
import PlayerCard from './PlayerCard'

export default function PlayersArea() {
  const { state } = useRoom()
  const pickedCount = state.users.filter((u) => u.hasPicked).length

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <div className="flex flex-wrap items-start justify-center gap-x-6 gap-y-8">
        {state.users.map((user) => (
          <PlayerCard key={user.id} user={user} />
        ))}
      </div>
      <p className="text-sm text-slate-500">
        {pickedCount} of {state.users.length} picked
      </p>
    </div>
  )
}
