import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function CopyRoomCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — code stays visible.
    }
  }

  return (
    <button
      onClick={copy}
      title="Copy room code"
      className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 font-mono text-lg font-bold tracking-[0.25em] text-indigo-300 transition hover:bg-slate-700"
    >
      {code}
      {copied ? (
        <Check className="size-4 text-green-400" />
      ) : (
        <Copy className="size-4 text-slate-400" />
      )}
    </button>
  )
}
