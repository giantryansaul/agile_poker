import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Plus, Spade } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const canJoin = code.length === 4

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400">
          <Spade className="size-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Agile Poker</h1>
        <p className="text-sm text-slate-400">
          Estimate stories together, one card at a time.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4">
        <button
          onClick={() => navigate('/room/new')}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3.5 font-semibold text-white transition hover:bg-indigo-400 active:scale-[0.98]"
        >
          <Plus className="size-5" />
          Create a room
        </button>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="h-px flex-1 bg-slate-800" />
          or join one
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (canJoin) navigate(`/room/${code}`)
          }}
        >
          <input
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, '')
                  .slice(0, 4),
              )
            }
            placeholder="CODE"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="w-full flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!canJoin}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 font-semibold transition enabled:hover:bg-slate-700 disabled:opacity-40"
          >
            <LogIn className="size-5" />
            Join
          </button>
        </form>
      </div>
    </div>
  )
}
