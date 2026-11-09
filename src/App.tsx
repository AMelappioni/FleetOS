import { Navigate, Route, Routes } from 'react-router-dom'
import FleetApp from './products/fleet'

/** Versione standalone: la home reindirizza al prodotto (le rotte restano sotto /fleet). */
export default function App() {
  return (
    <Routes>
      <Route path="/fleet/*" element={<FleetApp />} />
      <Route path="*" element={<Navigate to="/fleet" replace />} />
    </Routes>
  )
}
