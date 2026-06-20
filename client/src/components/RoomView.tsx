import { useState } from 'react'
import { History, LogOut, Users, X } from 'lucide-react'
import { useRoom } from '../context/RoomContext'
import CardGrid from './CardGrid'
import CopyRoomCode from './CopyRoomCode'
import HostControls from './HostControls'
import PlayersArea from './PlayersArea'
import ResultsPanel from './ResultsPanel'
import RoundLog from './RoundLog'

export default function RoomView({ onLeave }: { onLeave: () => void }) {
  const { state } = useRoom()
  const [logOpen, setLogOpen] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Round log: fixed sidebar on desktop */}
      <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-900/60 md:flex md:flex-col">
        <RoundLog />
      </aside>

      {/* Round log: slide-over drawer on mobile */}
      {logOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close round log"
            onClick={() => setLogOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-900 shadow-2xl">
            <RoundLog
              onClose={() => setLogOpen(false)}
              closeIcon={<X className="size-5" />}
            />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
          <button
            onClick={() => setLogOpen(true)}
            aria-label="Show round log"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 md:hidden"
          >
            <History className="size-5" />
          </button>
          <CopyRoomCode code={state.code} />
          <span className="text-sm text-slate-500">
            Round {state.roundNumber}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-slate-400">
              <Users className="size-4" />
              {state.users.length}
            </span>
            <button
              onClick={onLeave}
              aria-label="Leave room"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-6">
          {state.phase === 'voting' ? <PlayersArea /> : <ResultsPanel />}
        </section>

        <footer className="border-t border-slate-800 bg-slate-900/60 px-4 pt-3 pb-4">
          <HostControls />
          <CardGrid />
        </footer>
      </main>
    </div>
  )
}
