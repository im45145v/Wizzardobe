import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CalendarPlus, ExternalLink } from 'lucide-react'
import { createOutfitEvent, getCalendarAuthUrl, getSuggestions } from '../services/api'
import toast from 'react-hot-toast'

export default function Calendar() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [suggestionId, setSuggestionId] = useState('')
  const { data: suggestionsData } = useQuery({ queryKey: ['suggestions'], queryFn: () => getSuggestions().then((r) => r.data) })

  const authMutation = useMutation({
    mutationFn: () => getCalendarAuthUrl(),
    onSuccess: (res) => {
      if (res.data.url) window.location.href = res.data.url
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Calendar auth is not configured'),
  })

  const eventMutation = useMutation({
    mutationFn: () => {
      const suggestion = (suggestionsData?.suggestions || []).find((s) => s._id === suggestionId)
      return createOutfitEvent({ date, outfitItems: suggestion?.outfitItems || [] })
    },
    onSuccess: () => toast.success('Outfit added to Google Calendar'),
    onError: (err) => toast.error(err.response?.data?.message || 'Connect Google Calendar first'),
  })

  const suggestions = suggestionsData?.suggestions || []

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Style Calendar</h1>
        <p className="text-sm text-gray-400 mt-1">Connect Google Calendar and add planned outfits as all-day events.</p>
      </div>

      <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-5 space-y-4">
        <button onClick={() => authMutation.mutate()} className="px-4 py-2 border border-[#2d2d44] hover:bg-[#2d2d44] rounded-lg text-white flex items-center gap-2">
          <ExternalLink size={16} /> Connect Google Calendar
        </button>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm text-gray-400">Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-white" />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-400">Suggestion</span>
            <select value={suggestionId} onChange={(e) => setSuggestionId(e.target.value)} className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-white">
              <option value="">Select an outfit suggestion</option>
              {suggestions.map((s) => <option key={s._id} value={s._id}>{new Date(s.createdAt).toLocaleDateString()} - {(s.outfitItems || []).map((i) => i.clothName).join(', ')}</option>)}
            </select>
          </label>
        </div>
        <button onClick={() => suggestionId && eventMutation.mutate()} disabled={!suggestionId || eventMutation.isPending} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white flex items-center gap-2 disabled:opacity-60">
          <CalendarPlus size={16} /> Add Outfit Event
        </button>
      </div>
    </div>
  )
}
