import { useMutation, useQueryClient } from '@tanstack/react-query'
import { wearSuggestion, rateSuggestion } from '../services/api'
import StarRating from './StarRating'
import toast from 'react-hot-toast'

export default function OutfitCard({ suggestion }) {
  const queryClient = useQueryClient()

  const wearMutation = useMutation({
    mutationFn: () => wearSuggestion(suggestion._id),
    onSuccess: () => {
      toast.success('Outfit marked as worn!')
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
    },
    onError: () => toast.error('Failed to update'),
  })

  const rateMutation = useMutation({
    mutationFn: (rating) => rateSuggestion(suggestion._id, rating),
    onSuccess: () => {
      toast.success('Rating saved!')
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
    },
  })

  const items = suggestion.outfitItems || suggestion.items || []

  return (
    <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500">
            {suggestion.occasion && <span className="text-violet-400">{suggestion.occasion} · </span>}
            {suggestion.createdAt && new Date(suggestion.createdAt).toLocaleDateString()}
          </p>
        </div>
        <StarRating value={suggestion.rating || 0} onChange={(r) => rateMutation.mutate(r)} size={16} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {items.map((item, i) => (
          <span key={i} className="text-xs px-2 py-1 bg-[#2d2d44] text-gray-300 rounded-full">
            {typeof item === 'string' ? item : item.clothName || item.name}
          </span>
        ))}
      </div>

      {(suggestion.aiReasoning || suggestion.reasoning) && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{suggestion.aiReasoning || suggestion.reasoning}</p>
      )}

      <button
        onClick={() => wearMutation.mutate()}
        disabled={wearMutation.isPending}
        className="w-full py-1.5 text-xs bg-gradient-to-r from-violet-600/30 to-pink-600/30 hover:from-violet-600/50 hover:to-pink-600/50 border border-violet-600/30 text-white rounded-lg transition-all"
      >
        {wearMutation.isPending ? 'Updating...' : 'Wear Again'}
      </button>
    </div>
  )
}
