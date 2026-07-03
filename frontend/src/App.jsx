import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useContext } from 'react'
import AuthContext from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Wardrobe from './pages/Wardrobe'
import ClothForm from './pages/ClothForm'
import OutfitSuggest from './pages/OutfitSuggest'
import OutfitJudge from './pages/OutfitJudge'
import Laundry from './pages/Laundry'
import Calendar from './pages/Calendar'
import Shopping from './pages/Shopping'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

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
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/wardrobe/add" element={<ClothForm />} />
          <Route path="/wardrobe/edit/:id" element={<ClothForm />} />
          <Route path="/outfits/suggest" element={<OutfitSuggest />} />
          <Route path="/outfits/judge" element={<OutfitJudge />} />
          <Route path="/laundry" element={<Laundry />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
