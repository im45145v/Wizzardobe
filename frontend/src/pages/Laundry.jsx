import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Droplets } from 'lucide-react'
import { getLaundry, getOverdueLaundry, updateLaundry } from '../services/api'
import toast from 'react-hot-toast'

export default function Laundry() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['laundry'], queryFn: () => getLaundry().then((r) => r.data) })
  const { data: overdue } = useQuery({ queryKey: ['overdue-laundry'], queryFn: () => getOverdueLaundry().then((r) => r.data) })

  const mutation = useMutation({
    mutationFn: ({ id, status }) => updateLaundry(id, status),
    onSuccess: () => {
      toast.success('Laundry updated')
      qc.invalidateQueries({ queryKey: ['laundry'] })
      qc.invalidateQueries({ queryKey: ['overdue-laundry'] })
      qc.invalidateQueries({ queryKey: ['cloths'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not update laundry'),
  })

  const cloths = data?.cloths || []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Laundry</h1>
        <p className="text-sm text-gray-400 mt-1">{overdue?.count || 0} overdue item{overdue?.count === 1 ? '' : 's'}</p>
      </div>

      {isLoading ? <p className="text-gray-400">Loading laundry...</p> : cloths.length ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cloths.map((cloth) => (
            <div key={cloth._id} className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-300"><Droplets size={20} /></div>
                <div className="min-w-0">
                  <h3 className="font-medium text-white truncate">{cloth.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{cloth.category} / {cloth.status.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">Wears since wash: {cloth.wearsSinceWash || 0}/{cloth.maxWearsBeforeLaundry || 'auto'}</p>
                  <p className="text-xs text-gray-500">In laundry: {cloth.daysInLaundry ?? 0} day{cloth.daysInLaundry === 1 ? '' : 's'}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['dirty', 'in_wash', 'clean'].map((status) => (
                  <button key={status} onClick={() => mutation.mutate({ id: cloth._id, status })} className="px-2 py-2 border border-[#2d2d44] hover:bg-[#2d2d44] rounded-lg text-xs text-gray-200 capitalize">
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-8 text-center text-gray-400">
          Nothing is dirty or in wash.
        </div>
      )}
    </div>
  )
}
