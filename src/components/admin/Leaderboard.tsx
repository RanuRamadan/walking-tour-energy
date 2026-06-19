import { LeaderboardItem } from '../../types'
import { EVENT_CONFIGS } from '../../lib/constants'

const MEDALS = ['🥇', '🥈', '🥉']

interface LeaderboardProps {
  items: LeaderboardItem[]
  eventId: string
}

export function Leaderboard({ items, eventId }: LeaderboardProps) {
  const config = EVENT_CONFIGS[eventId]

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-black/30">
        <span className="text-4xl">🏆</span>
        <p className="mt-2 text-sm font-medium">
          Belum ada data {config.participantLabel.toLowerCase()}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const medal = MEDALS[index] ?? '🏅'
        const barWidth = items[0].total > 0 ? (item.total / items[0].total) * 100 : 0

        return (
          <div
            key={item.name}
            className={`relative overflow-hidden rounded-2xl border border-black/5 bg-[#F7F7F7] px-4 py-4 transition-all ${
              index === 0 ? 'ring-2 ring-[#D4AC0D] ring-offset-1' : ''
            }`}
          >
            {/* Progress bar bg */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-black/5 to-transparent transition-all duration-700"
              style={{ width: `${barWidth}%` }}
            />

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                  {medal}
                </div>
                <div>
                  <p className="font-black text-gray-900">{item.name}</p>
                  {/* Category breakdown */}
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-black/50 flex-wrap">
                    {config.categories.map((cat, i) => (
                      <span key={cat.value} className="flex items-center gap-0.5">
                        {i > 0 && <span className="mr-1">·</span>}
                        {cat.emoji} {item.byCategory[cat.value] ?? 0}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <p className="text-xl font-black text-[#0D5C2F]">{item.total}</p>
                <p className="text-xs text-black/40">observasi</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}