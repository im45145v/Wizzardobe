import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../services/api'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginApi(form)
      const { token, user } = res.data
      login(token, user)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-violet-900/40 to-pink-900/40 items-center justify-center p-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mb-4">Wizzardobe</h1>
          <p className="text-gray-400 text-xl">Your AI-powered wardrobe assistant</p>
          <p className="text-gray-500 mt-4 max-w-sm">Get AI outfit suggestions, track your wardrobe, and dress smarter every day.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-white mb-2">Sign in</h2>
          <p className="text-gray-400 mb-8">Welcome back to Wizzardobe</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full bg-[#1a1a2e] border border-[#2d2d44] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                className="w-full bg-[#1a1a2e] border border-[#2d2d44] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-gray-400 mt-6 text-sm">
            Don't have an account? <Link to="/register" className="text-violet-400 hover:text-violet-300">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
