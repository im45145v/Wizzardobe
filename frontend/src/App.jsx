import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useContext } from 'react'
import AuthContext from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'

const Placeholder = ({ name }) => (
  <div className="p-8 text-white text-2xl font-bold">{name} Page</div>
)

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext)
  if (isLoading) return <div className="min-h-screen bg-[#0f0f1a]" />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user, isLoading } = useContext(AuthContext)
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          isLoading ? <div className="min-h-screen bg-[#0f0f1a]" /> :
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wardrobe" element={<Placeholder name="Wardrobe" />} />
          <Route path="/wardrobe/add" element={<Placeholder name="Add Cloth" />} />
          <Route path="/outfits/suggest" element={<Placeholder name="Outfit Suggest" />} />
          <Route path="/outfits/judge" element={<Placeholder name="Outfit Judge" />} />
          <Route path="/laundry" element={<Placeholder name="Laundry" />} />
          <Route path="/calendar" element={<Placeholder name="Calendar" />} />
          <Route path="/shopping" element={<Placeholder name="Shopping" />} />
          <Route path="/analytics" element={<Placeholder name="Analytics" />} />
          <Route path="/settings" element={<Placeholder name="Settings" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
