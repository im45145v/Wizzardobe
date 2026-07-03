import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Shirt, Sparkles, Camera, Droplets, CalendarDays, ShoppingBag, BarChart3, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/wardrobe', icon: Shirt, label: 'Wardrobe' },
  { to: '/outfits/suggest', icon: Sparkles, label: 'Outfit Suggest' },
  { to: '/outfits/judge', icon: Camera, label: 'Outfit Judge' },
  { to: '/laundry', icon: Droplets, label: 'Laundry' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/shopping', icon: ShoppingBag, label: 'Shopping' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  return (
    <aside className="w-64 h-full bg-[#1a1a2e] border-r border-[#2d2d44] flex flex-col">
      <div className="p-6 border-b border-[#2d2d44]">
        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Wizzardobe</h1>
        <p className="text-xs text-gray-500 mt-1">AI Wardrobe Assistant</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive ? 'bg-gradient-to-r from-violet-600/30 to-pink-600/30 text-white border border-violet-600/30' : 'text-gray-400 hover:text-white hover:bg-[#2d2d44]'}`
          }>
            <Icon size={18} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-[#2d2d44]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 transition-colors">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  )
}
