import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveOnboarding } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const steps = ['Basics', 'Style', 'Occasions', 'Setup']
const occasions = ['university','gym','party','formal','work','travel','date-night']
const styles = ['streetwear','minimalist','formal','casual']
const skinTones = ['#FDDBB4','#F1C27D','#E0AC69','#C68642','#8D5524','#4A2912']

export default function Onboarding() {
  const { updateUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    gender: '', bodyType: '', skinTone: '', stylePreference: '',
    occasions: [], city: '', openaiApiKey: '', weatherApiKey: ''
  })

  const set = (k, v) => setData(d => ({ ...d, [k]: v }))
  const toggleOcc = (o) => set('occasions', data.occasions.includes(o) ? data.occasions.filter(x=>x!==o) : [...data.occasions, o])

  const handleFinish = async () => {
    if (!data.openaiApiKey) return toast.error('OpenAI API key is required')
    setLoading(true)
    try {
      await saveOnboarding(data)
      updateUser({ onboarded: true })
      toast.success('Profile set up!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl p-8">
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {steps.map((s, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? 'bg-gradient-to-r from-violet-600 to-pink-600' : 'bg-[#2d2d44]'}`} />
            ))}
          </div>
          <p className="text-sm text-gray-500">Step {step+1} of {steps.length}: <span className="text-violet-400">{steps[step]}</span></p>
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-white">Tell us about yourself</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {['male','female','non-binary','prefer-not'].map(g => (
                  <button key={g} onClick={() => set('gender',g)}
                    className={`py-2 px-3 rounded-lg border text-sm transition-all capitalize ${data.gender===g ? 'border-violet-500 bg-violet-600/20 text-white' : 'border-[#2d2d44] text-gray-400 hover:border-violet-500/50'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Body Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['slim','athletic','average','plus'].map(b => (
                  <button key={b} onClick={() => set('bodyType',b)}
                    className={`py-2 px-3 rounded-lg border text-sm transition-all capitalize ${data.bodyType===b ? 'border-violet-500 bg-violet-600/20 text-white' : 'border-[#2d2d44] text-gray-400 hover:border-violet-500/50'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-white">Your style</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-3">Skin Tone</label>
              <div className="flex gap-3">
                {skinTones.map(tone => (
                  <button key={tone} onClick={() => set('skinTone', tone)}
                    style={{ backgroundColor: tone }}
                    className={`w-10 h-10 rounded-full border-4 transition-all ${data.skinTone===tone ? 'border-violet-400 scale-110' : 'border-transparent'}`} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Style Preference</label>
              <div className="grid grid-cols-2 gap-2">
                {styles.map(s => (
                  <button key={s} onClick={() => set('stylePreference',s)}
                    className={`py-3 px-4 rounded-lg border text-sm transition-all capitalize ${data.stylePreference===s ? 'border-violet-500 bg-violet-600/20 text-white' : 'border-[#2d2d44] text-gray-400 hover:border-violet-500/50'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-white">Your occasions</h2>
            <p className="text-gray-400 text-sm">Select all that apply to your lifestyle</p>
            <div className="grid grid-cols-2 gap-2">
              {occasions.map(o => (
                <button key={o} onClick={() => toggleOcc(o)}
                  className={`py-2.5 px-3 rounded-lg border text-sm transition-all capitalize ${data.occasions.includes(o) ? 'border-violet-500 bg-violet-600/20 text-white' : 'border-[#2d2d44] text-gray-400 hover:border-violet-500/50'}`}>
                  {o.replace('-',' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-white">Final setup</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1">City</label>
              <input value={data.city} onChange={e=>set('city',e.target.value)} placeholder="e.g. New York"
                className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">OpenAI API Key <span className="text-red-400">*</span></label>
              <input type="password" value={data.openaiApiKey} onChange={e=>set('openaiApiKey',e.target.value)} placeholder="sk-..."
                className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Weather API Key <span className="text-gray-500">(optional)</span></label>
              <input type="password" value={data.weatherApiKey} onChange={e=>set('weatherApiKey',e.target.value)} placeholder="Optional"
                className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500" />
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s=>s-1)} className="flex-1 py-3 border border-[#2d2d44] text-gray-300 hover:text-white rounded-lg transition-colors">Back</button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s=>s+1)} className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white rounded-lg font-semibold">Next</button>
          ) : (
            <button onClick={handleFinish} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white rounded-lg font-semibold disabled:opacity-60">
              {loading ? 'Saving...' : 'Get Started 🎉'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
