import { useState } from 'react'
import { Bell, ChevronDown, LogOut, User, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar({ title, onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdown, setDropdown] = useState(false)
  return (
    <header className="h-16 bg-[#1a1a2e] border-b border-[#2d2d44] flex items-center px-6 gap-4 flex-shrink-0">
      <button onClick={onMenuClick} className="md:hidden text-gray-400 hover:text-white"><Menu size={20} /></button>
      <h1 className="text-lg font-semibold text-white flex-1">{title}</h1>
      <button className="text-gray-400 hover:text-white relative p-2 rounded-lg hover:bg-[#2d2d44]">
        <Bell size={20} />
        <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" />
      </button>
      <div className="relative">
        <button onClick={() => setDropdown(!dropdown)} className="flex items-center gap-2 text-gray-300 hover:text-white p-1 rounded-lg hover:bg-[#2d2d44] transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <ChevronDown size={14} />
        </button>
        {dropdown && (
          <div className="absolute right-0 top-full mt-2 bg-[#2d2d44] border border-[#3d3d54] rounded-xl shadow-xl z-50 min-w-[150px] overflow-hidden">
            <button onClick={() => { navigate('/settings'); setDropdown(false) }} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#3d3d54] w-full text-left transition-colors">
              <User size={14} /> Profile
            </button>
            <button onClick={logout} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-[#3d3d54] w-full text-left transition-colors">
              <LogOut size={14} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
