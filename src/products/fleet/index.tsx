import { Route, Routes } from 'react-router-dom'
import { AppShell } from '../../shared/AppShell'
import { useFleetAI } from './ai'
import { fleetConfig } from './config'
import Dashboard from './Dashboard'
import { Analisi, Assistenza, ClientiFleet, Contratti, Fatturazione, Flotta, Noleggi, Officina, Ricambi } from './Pages'

function Shell() {
  const { ai, notifications } = useFleetAI()
  return <AppShell config={fleetConfig} ai={ai} notifications={notifications} user="Giovanni" />
}

export default function FleetApp() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="flotta" element={<Flotta />} />
        <Route path="noleggi" element={<Noleggi />} />
        <Route path="assistenza" element={<Assistenza />} />
        <Route path="officina" element={<Officina />} />
        <Route path="ricambi" element={<Ricambi />} />
        <Route path="clienti" element={<ClientiFleet />} />
        <Route path="contratti" element={<Contratti />} />
        <Route path="fatturazione" element={<Fatturazione />} />
        <Route path="analisi" element={<Analisi />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
