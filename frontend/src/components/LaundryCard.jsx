import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateLaundry } from '../services/api'
import toast from 'react-hot-toast'

const statusBorder = {
  dirty: 'border-l-red-500',
  in_wash: 'border-l-amber-500',
  overdue: 'border-l-rose-600',
}

export default function LaundryCard({ cloth, status }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (newStatus) => updateLaundry(cloth._id, newStatus),
    onSuccess: () => {
      toast.success('Status updated!')
      queryClient.invalidateQueries({ queryKey: ['laundry'] })
      queryClient.invalidateQueries({ queryKey: ['overdue-laundry'] })
    },
    onError: () => toast.error('Failed to update status'),
  })

  const daysSince = cloth.lastWashed
    ? Math.floor((Date.now() - new Date(cloth.lastWashed)) / 86400000)
    : cloth.daysSinceDirty || 0

  const borderColor = statusBorder[status] || statusBorder.dirty

  return (
    <div className={`bg-[#1a1a2e] border border-[#2d2d44] border-l-4 ${borderColor} rounded-xl p-4 flex items-center gap-4`}>
      {/* Image */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
        {cloth.imageUrl ? (
          <img src={cloth.imageUrl} alt={cloth.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-pink-900/40 flex items-center justify-center">
            <span>👕</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm truncate">{cloth.name}</p>
        <p className="text-xs text-gray-400">{cloth.category}</p>
        {daysSince > 0 && (
          <p className="text-xs text-gray-500">{daysSince} day{daysSince !== 1 ? 's' : ''} since marked dirty</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        {status !== 'clean' && (
          <button
            onClick={() => mutation.mutate('clean')}
            disabled={mutation.isPending}
            className="text-xs px-2 py-1 bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60 rounded-lg border border-emerald-700/50 transition-colors"
          >
            ✓ Clean
          </button>
        )}
        {status === 'dirty' || status === 'overdue' ? (
          <button
            onClick={() => mutation.mutate('in_wash')}
            disabled={mutation.isPending}
            className="text-xs px-2 py-1 bg-amber-900/40 text-amber-400 hover:bg-amber-900/60 rounded-lg border border-amber-700/50 transition-colors"
          >
            ↺ In Wash
          </button>
        ) : null}
      </div>
    </div>
  )
}
