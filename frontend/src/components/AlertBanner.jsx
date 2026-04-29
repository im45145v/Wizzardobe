import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react'

const typeConfig = {
  warning: { icon: AlertTriangle, bg: 'bg-amber-900/40', border: 'border-amber-500/50', text: 'text-amber-300', iconColor: 'text-amber-400' },
  error:   { icon: AlertCircle,   bg: 'bg-red-900/40',   border: 'border-red-500/50',   text: 'text-red-300',   iconColor: 'text-red-400' },
  info:    { icon: Info,          bg: 'bg-blue-900/40',  border: 'border-blue-500/50',  text: 'text-blue-300',  iconColor: 'text-blue-400' },
  success: { icon: CheckCircle,   bg: 'bg-emerald-900/40', border: 'border-emerald-500/50', text: 'text-emerald-300', iconColor: 'text-emerald-400' },
}

export default function AlertBanner({ type = 'info', message, onDismiss }) {
  const cfg = typeConfig[type] || typeConfig.info
  const Icon = cfg.icon

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${cfg.bg} ${cfg.border} mb-4`}
        >
          <Icon size={18} className={cfg.iconColor} />
          <span className={`flex-1 text-sm ${cfg.text}`}>{message}</span>
          {onDismiss && (
            <button onClick={onDismiss} className="text-gray-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
