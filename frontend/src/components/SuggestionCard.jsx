import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, Image } from 'lucide-react'
import { wearSuggestion, rateSuggestion, createOutfitEvent, visualizeSuggestion } from '../services/api'
import StarRating from './StarRating'
import toast from 'react-hot-toast'

const imageSrc = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`
}

export default function SuggestionCard({ suggestion }) {
  const queryClient = useQueryClient()
  const items = suggestion.outfitItems || suggestion.items || []
  const [visual, setVisual] = useState(null)

  const wearMutation = useMutation({
    mutationFn: () => wearSuggestion(suggestion._id),
    onSuccess: () => {
      toast.success('Outfit marked as worn today')
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['cloths'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  })

  const rateMutation = useMutation({
    mutationFn: (rating) => rateSuggestion(suggestion._id, rating),
    onSuccess: () => {
      toast.success('Rating saved')
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
    },
  })

  const calendarMutation = useMutation({
    mutationFn: () => createOutfitEvent({
      date: suggestion.targetDate || new Date().toISOString(),
      outfitItems: items,
    }),
    onSuccess: () => toast.success('Added to Google Calendar'),
    onError: (err) => toast.error(err.response?.data?.message || 'Connect Google Calendar first'),
  })

  const visualMutation = useMutation({
    mutationFn: () => visualizeSuggestion(suggestion._id),
    onSuccess: (res) => setVisual(res.data.image),
    onError: (err) => toast.error(err.response?.data?.message || 'OpenAI key required for visualization'),
  })

  return (
    <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-white">Outfit Suggestion</h3>
          <p className="text-xs text-gray-500 mt-1">{suggestion.source === 'ai' ? 'AI-assisted' : 'Rule-based'} recommendation</p>
        </div>
        {suggestion.occasion && (
          <span className="text-xs px-3 py-1 bg-violet-900/40 text-violet-300 rounded-full border border-violet-700/50">
            {suggestion.occasion}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {items.map((item, i) => (
          <div key={item.clothId || i} className="bg-[#2d2d44] rounded-lg p-3 text-center min-h-[92px]">
            {item.imageUrl ? (
              <img src={imageSrc(item.imageUrl)} alt={item.clothName || item.name} className="w-10 h-10 rounded-full object-cover mx-auto mb-2" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-violet-600/25 mx-auto mb-2 flex items-center justify-center text-sm text-violet-200">
                {item.category?.[0]?.toUpperCase() || 'W'}
              </div>
            )}
            <p className="text-xs text-gray-300 truncate">{item.clothName || item.name}</p>
            {item.category && <p className="text-xs text-gray-500 capitalize">{item.category}</p>}
          </div>
        ))}
      </div>

      {(suggestion.aiReasoning || suggestion.reasoning) && (
        <div className="bg-[#0f0f1a] rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-400 leading-relaxed">{suggestion.aiReasoning || suggestion.reasoning}</p>
        </div>
      )}

      {visual?.b64_json && <img src={`data:image/png;base64,${visual.b64_json}`} alt="Generated outfit visualization" className="w-full rounded-lg border border-[#2d2d44] mb-4" />}
      {visual?.url && <img src={visual.url} alt="Generated outfit visualization" className="w-full rounded-lg border border-[#2d2d44] mb-4" />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StarRating value={suggestion.rating || 0} onChange={(r) => rateMutation.mutate(r)} />
        <div className="flex gap-2">
          <button
            onClick={() => visualMutation.mutate()}
            disabled={visualMutation.isPending}
            className="px-3 py-2 border border-[#2d2d44] hover:bg-[#2d2d44] text-gray-200 text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            <Image size={16} /> Visualize
          </button>
          <button
            onClick={() => calendarMutation.mutate()}
            disabled={calendarMutation.isPending}
            className="px-3 py-2 border border-[#2d2d44] hover:bg-[#2d2d44] text-gray-200 text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            <CalendarPlus size={16} /> Calendar
          </button>
          <button
            onClick={() => wearMutation.mutate()}
            disabled={wearMutation.isPending || suggestion.wasWorn}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-60"
          >
            {suggestion.wasWorn ? 'Worn' : wearMutation.isPending ? 'Saving...' : 'Wear Today'}
          </button>
        </div>
      </div>
    </div>
  )
}
