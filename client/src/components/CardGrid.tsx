import { FIB_DECK } from '@shared/types'
import { useRoom } from '../context/RoomContext'

export default function CardGrid() {
  const { state, self, pickCard } = useRoom()
  const locked = state.phase === 'revealed'

  return (
    <div
      className={`flex flex-wrap justify-center gap-2 ${
        locked ? 'pointer-events-none opacity-40' : ''
      }`}
    >
      {FIB_DECK.map((value) => {
        const selected = self?.pick === value
        return (
          <button
            key={value}
            onClick={() => pickCard(value)}
            disabled={locked}
            className={`aspect-[2/3] w-12 rounded-xl border text-lg font-bold transition md:w-14 ${
              selected
                ? '-translate-y-2 border-indigo-400 bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:-translate-y-1 hover:border-indigo-500/60'
            }`}
          >
            {value}
          </button>
        )
      })}
    </div>
  )
}
