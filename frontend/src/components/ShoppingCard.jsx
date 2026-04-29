import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateWishlistItem, deleteWishlistItem } from '../services/api'
import { ExternalLink, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const priorityColors = {
  high:   'bg-red-900/40 text-red-400 border-red-700/50',
  medium: 'bg-amber-900/40 text-amber-400 border-amber-700/50',
  low:    'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
}

const statusOptions = ['want', 'ordered', 'purchased']

export default function ShoppingCard({ item }) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (data) => updateWishlistItem(item._id, data),
    onSuccess: () => {
      toast.success('Updated!')
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
    onError: () => toast.error('Failed to update'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteWishlistItem(item._id),
    onSuccess: () => {
      toast.success('Removed from wishlist')
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
    onError: () => toast.error('Failed to delete'),
  })

  return (
    <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-4 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-white text-sm">{item.name}</h3>
          {item.priority && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[item.priority] || priorityColors.medium}`}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </span>
          )}
        </div>
        {item.estimatedPrice && (
          <p className="text-sm text-gray-400">~${item.estimatedPrice}</p>
        )}
        {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
        <div className="flex items-center gap-2 mt-2">
          <select
            value={item.status || 'want'}
            onChange={(e) => updateMutation.mutate({ status: e.target.value })}
            className="text-xs bg-[#2d2d44] text-gray-300 border border-[#3d3d54] rounded-lg px-2 py-1 focus:outline-none"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          {item.link && (
            <a href={item.link} target="_blank" rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors">
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
      <button
        onClick={() => deleteMutation.mutate()}
        disabled={deleteMutation.isPending}
        className="text-gray-500 hover:text-red-400 transition-colors mt-0.5"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
