export default function LoadingSkeleton({ variant = 'card', count = 1 }) {
  const pulse = 'animate-pulse bg-[#2d2d44] rounded'

  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`${pulse} h-4 w-full`} style={{ width: `${80 - i * 10}%` }} />
        ))}
      </div>
    )
  }

  if (variant === 'image') {
    return <div className={`${pulse} w-full aspect-square`} />
  }

  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-[#1a1a2e] rounded-lg">
            <div className={`${pulse} w-10 h-10 rounded-full flex-shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`${pulse} h-4 w-1/2`} />
              <div className={`${pulse} h-3 w-3/4`} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // card variant
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#1a1a2e] rounded-xl overflow-hidden">
          <div className={`${pulse} w-full aspect-square`} />
          <div className="p-3 space-y-2">
            <div className={`${pulse} h-4 w-3/4`} />
            <div className={`${pulse} h-3 w-1/2`} />
            <div className="flex gap-1">
              <div className={`${pulse} h-5 w-16 rounded-full`} />
              <div className={`${pulse} h-5 w-12 rounded-full`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
