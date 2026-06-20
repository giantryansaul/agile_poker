import { Crown, WifiOff } from 'lucide-react'
import type { User } from '@shared/types'

export default function PlayerCard({ user }: { user: User }) {
  return (
    <div
      className={`flex flex-col items-center gap-2 ${
        user.connected ? '' : 'opacity-40'
      }`}
    >
      {user.hasPicked ? (
        user.pick !== null ? (
          // Own card: shown face-up
          <div className="flex aspect-[2/3] w-16 items-center justify-center rounded-xl border border-indigo-400 bg-indigo-500 text-xl font-bold text-white shadow-lg shadow-indigo-500/20">
            {user.pick}
          </div>
        ) : (
          // Someone else's card: face-down
          <div className="flex aspect-[2/3] w-16 items-center justify-center rounded-xl border border-indigo-900 bg-gradient-to-br from-indigo-600 to-violet-700 shadow-lg">
            <div className="size-8 rounded-full border-2 border-white/30" />
          </div>
        )
      ) : (
        <div className="flex aspect-[2/3] w-16 items-center justify-center rounded-xl border-2 border-dashed border-slate-700 text-slate-600">
          ?
        </div>
      )}
      <span
        className="flex max-w-24 items-center gap-1 truncate text-sm font-semibold"
        style={{ color: user.color }}
      >
        {user.isHost && <Crown className="size-3.5 shrink-0" />}
        {!user.connected && <WifiOff className="size-3.5 shrink-0" />}
        <span className="truncate">{user.name}</span>
      </span>
    </div>
  )
}
