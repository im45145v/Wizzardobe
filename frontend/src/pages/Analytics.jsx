import { useQuery } from '@tanstack/react-query'
import { getCostPerWear, getDashboardStats, getLeastWorn, getMostWorn } from '../services/api'
import AnalyticsCard from '../components/AnalyticsCard'
import { BarChart3, Droplets, Shirt, Sparkles } from 'lucide-react'

export default function Analytics() {
  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => getDashboardStats().then((r) => r.data) })
  const { data: most } = useQuery({ queryKey: ['most-worn'], queryFn: () => getMostWorn().then((r) => r.data) })
  const { data: least } = useQuery({ queryKey: ['least-worn'], queryFn: () => getLeastWorn().then((r) => r.data) })
  const { data: cost } = useQuery({ queryKey: ['cost-per-wear'], queryFn: () => getCostPerWear().then((r) => r.data) })

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard icon={Shirt} value={stats?.totalCloths || 0} label="Total Clothes" accent="purple" />
        <AnalyticsCard icon={Sparkles} value={stats?.cleanItems || 0} label="Clean Items" accent="green" />
        <AnalyticsCard icon={Droplets} value={stats?.dirtyItems || 0} label="Laundry Items" accent="pink" />
        <AnalyticsCard icon={BarChart3} value={stats?.outfitsThisWeek || 0} label="Outfits This Week" accent="blue" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <List title="Most Worn" items={most?.cloths || []} subtitle={(item) => `${item.wearCount || 0} wears`} />
        <List title="Least Worn" items={least?.cloths || []} subtitle={(item) => item.lastWornDate ? new Date(item.lastWornDate).toLocaleDateString() : 'Never worn'} />
        <List title="Best Cost Per Wear" items={cost?.data || []} name={(item) => item.cloth?.name} subtitle={(item) => `$${item.costPerWear}`} />
      </div>
    </div>
  )
}

function List({ title, items, name = (item) => item.name, subtitle }) {
  return (
    <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-4">
      <h2 className="font-semibold text-white mb-3">{title}</h2>
      <div className="space-y-2">
        {items.slice(0, 8).map((item, index) => (
          <div key={item._id || item.cloth?._id || index} className="flex justify-between gap-3 text-sm">
            <span className="text-gray-300 truncate">{name(item)}</span>
            <span className="text-gray-500 flex-shrink-0">{subtitle(item)}</span>
          </div>
        ))}
        {!items.length && <p className="text-sm text-gray-500">No data yet.</p>}
      </div>
    </div>
  )
}
