import { NavLink } from 'react-router-dom'

import {
  LayoutDashboard,
  WalletCards,
  CandlestickChart,
  ChartNoAxesCombined,
  Wrench,
  Globe2,
  Lightbulb,
  Settings,
} from 'lucide-react'

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img
          src="/logo-investhub.png"
          alt="InvestHub"
          className="brand-logo"
        />
      </div>

      <p className="menu-title">NAVEGAÇÃO</p>

      <nav className="menu">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `menu-item ${isActive ? 'active' : ''}`
          }
        >
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/carteira"
          className={({ isActive }) =>
            `menu-item ${isActive ? 'active' : ''}`
          }
        >
          <WalletCards size={19} />
          <span>Minha Carteira</span>
        </NavLink>

        <NavLink
          to="/ativos"
          className={({ isActive }) =>
            `menu-item ${isActive ? 'active' : ''}`
          }
        >
          <CandlestickChart size={19} />
          <span>Ativos</span>
        </NavLink>

        <NavLink
          to="/analises"
          className={({ isActive }) =>
            `menu-item ${isActive ? 'active' : ''}`
          }
        >
          <ChartNoAxesCombined size={19} />
          <span>Análises</span>
        </NavLink>

        <NavLink
          to="/ferramentas"
          className={({ isActive }) =>
            `menu-item ${isActive ? 'active' : ''}`
          }
        >
          <Wrench size={19} />
          <span>Ferramentas</span>
        </NavLink>

        <NavLink
          to="/mercado"
          className={({ isActive }) =>
            `menu-item ${isActive ? 'active' : ''}`
          }
        >
          <Globe2 size={19} />
          <span>Mercado</span>
        </NavLink>

        <NavLink
          to="/insights"
          className={({ isActive }) =>
            `menu-item ${isActive ? 'active' : ''}`
          }
        >
          <Lightbulb size={19} />
          <span>Insights</span>
        </NavLink>

        <NavLink
          to="/configuracoes"
          className={({ isActive }) =>
            `menu-item ${isActive ? 'active' : ''}`
          }
        >
          <Settings size={19} />
          <span>Configurações</span>
        </NavLink>
      </nav>
    </aside>
  )
}

export default Sidebar