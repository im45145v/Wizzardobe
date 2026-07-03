import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { LayoutDashboard, Shirt, Sparkles, Droplets, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/wardrobe': 'Wardrobe',
  '/wardrobe/add': 'Add Clothing',
  '/outfits/suggest': 'Outfit Suggestions',
  '/outfits/judge': 'Outfit Judge',
  '/laundry': 'Laundry Tracker',
  '/calendar': 'Style Calendar',
  '/shopping': 'Shopping',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
}

const mobileNav = [
  { to: '/dashboard', icon: LayoutDashboard },
  { to: '/wardrobe', icon: Shirt },
  { to: '/outfits/suggest', icon: Sparkles },
  { to: '/laundry', icon: Droplets },
  { to: '/settings', icon: Settings },
]

export default function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const title = pageTitles[location.pathname] || 'Wizzardobe'

  return (
    <div className="h-screen flex bg-[#0f0f1a] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden w-64">
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] border-t border-[#2d2d44] flex md:hidden z-30">
        {mobileNav.map(({ to, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 transition-colors ${isActive ? 'text-violet-400' : 'text-gray-500'}`}>
            <Icon size={22} />
          </NavLink>
        ))}
      </div>
    </div>
  )
}
