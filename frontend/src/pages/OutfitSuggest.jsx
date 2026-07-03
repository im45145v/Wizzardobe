import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { getGroups, getSuggestions, suggestOutfit } from '../services/api'
import SuggestionCard from '../components/SuggestionCard'
import OutfitCard from '../components/OutfitCard'
import toast from 'react-hot-toast'

export default function OutfitSuggest() {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    mode: 'safe',
    occasion: '',
    targetDate: new Date().toISOString().split('T')[0],
    needs: '',
    season: '',
    groupIds: [],
    cleanOnly: true,
  })

  const { data: suggestionsData } = useQuery({ queryKey: ['suggestions'], queryFn: () => getSuggestions().then((r) => r.data) })
  const { data: groupData } = useQuery({ queryKey: ['groups'], queryFn: () => getGroups().then((r) => r.data) })

  const suggestMutation = useMutation({
    mutationFn: () => suggestOutfit(form),
    onSuccess: () => {
      toast.success('Suggestion ready')
      qc.invalidateQueries({ queryKey: ['suggestions'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not create suggestion'),
  })

  const latest = suggestionsData?.suggestions?.[0]
  const groups = groupData?.groups || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Outfit Suggestions</h1>
        <p className="text-sm text-gray-400 mt-1">Rule-based first, AI-assisted when your OpenAI key is configured.</p>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-5">
        <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-5 space-y-4 h-fit">
          <label className="space-y-1 block">
            <span className="text-sm text-gray-400">Mode</span>
            <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-white">
              {['safe', 'surprise', 'formal', 'comfy'].map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </label>
          <Field label="Occasion" value={form.occasion} onChange={(v) => setForm({ ...form, occasion: v })} placeholder="work, gym, date-night" />
          <Field label="Target date" type="date" value={form.targetDate} onChange={(v) => setForm({ ...form, targetDate: v })} />
          <Field label="Season" value={form.season} onChange={(v) => setForm({ ...form, season: v })} placeholder="summer, winter" />
          <label className="space-y-1 block">
            <span className="text-sm text-gray-400">Groups</span>
            <select multiple value={form.groupIds} onChange={(e) => setForm({ ...form, groupIds: Array.from(e.target.selectedOptions).map((o) => o.value) })} className="w-full min-h-[92px] bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-white">
              {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 block">
            <span className="text-sm text-gray-400">Needs</span>
            <textarea value={form.needs} onChange={(e) => setForm({ ...form, needs: e.target.value })} rows={3} placeholder="Something breathable, interview-safe, no white shoes..." className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-white outline-none" />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={form.cleanOnly} onChange={(e) => setForm({ ...form, cleanOnly: e.target.checked })} />
            Clean items only
          </label>
          <button onClick={() => suggestMutation.mutate()} disabled={suggestMutation.isPending} className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white flex items-center justify-center gap-2 disabled:opacity-60">
            <Sparkles size={16} /> {suggestMutation.isPending ? 'Building outfit...' : 'Suggest Outfit'}
          </button>
        </div>

        <div className="space-y-5">
          {latest ? <SuggestionCard suggestion={latest} /> : (
            <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-8 text-center text-gray-400">
              Generate a suggestion after adding clean wardrobe items.
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Suggestion History</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {(suggestionsData?.suggestions || []).slice(1).map((suggestion) => (
                <OutfitCard key={suggestion._id} suggestion={suggestion} />
              ))}
            </div>
          </div>
        </div>
      </div>
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
