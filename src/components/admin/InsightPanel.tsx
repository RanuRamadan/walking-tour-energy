import { AnalyticsData } from '../../types'
import { EVENT_CONFIGS } from '../../lib/constants'

interface InsightPanelProps {
  analytics: AnalyticsData
  eventId: string
}

export function InsightPanel({ analytics, eventId }: InsightPanelProps) {
  const config = EVENT_CONFIGS[eventId]
  const { total, byCategory, insight } = analytics

  return (
    <div className="space-y-5">

      {/* Distribution per kategori */}
      <div className="space-y-3">
        {config.categories.map(({ value, label, emoji, color }) => {
          const count = byCategory[value] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={value}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-black/70">{emoji} {label}</span>
                <span className="font-black" style={{ color }}>
                  {count}{' '}
                  <span className="text-xs text-black/30 font-medium">({pct}%)</span>
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Insight otomatis */}
      <div className="rounded-2xl bg-[#F0F7F1] p-4 border border-[#0D5C2F]/10">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">🤖</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D5C2F] mb-1">
              Insight Otomatis
            </p>
            <p className="text-sm leading-relaxed text-black/70">{insight}</p>
          </div>
        </div>
      </div>
    </div>
  )
}