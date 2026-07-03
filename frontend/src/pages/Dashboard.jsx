import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDashboardStats, getSuggestions, getOverdueLaundry, suggestOutfit } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Shirt, Sparkles, Droplets, Plus } from 'lucide-react'
import AlertBanner from '../components/AlertBanner'
import LoadingSkeleton from '../components/LoadingSkeleton'
import SuggestionCard from '../components/SuggestionCard'
import AnalyticsCard from '../components/AnalyticsCard'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [overdueAlert, setOverdueAlert] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => getDashboardStats().then(r=>r.data) })
  const { data: suggestions } = useQuery({ queryKey: ['suggestions'], queryFn: () => getSuggestions().then(r=>r.data) })
  const { data: overdue } = useQuery({ queryKey: ['overdue-laundry'], queryFn: () => getOverdueLaundry().then(r=>r.data) })

  const suggestMutation = useMutation({
    mutationFn: () => suggestOutfit({ mode: 'safe' }),
    onSuccess: () => { toast.success('New suggestion ready!'); qc.invalidateQueries({ queryKey: ['suggestions'] }) },
    onError: () => toast.error('Failed to get suggestion'),
  })

  const latestSuggestion = suggestions?.suggestions?.[0] || suggestions?.[0]
  const overdueCount = overdue?.items?.length || overdue?.length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{greeting}, {user?.name?.split(' ')[0] || 'there'}!</h1>
        <p className="text-gray-400 mt-1">Here's your wardrobe overview for today.</p>
      </div>

      {overdueCount > 0 && overdueAlert && (
        <AlertBanner type="warning" message={`You have ${overdueCount} item${overdueCount>1?'s':''} overdue for laundry!`} onDismiss={() => setOverdueAlert(false)} />
      )}

      {statsLoading ? <LoadingSkeleton variant="list" count={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsCard icon={Shirt} value={stats?.totalCloths ?? stats?.total ?? '—'} label="Total Clothes" accent="purple" />
          <AnalyticsCard icon={Shirt} value={stats?.cleanItems ?? stats?.clean ?? '—'} label="Clean Items" accent="green" />
          <AnalyticsCard icon={Droplets} value={stats?.dirtyItems ?? stats?.dirty ?? '—'} label="Dirty / In Wash" accent="pink" />
          <AnalyticsCard icon={Sparkles} value={stats?.outfitsThisWeek ?? stats?.wornThisWeek ?? '—'} label="Outfits This Week" accent="blue" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Today's Suggestion</h2>
            <button onClick={() => suggestMutation.mutate()} disabled={suggestMutation.isPending}
              className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white text-xs rounded-lg font-medium transition-all disabled:opacity-60 flex items-center gap-1.5">
              <Sparkles size={14} /> {suggestMutation.isPending ? 'Thinking...' : 'Get AI Suggestion'}
            </button>
          </div>
          {latestSuggestion ? <SuggestionCard suggestion={latestSuggestion} /> : (
            <div className="text-center py-8 text-gray-500">
              <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Click "Get AI Suggestion" to get your first outfit recommendation</p>
            </div>
          )}
        </div>

        <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => navigate('/wardrobe/add')}
              className="flex items-center gap-3 p-3 bg-[#2d2d44] hover:bg-[#3d3d54] rounded-lg text-left transition-colors">
              <div className="w-8 h-8 bg-violet-600/30 rounded-lg flex items-center justify-center"><Plus size={16} className="text-violet-400" /></div>
              <div><p className="text-sm text-white font-medium">Add Clothing</p><p className="text-xs text-gray-400">Add a new item to your wardrobe</p></div>
            </button>
            <button onClick={() => navigate('/outfits/suggest')}
              className="flex items-center gap-3 p-3 bg-[#2d2d44] hover:bg-[#3d3d54] rounded-lg text-left transition-colors">
              <div className="w-8 h-8 bg-pink-600/30 rounded-lg flex items-center justify-center"><Sparkles size={16} className="text-pink-400" /></div>
              <div><p className="text-sm text-white font-medium">Get Outfit Suggestion</p><p className="text-xs text-gray-400">AI-powered outfit recommendations</p></div>
            </button>
            <button onClick={() => navigate('/laundry')}
              className="flex items-center gap-3 p-3 bg-[#2d2d44] hover:bg-[#3d3d54] rounded-lg text-left transition-colors">
              <div className="w-8 h-8 bg-blue-600/30 rounded-lg flex items-center justify-center"><Droplets size={16} className="text-blue-400" /></div>
              <div><p className="text-sm text-white font-medium">Update Laundry</p><p className="text-xs text-gray-400">Track your dirty and clean clothes</p></div>
            </button>
          </div>
        </div>
      </div>

      {suggestions?.suggestions?.length > 1 && (
        <div>
          <h2 className="font-semibold text-white mb-3">Recent Suggestions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {suggestions.suggestions.slice(1, 5).map(s => (
              <div key={s._id} className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">{new Date(s.createdAt).toLocaleDateString()}</p>
                <div className="flex flex-wrap gap-1">{(s.items||[]).slice(0,4).map((item,i)=>(
                  <span key={i} className="text-xs px-2 py-0.5 bg-[#2d2d44] text-gray-300 rounded-full">{typeof item==='string'?item:item.name}</span>
                ))}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
