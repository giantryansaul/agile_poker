import { Crown, Sigma } from 'lucide-react'
import type { CardValue, User } from '@shared/types'
import { useRoom } from '../context/RoomContext'

interface Group {
  value: CardValue
  users: User[]
}

export default function ResultsPanel() {
  const { state } = useRoom()

  const groups = new Map<CardValue, User[]>()
  for (const user of state.users) {
    if (user.pick === null) continue
    const list = groups.get(user.pick) ?? []
    list.push(user)
    groups.set(user.pick, list)
  }
  const sorted: Group[] = [...groups.entries()]
    .map(([value, users]) => ({ value, users }))
    .sort((a, b) => b.users.length - a.users.length || a.value - b.value)

  const abstained = state.users.filter((u) => u.pick === null)

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-1">
        <span className="flex items-center gap-2 text-sm font-medium tracking-wide text-slate-400 uppercase">
          <Sigma className="size-4" /> Average
        </span>
        <span className="text-5xl font-bold text-indigo-300">
          {state.average ?? '—'}
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-6">
        {sorted.map((group) => (
          <div key={group.value} className="flex flex-col items-center gap-3">
            <div className="relative flex aspect-[2/3] w-16 items-center justify-center rounded-xl border border-indigo-400 bg-indigo-500 text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
              {group.value}
              {group.users.length > 1 && (
                <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-900">
                  {group.users.length}
                </span>
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              {group.users.map((user) => (
                <span
                  key={user.id}
                  className="flex items-center gap-1 text-sm font-semibold"
                  style={{ color: user.color }}
                >
                  {user.isHost && <Crown className="size-3.5" />}
                  {user.name}
                </span>
              ))}
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-slate-500">Nobody picked a card this round.</p>
        )}
      </div>

      {abstained.length > 0 && (
        <p className="text-sm text-slate-500">
          Didn't vote:{' '}
          {abstained.map((u, i) => (
            <span key={u.id}>
              {i > 0 && ', '}
              <span style={{ color: u.color }}>{u.name}</span>
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
