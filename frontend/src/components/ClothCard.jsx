import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, RefreshCw, Trash2, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markWorn, updateClothStatus, deleteCloth } from '../services/api'
import toast from 'react-hot-toast'

const statusColors = {
  clean: 'bg-emerald-900/50 text-emerald-400 border-emerald-700',
  dirty: 'bg-red-900/50 text-red-400 border-red-700',
  in_wash: 'bg-amber-900/50 text-amber-400 border-amber-700',
}

export default function ClothCard({ cloth }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const wornMutation = useMutation({
    mutationFn: () => markWorn(cloth._id),
    onSuccess: () => {
      toast.success('Marked as worn!')
      queryClient.invalidateQueries({ queryKey: ['cloths'] })
    },
    onError: () => toast.error('Failed to mark as worn'),
  })

  const statusMutation = useMutation({
    mutationFn: (status) => updateClothStatus(cloth._id, status),
    onSuccess: () => {
      toast.success('Status updated!')
      queryClient.invalidateQueries({ queryKey: ['cloths'] })
      setShowStatusMenu(false)
    },
    onError: () => toast.error('Failed to update status'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCloth(cloth._id),
    onSuccess: () => {
      toast.success('Item deleted')
      queryClient.invalidateQueries({ queryKey: ['cloths'] })
    },
    onError: () => toast.error('Failed to delete item'),
  })

  const lastWorn = cloth.lastWorn
    ? new Date(cloth.lastWorn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Never worn'

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl overflow-hidden group relative"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        {cloth.imageUrl ? (
          <img src={cloth.imageUrl} alt={cloth.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-pink-900/40 flex items-center justify-center">
            <span className="text-4xl">👕</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => navigate(`/wardrobe/edit/${cloth._id}`)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => wornMutation.mutate()}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            title="Mark Worn"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-white text-sm truncate">{cloth.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${statusColors[cloth.status] || statusColors.clean}`}>
            {cloth.status === 'in_wash' ? 'In Wash' : cloth.status?.charAt(0).toUpperCase() + cloth.status?.slice(1)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {cloth.category && (
            <span className="text-xs px-2 py-0.5 bg-violet-900/40 text-violet-300 rounded-full border border-violet-700/50">
              {cloth.category}
            </span>
          )}
          {cloth.color && (
            <span className="text-xs px-2 py-0.5 bg-[#2d2d44] text-gray-300 rounded-full">
              {cloth.color}
            </span>
          )}
        </div>

        {cloth.occasion?.slice(0, 2).map((occ) => (
          <span key={occ} className="inline-block text-xs px-2 py-0.5 bg-[#2d2d44] text-gray-400 rounded-full mr-1 mb-1">
            {occ}
          </span>
        ))}

        <p className="text-xs text-gray-500 mt-1">Last worn: {lastWorn}</p>

        {/* Status changer */}
        <div className="relative mt-2">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Change status <ChevronDown size={12} />
          </button>
          {showStatusMenu && (
            <div className="absolute bottom-full left-0 mb-1 bg-[#2d2d44] rounded-lg overflow-hidden shadow-xl z-10 min-w-[120px]">
              {['clean', 'dirty', 'in_wash'].map((s) => (
                <button
                  key={s}
                  onClick={() => statusMutation.mutate(s)}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#3d3d54] transition-colors"
                >
                  {s === 'in_wash' ? 'In Wash' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
