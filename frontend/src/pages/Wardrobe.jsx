import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { getCloths, getGroups, updateCloth, createGroup } from '../services/api'
import ClothCard from '../components/ClothCard'
import toast from 'react-hot-toast'

const categories = ['', 'top', 'bottom', 'shoes', 'accessory', 'outerwear', 'innerwear']
const statuses = ['', 'clean', 'dirty', 'in_wash']

export default function Wardrobe() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ search: '', category: '', status: '', groupId: '', includeDisabled: true })
  const [groupName, setGroupName] = useState('')

  const params = useMemo(() => ({
    ...filters,
    includeDisabled: String(filters.includeDisabled),
    limit: 100,
  }), [filters])

  const { data, isLoading } = useQuery({ queryKey: ['cloths', params], queryFn: () => getCloths(params).then((r) => r.data) })
  const { data: groupData } = useQuery({ queryKey: ['groups'], queryFn: () => getGroups().then((r) => r.data) })

  const groupMutation = useMutation({
    mutationFn: () => createGroup({ name: groupName, type: 'custom' }),
    onSuccess: () => {
      toast.success('Group created')
      setGroupName('')
      qc.invalidateQueries({ queryKey: ['groups'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not create group'),
  })

  const toggleMutation = useMutation({
    mutationFn: (cloth) => updateCloth(cloth._id, { disabled: !cloth.disabled, disabledReason: cloth.disabled ? '' : 'Temporarily excluded' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cloths'] }),
  })

  const groups = groupData?.groups || []
  const cloths = data?.cloths || []

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Wardrobe</h1>
          <p className="text-sm text-gray-400 mt-1">{data?.total || 0} active item{data?.total === 1 ? '' : 's'} tracked</p>
        </div>
        <button onClick={() => navigate('/wardrobe/add')} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white text-sm flex items-center gap-2">
          <Plus size={16} /> Add Clothing
        </button>
      </div>

      <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-4 space-y-4">
        <div className="grid md:grid-cols-5 gap-3">
          <label className="md:col-span-2 flex items-center gap-2 bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3">
            <Search size={16} className="text-gray-500" />
            <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search name or brand" className="w-full bg-transparent py-2 text-sm text-white outline-none" />
          </label>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-sm text-white">
            {categories.map((c) => <option key={c} value={c}>{c || 'All categories'}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-sm text-white">
            {statuses.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
          </select>
          <select value={filters.groupId} onChange={(e) => setFilters({ ...filters, groupId: e.target.value })} className="bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-sm text-white">
            <option value="">All groups</option>
            {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={filters.includeDisabled} onChange={(e) => setFilters({ ...filters, includeDisabled: e.target.checked })} />
            Show disabled items
          </label>
          <div className="flex gap-2">
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="New group name" className="bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-sm text-white outline-none" />
            <button onClick={() => groupName && groupMutation.mutate()} className="px-3 py-2 border border-[#2d2d44] hover:bg-[#2d2d44] rounded-lg text-sm text-white">Create Group</button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading wardrobe...</div>
      ) : cloths.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cloths.map((cloth) => (
            <div key={cloth._id} className="space-y-2">
              <ClothCard cloth={cloth} />
              <button onClick={() => toggleMutation.mutate(cloth)} className="w-full text-xs px-3 py-2 border border-[#2d2d44] hover:bg-[#2d2d44] rounded-lg text-gray-300 flex items-center justify-center gap-2">
                <SlidersHorizontal size={14} /> {cloth.disabled ? 'Enable for suggestions' : 'Disable for suggestions'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-8 text-center text-gray-400">
          No clothes match these filters.
        </div>
      )}
    </div>
  )
}
