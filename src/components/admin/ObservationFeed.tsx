import { Observation } from '../../types'
import { getCategoryMeta } from '../../lib/constants'

interface ObservationFeedProps {
  data: Observation[]
  eventId: string
  maxItems?: number
}

export function ObservationFeed({ data, eventId, maxItems = 20 }: ObservationFeedProps) {
  const items = data.slice(0, maxItems)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-black/30">
        <span className="text-4xl">📋</span>
        <p className="mt-2 text-sm font-medium">Belum ada observasi</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
      {items.map((item) => {
        const { label, emoji, color } = getCategoryMeta(eventId, item.category)

        return (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-2xl bg-[#F7F7F7] p-3 transition hover:bg-gray-100"
          >
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
              style={{ backgroundColor: color + '20' }}
            >
              {emoji}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-black text-sm text-gray-900 truncate">{item.group}</p>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ color, backgroundColor: color + '20' }}
                >
                  {label}
                </span>
              </div>
              {item.note && (
                <p className="mt-0.5 text-xs text-black/50 line-clamp-2 leading-relaxed">{item.note}</p>
              )}
              {item.createdAt && (
                <p className="mt-1 text-xs text-black/30">
                  {item.createdAt.toLocaleString('id-ID', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>

            {item.image && (
              <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
            )}
          </div>
        )
      })}

      {data.length > maxItems && (
        <p className="text-center text-xs text-black/30 py-2">
          +{data.length - maxItems} observasi lainnya
        </p>
      )}
    </div>
  )
}