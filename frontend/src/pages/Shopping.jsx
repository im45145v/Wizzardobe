import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { addToWishlist, analyzeGaps, deleteWishlistItem, getWishlist, updateWishlistItem } from '../services/api'
import toast from 'react-hot-toast'

export default function Shopping() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', category: 'top', reason: '', priority: 'medium', link: '', estimatedPrice: '' })
  const [gaps, setGaps] = useState([])
  const { data } = useQuery({ queryKey: ['wishlist'], queryFn: () => getWishlist().then((r) => r.data) })

  const addMutation = useMutation({
    mutationFn: (payload) => addToWishlist(payload || form),
    onSuccess: () => {
      setForm({ name: '', category: 'top', reason: '', priority: 'medium', link: '', estimatedPrice: '' })
      qc.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Wishlist updated')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not add item'),
  })

  const gapMutation = useMutation({
    mutationFn: () => analyzeGaps(),
    onSuccess: (res) => setGaps(res.data.suggestions || []),
    onError: (err) => toast.error(err.response?.data?.message || 'OpenAI key required for gap analysis'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateWishlistItem(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWishlistItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Shopping Assistant</h1>
        <p className="text-sm text-gray-400 mt-1">Wishlist and real wardrobe gap analysis. No fake product search.</p>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-5">
        <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-5 space-y-3 h-fit">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Field label="Reason" value={form.reason} onChange={(v) => setForm({ ...form, reason: v })} />
          <Field label="Link" value={form.link} onChange={(v) => setForm({ ...form, link: v })} />
          <Field label="Estimated price" type="number" value={form.estimatedPrice} onChange={(v) => setForm({ ...form, estimatedPrice: v })} />
          <button onClick={() => form.name && addMutation.mutate()} disabled={addMutation.isPending} className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white flex items-center justify-center gap-2 disabled:opacity-60">
            <Plus size={16} /> Add Wishlist Item
          </button>
          <button onClick={() => gapMutation.mutate()} disabled={gapMutation.isPending} className="w-full px-4 py-2 border border-[#2d2d44] hover:bg-[#2d2d44] rounded-lg text-white flex items-center justify-center gap-2 disabled:opacity-60">
            <Sparkles size={16} /> Analyze Wardrobe Gaps
          </button>
        </div>

        <div className="space-y-4">
          {gaps.length > 0 && (
            <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-4">
              <h2 className="font-semibold text-white mb-3">AI Gap Suggestions</h2>
              <div className="space-y-2">
                {gaps.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 border border-[#2d2d44] rounded-lg p-3">
                    <div>
                      <p className="text-sm text-white">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.reason}</p>
                    </div>
                    <button onClick={() => addMutation.mutate(item)} className="text-xs px-3 py-1.5 bg-violet-600 rounded-lg text-white">Add</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {(data?.items || []).map((item) => (
              <div key={item._id} className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-4 space-y-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-white">{item.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{item.category} / {item.priority}</p>
                  </div>
                  <button onClick={() => deleteMutation.mutate(item._id)} className="text-red-400"><Trash2 size={16} /></button>
                </div>
                {item.reason && <p className="text-sm text-gray-400">{item.reason}</p>}
                <select value={item.status} onChange={(e) => statusMutation.mutate({ id: item._id, status: e.target.value })} className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-sm text-white">
                  {['wishlist', 'purchased', 'rejected'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="space-y-1 block">
      <span className="text-sm text-gray-400">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-white outline-none focus:border-violet-500" />
    </label>
  )
}
