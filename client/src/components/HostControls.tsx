import { Eye, RotateCcw } from 'lucide-react'
import { useRoom } from '../context/RoomContext'

export default function HostControls() {
  const { state, isHost, flip, newRound } = useRoom()
  const anyPicked = state.users.some((u) => u.hasPicked)

  if (!isHost) {
    return (
      <p className="mb-3 text-center text-sm text-slate-500">
        {state.phase === 'voting'
          ? 'Pick a card — the host flips when everyone is ready.'
          : 'Waiting for the host to start a new round.'}
      </p>
    )
  }

  return (
    <div className="mb-3 flex justify-center">
      {state.phase === 'voting' ? (
        <button
          onClick={flip}
          disabled={!anyPicked}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-2.5 font-semibold text-white transition enabled:hover:bg-indigo-400 enabled:active:scale-[0.98] disabled:opacity-40"
        >
          <Eye className="size-5" />
          Flip cards
        </button>
      ) : (
        <button
          onClick={newRound}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98]"
        >
          <RotateCcw className="size-5" />
          New round
        </button>
      )}
    </div>
  )
}
