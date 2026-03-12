import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Receipt, TrendingUp, Target, Bell, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '../lib/api'

const links = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/gastos',       icon: Receipt,         label: 'Gastos' },
  { to: '/investimentos',icon: TrendingUp,       label: 'Investimentos' },
  { to: '/metas',        icon: Target,           label: 'Metas' },
  { to: '/alertas',      icon: Bell,             label: 'Alertas' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.get('/alerts?unreadOnly=true').then(r => setUnread(r.data.length)).catch(() => {})
    const iv = setInterval(() => {
      api.get('/alerts?unreadOnly=true').then(r => setUnread(r.data.length)).catch(() => {})
    }, 60000)
    return () => clearInterval(iv)
  }, [])

  const handleLogout = () => { logout(); nav('/login') }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-surface border-r border-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <h1 className="font-serif text-2xl text-accent leading-none">controle</h1>
          <p className="text-xs text-gray-600 mt-0.5">financeiro</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative
                 ${isActive ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Icon size={16} />
              {label}
              {label === 'Alertas' && unread > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5 mt-1">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto bg-bg">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
