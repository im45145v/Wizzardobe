import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      const res = await registerApi({ name: form.name, email: form.email, password: form.password })
      const { token, user } = res.data
      login(token, user)
      toast.success('Account created!')
      navigate('/onboarding')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm({...form, [k]: e.target.value}) })

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-violet-900/40 to-pink-900/40 items-center justify-center p-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mb-4">Wizzardobe</h1>
          <p className="text-gray-400 text-xl">Start your AI wardrobe journey</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-white mb-2">Create account</h2>
          <p className="text-gray-400 mb-8">Join Wizzardobe today</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[['name','Name','text','Your name'],['email','Email','email','you@example.com'],
              ['password','Password','password','Min 8 characters'],['confirm','Confirm Password','password','Repeat password']].map(([k,label,type,ph]) => (
              <div key={k}>
                <label className="block text-sm text-gray-400 mb-1">{label}</label>
                <input type={type} required {...f(k)} placeholder={ph}
                  className="w-full bg-[#1a1a2e] border border-[#2d2d44] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors" />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-gray-400 mt-6 text-sm">
            Already have an account? <Link to="/login" className="text-violet-400 hover:text-violet-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
