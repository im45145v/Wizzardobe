import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { addCloth, getCloth, getGroups, updateCloth } from '../services/api'
import toast from 'react-hot-toast'

const categories = ['top', 'bottom', 'shoes', 'accessory', 'outerwear', 'innerwear']

export default function ClothForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', category: 'top', color: '', fabric: '', brand: '', condition: 'good',
    occasionTags: '', season: '', tags: '', groupIds: [], maxWearsBeforeLaundry: '',
    purchasePrice: '', disabled: false, disabledReason: '',
  })
  const [image, setImage] = useState(null)

  const { data: clothData } = useQuery({ queryKey: ['cloth', id], queryFn: () => getCloth(id).then((r) => r.data), enabled: editing })
  const { data: groupData } = useQuery({ queryKey: ['groups'], queryFn: () => getGroups().then((r) => r.data) })

  useEffect(() => {
    const cloth = clothData?.cloth
    if (!cloth) return
    setForm({
      name: cloth.name || '',
      category: cloth.category || 'top',
      color: cloth.color || '',
      fabric: cloth.fabric || '',
      brand: cloth.brand || '',
      condition: cloth.condition || 'good',
      occasionTags: (cloth.occasionTags || []).join(', '),
      season: (cloth.season || []).join(', '),
      tags: (cloth.tags || []).join(', '),
      groupIds: (cloth.groupIds || []).map(String),
      maxWearsBeforeLaundry: cloth.maxWearsBeforeLaundry || '',
      purchasePrice: cloth.purchasePrice || '',
      disabled: Boolean(cloth.disabled),
      disabledReason: cloth.disabledReason || '',
    })
  }, [clothData])

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        occasionTags: form.occasionTags.split(',').map((v) => v.trim()).filter(Boolean),
        season: form.season.split(',').map((v) => v.trim()).filter(Boolean),
        tags: form.tags.split(',').map((v) => v.trim()).filter(Boolean),
      }
      if (editing) return updateCloth(id, payload)

      const fd = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        fd.append(key, Array.isArray(value) ? JSON.stringify(value) : value)
      })
      if (image) fd.append('image', image)
      return addCloth(fd)
    },
    onSuccess: () => {
      toast.success(editing ? 'Clothing updated' : 'Clothing added')
      qc.invalidateQueries({ queryKey: ['cloths'] })
      navigate('/wardrobe')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not save clothing'),
  })

  const groups = groupData?.groups || []
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">{editing ? 'Edit Clothing' : 'Add Clothing'}</h1>
        <p className="text-sm text-gray-400 mt-1">Track metadata that helps suggestions, laundry, and analytics stay accurate.</p>
      </div>

      <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-5 grid md:grid-cols-2 gap-4">
        <Field label="Name" value={form.name} onChange={(v) => set('name', v)} required />
        <label className="space-y-1">
          <span className="text-sm text-gray-400">Category</span>
          <select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-white">
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <Field label="Color" value={form.color} onChange={(v) => set('color', v)} />
        <Field label="Fabric" value={form.fabric} onChange={(v) => set('fabric', v)} />
        <Field label="Brand" value={form.brand} onChange={(v) => set('brand', v)} />
        <Field label="Purchase price" type="number" value={form.purchasePrice} onChange={(v) => set('purchasePrice', v)} />
        <Field label="Occasions" value={form.occasionTags} onChange={(v) => set('occasionTags', v)} placeholder="work, party, casual" />
        <Field label="Seasons" value={form.season} onChange={(v) => set('season', v)} placeholder="summer, winter" />
        <Field label="Tags" value={form.tags} onChange={(v) => set('tags', v)} placeholder="linen, favorite, date-night" />
        <Field label="Max wears before laundry" type="number" value={form.maxWearsBeforeLaundry} onChange={(v) => set('maxWearsBeforeLaundry', v)} placeholder="leave blank for category default" />
        {!editing && (
          <label className="space-y-1">
            <span className="text-sm text-gray-400">Image</span>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="w-full text-sm text-gray-300" />
          </label>
        )}
        <label className="space-y-1">
          <span className="text-sm text-gray-400">Groups</span>
          <select multiple value={form.groupIds} onChange={(e) => set('groupIds', Array.from(e.target.selectedOptions).map((o) => o.value))} className="w-full min-h-[90px] bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-white">
            {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300 md:col-span-2">
          <input type="checkbox" checked={form.disabled} onChange={(e) => set('disabled', e.target.checked)} />
          Disable this item from suggestions
        </label>
        {form.disabled && <Field label="Disabled reason" value={form.disabledReason} onChange={(v) => set('disabledReason', v)} />}
      </div>

      <div className="flex gap-3">
        <button onClick={() => navigate('/wardrobe')} className="px-4 py-2 border border-[#2d2d44] hover:bg-[#2d2d44] rounded-lg text-gray-200">Cancel</button>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white disabled:opacity-60">
          {mutation.isPending ? 'Saving...' : 'Save Clothing'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <label className="space-y-1">
      <span className="text-sm text-gray-400">{label}</span>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 text-white outline-none focus:border-violet-500" />
    </label>
  )
}
