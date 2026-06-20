import type { ReactNode } from 'react'
import { History } from 'lucide-react'
import { useRoom } from '../context/RoomContext'

interface Props {
  onClose?: () => void
  closeIcon?: ReactNode
}

export default function RoundLog({ onClose, closeIcon }: Props) {
  const { state } = useRoom()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
        <History className="size-4 text-slate-400" />
        <h2 className="font-semibold">Round log</h2>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800"
          >
            {closeIcon}
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {state.log.length === 0 && (
          <p className="px-1 pt-2 text-sm text-slate-500">
            Revealed rounds will show up here.
          </p>
        )}
        {state.log.map((entry) => (
          <div
            key={entry.roundNumber}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">
                Round {entry.roundNumber}
              </span>
              <span className="text-sm text-indigo-300">
                avg {entry.average ?? '—'}
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {entry.picks.map((pick, i) => (
                <li
                  key={`${pick.name}-${i}`}
                  className="flex justify-between text-sm"
                >
                  <span style={{ color: pick.color }}>{pick.name}</span>
                  <span className="font-mono text-slate-300">{pick.value}</span>
                </li>
              ))}
              {entry.picks.length === 0 && (
                <li className="text-sm text-slate-600">No picks</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
