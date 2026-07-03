import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function AnalyticsCard({ icon: Icon, value, label, trend, trendValue, accent = 'purple' }) {
  const accentMap = {
    purple: 'from-violet-600/20 to-violet-600/5 border-violet-600/30',
    pink:   'from-pink-600/20 to-pink-600/5 border-pink-600/30',
    blue:   'from-blue-600/20 to-blue-600/5 border-blue-600/30',
    green:  'from-emerald-600/20 to-emerald-600/5 border-emerald-600/30',
  }
  const iconMap = {
    purple: 'text-violet-400 bg-violet-900/40',
    pink:   'text-pink-400 bg-pink-900/40',
    blue:   'text-blue-400 bg-blue-900/40',
    green:  'text-emerald-400 bg-emerald-900/40',
  }

  return (
    <div className={`bg-gradient-to-br ${accentMap[accent] || accentMap.purple} border rounded-xl p-4`}>
      <div className="flex items-start justify-between mb-3">
        {Icon && (
          <div className={`p-2 rounded-lg ${iconMap[accent] || iconMap.purple}`}>
            <Icon size={20} />
          </div>
        )}
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : <Minus size={14} />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  )
}
