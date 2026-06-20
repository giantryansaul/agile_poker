import { useState } from 'react'
import { Check, LogIn } from 'lucide-react'
import { NAME_COLORS } from '../lib/colors'
import type { Profile } from '../lib/session'

interface Props {
  title: string
  submitLabel: string
  error?: string | null
  onSubmit: (profile: Profile) => void
}

export default function JoinForm({ title, submitLabel, error, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(NAME_COLORS[6])
  const canSubmit = name.trim().length > 0

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit) onSubmit({ name: name.trim(), color })
        }}
        className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
      >
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Pick a name and a color for your cards.
          </p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-300">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            autoFocus
            autoComplete="off"
            placeholder="e.g. Sam"
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-300">Your color</span>
          <div className="grid grid-cols-5 gap-3">
            {NAME_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`color ${c}`}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`flex aspect-square items-center justify-center rounded-full transition ${
                  color === c
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                    : 'opacity-80 hover:opacity-100'
                }`}
              >
                {color === c && <Check className="size-5 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {name.trim() && (
          <p className="text-sm text-slate-400">
            You'll appear as{' '}
            <span className="font-semibold" style={{ color }}>
              {name.trim()}
            </span>
          </p>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white transition enabled:hover:bg-indigo-400 enabled:active:scale-[0.98] disabled:opacity-40"
        >
          <LogIn className="size-5" />
          {submitLabel}
        </button>
      </form>
    </div>
  )
}
