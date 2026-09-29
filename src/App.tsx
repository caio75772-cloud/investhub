import { Routes, Route } from 'react-router-dom'

import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Carteira from './pages/Carteira'
import Ativos from './pages/Ativos'

import './App.css'

function App() {
  return (
  <div className="app">
    <Sidebar />

    <div className="app-main">
      <Topbar />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/carteira" element={<Carteira />} />
        <Route path="/ativos" element={<Ativos />} />
      </Routes>
    </div>
  </div>
)
}
export default App