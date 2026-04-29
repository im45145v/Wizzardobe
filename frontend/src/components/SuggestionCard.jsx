import { useMutation, useQueryClient } from '@tanstack/react-query'
import { wearSuggestion, rateSuggestion } from '../services/api'
import StarRating from './StarRating'
import toast from 'react-hot-toast'

export default function SuggestionCard({ suggestion }) {
  const queryClient = useQueryClient()

  const wearMutation = useMutation({
    mutationFn: () => wearSuggestion(suggestion._id),
    onSuccess: () => {
      toast.success('Outfit marked as worn today!')
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
    },
    onError: () => toast.error('Failed to update'),
  })

  const rateMutation = useMutation({
    mutationFn: (rating) => rateSuggestion(suggestion._id, rating),
    onSuccess: () => toast.success('Rating saved!'),
  })

  const items = suggestion.items || []

  return (
    <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">AI Outfit Suggestion</h3>
        {suggestion.occasion && (
          <span className="text-xs px-3 py-1 bg-violet-900/40 text-violet-300 rounded-full border border-violet-700/50">
            {suggestion.occasion}
          </span>
        )}
      </div>

      {/* Outfit items grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {items.map((item, i) => (
          <div key={i} className="bg-[#2d2d44] rounded-lg p-3 text-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600/30 to-pink-600/30 mx-auto mb-2 flex items-center justify-center">
              <span className="text-lg">👕</span>
            </div>
            <p className="text-xs text-gray-300 truncate">{typeof item === 'string' ? item : item.name}</p>
            {item.category && <p className="text-xs text-gray-500">{item.category}</p>}
          </div>
        ))}
      </div>

      {suggestion.reasoning && (
        <div className="bg-[#0f0f1a] rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-400 leading-relaxed">{suggestion.reasoning}</p>
        </div>
      )}

      {suggestion.weather && (
        <p className="text-xs text-gray-500 mb-3">🌤 {suggestion.weather}</p>
      )}

      <div className="flex items-center justify-between">
        <StarRating value={suggestion.rating || 0} onChange={(r) => rateMutation.mutate(r)} />
        <button
          onClick={() => wearMutation.mutate()}
          disabled={wearMutation.isPending}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-60"
        >
          {wearMutation.isPending ? 'Saving...' : 'Wear This Today ✓'}
        </button>
      </div>
    </div>
  )
}
