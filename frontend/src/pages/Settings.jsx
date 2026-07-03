import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { updateApiKey, updateProfile } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const styles = ['streetwear', 'minimalist', 'formal', 'casual']

export default function Settings() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState({
    name: user?.name || '',
    gender: user?.profile?.gender || '',
    bodyType: user?.profile?.bodyType || '',
    skinTone: user?.profile?.skinTone || '',
    stylePreference: user?.profile?.stylePreference || 'casual',
    occasions: (user?.profile?.occasions || []).join(', '),
    location: user?.profile?.location || '',
    profileImageUrl: user?.profile?.profileImageUrl || '',
  })
  const [settings, setSettings] = useState({
    cooldownDays: user?.settings?.cooldownDays ?? 3,
    laundryAlertDays: user?.settings?.laundryAlertDays ?? 10,
    top: user?.settings?.wearBeforeDirty?.top ?? 3,
    bottom: user?.settings?.wearBeforeDirty?.bottom ?? 3,
    innerwear: user?.settings?.wearBeforeDirty?.innerwear ?? 1,
    shoes: user?.settings?.wearBeforeDirty?.shoes ?? 5,
    outerwear: user?.settings?.wearBeforeDirty?.outerwear ?? 7,
  })
  const [keys, setKeys] = useState({ openaiApiKey: '', weatherApiKey: '' })

  const profileMutation = useMutation({
    mutationFn: () => updateProfile({
      name: profile.name,
      profile: {
        gender: profile.gender,
        bodyType: profile.bodyType,
        skinTone: profile.skinTone,
        stylePreference: profile.stylePreference,
        occasions: profile.occasions.split(',').map((v) => v.trim()).filter(Boolean),
        location: profile.location,
        profileImageUrl: profile.profileImageUrl,
      },
      settings: {
        cooldownDays: Number(settings.cooldownDays),
        laundryAlertDays: Number(settings.laundryAlertDays),
        wearBeforeDirty: {
          top: Number(settings.top),
          bottom: Number(settings.bottom),
          innerwear: Number(settings.innerwear),
          shoes: Number(settings.shoes),
          outerwear: Number(settings.outerwear),
        },
      },
    }),
    onSuccess: (res) => {
      updateUser(res.data.user)
      toast.success('Settings saved')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not save settings'),
  })

  const keyMutation = useMutation({
    mutationFn: () => {
      const payload = {}
      if (keys.openaiApiKey) payload.openaiApiKey = keys.openaiApiKey
      if (keys.weatherApiKey) payload.weatherApiKey = keys.weatherApiKey
      if (!Object.keys(payload).length) throw new Error('Enter a key to update')
      return updateApiKey(payload)
    },
    onSuccess: (res) => {
      updateUser(res.data.user)
      setKeys({ openaiApiKey: '', weatherApiKey: '' })
      toast.success('API keys updated')
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Could not update API keys'),
  })

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage profile, AI access, and laundry rules.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-white">Profile</h2>
          <Field label="Name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} />
          <Field label="Location" value={profile.location} onChange={(v) => setProfile({ ...profile, location: v })} />
          <Field label="Profile image URL" value={profile.profileImageUrl} onChange={(v) => setProfile({ ...profile, profileImageUrl: v })} />
          <Field label="Gender" value={profile.gender} onChange={(v) => setProfile({ ...profile, gender: v })} />
          <Field label="Body type" value={profile.bodyType} onChange={(v) => setProfile({ ...profile, bodyType: v })} />
          <Field label="Skin tone" value={profile.skinTone} onChange={(v) => setProfile({ ...profile, skinTone: v })} />
          <label className="space-y-1 block">
            <span className="text-sm text-gray-400">Style preference</span>
            <select value={profile.stylePreference} onChange={(e) => setProfile({ ...profile, stylePreference: e.target.value })} className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-white">
              {styles.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <Field label="Occasions" value={profile.occasions} onChange={(v) => setProfile({ ...profile, occasions: v })} placeholder="work, university, party" />
        </section>

        <section className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-white">Laundry and Repetition</h2>
          <Field label="Cooldown days" type="number" value={settings.cooldownDays} onChange={(v) => setSettings({ ...settings, cooldownDays: v })} />
          <Field label="Laundry alert days" type="number" value={settings.laundryAlertDays} onChange={(v) => setSettings({ ...settings, laundryAlertDays: v })} />
          {['top', 'bottom', 'innerwear', 'shoes', 'outerwear'].map((key) => (
            <Field key={key} label={`${key} wears before laundry`} type="number" value={settings[key]} onChange={(v) => setSettings({ ...settings, [key]: v })} />
          ))}
        </section>
      </div>

      <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white disabled:opacity-60">
        Save Profile and Settings
      </button>

      <section className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-white">AI Keys</h2>
          <p className="text-sm text-gray-400 mt-1">OpenAI key configured: {user?.hasOpenAIKey ? 'yes' : 'no'}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="OpenAI API key" type="password" value={keys.openaiApiKey} onChange={(v) => setKeys({ ...keys, openaiApiKey: v })} placeholder="sk-..." />
          <Field label="Weather API key" type="password" value={keys.weatherApiKey} onChange={(v) => setKeys({ ...keys, weatherApiKey: v })} placeholder="optional" />
        </div>
        <button onClick={() => keyMutation.mutate()} disabled={keyMutation.isPending} className="px-4 py-2 border border-[#2d2d44] hover:bg-[#2d2d44] rounded-lg text-white disabled:opacity-60">
          Save API Keys
        </button>
      </section>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="space-y-1 block">
      <span className="text-sm text-gray-400">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-white outline-none focus:border-violet-500" />
    </label>
  )
}
