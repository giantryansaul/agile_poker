import { Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import RoomPage from './pages/RoomPage'

export default function App() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 antialiased">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:code" element={<RoomPage />} />
      </Routes>
    </div>
  )
}
