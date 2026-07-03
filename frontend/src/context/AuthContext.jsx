import { createContext, useContext, useState, useEffect } from 'react'
import { getProfile } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('wardrobeai_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('wardrobeai_token')
    if (storedToken) {
      setToken(storedToken)
      getProfile()
        .then((res) => setUser(res.data.user || res.data))
        .catch(() => {
          localStorage.removeItem('wardrobeai_token')
          localStorage.removeItem('wardrobeai_refresh_token')
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const loginUser = (newToken, userData, refreshToken) => {
    localStorage.setItem('wardrobeai_token', newToken)
    if (refreshToken) localStorage.setItem('wardrobeai_refresh_token', refreshToken)
    setToken(newToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('wardrobeai_token')
    localStorage.removeItem('wardrobeai_refresh_token')
    setToken(null)
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }))
  }

  return (
    <AuthContext.Provider value={{ user, token, login: loginUser, logout, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
