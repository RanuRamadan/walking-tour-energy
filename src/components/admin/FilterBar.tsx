'use client'

import { EventId, EventConfig, MapMode } from '../../types'
import { EVENT_CONFIGS } from '../../lib/constants'
import { RefreshCw } from 'lucide-react'

interface FilterBarProps {
  eventId: EventId
  onEventChange: (id: EventId) => void
  mapMode: MapMode
  onMapModeChange: (mode: MapMode) => void
  selectedCategory: string
  onCategoryChange: (cat: string) => void
  selectedName: string
  onNameChange: (name: string) => void
  names: string[]
  totalPoints: number
  loading: boolean
  onRefresh: () => void
}

export function FilterBar({
  eventId,
  onEventChange,
  mapMode,
  onMapModeChange,
  selectedCategory,
  onCategoryChange,
  selectedName,
  onNameChange,
  names,
  totalPoints,
  loading,
  onRefresh,
}: FilterBarProps) {
  const config: EventConfig = EVENT_CONFIGS[eventId]

  return (
    <div className="relative z-10 rounded-[32px] bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] saturate-150 p-4 flex flex-wrap gap-3 items-center justify-between">
      
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Event Selector - Colored Glass */}
        <div className="relative">
          <select
            value={eventId}
            onChange={(e) => onEventChange(e.target.value as EventId)}
            className="appearance-none cursor-pointer rounded-2xl bg-[#0D5C2F]/80 backdrop-blur-md border border-white/30 text-white font-bold px-4 py-2.5 pr-8 text-sm outline-none shadow-sm transition-all hover:bg-[#0D5C2F]/90"
          >
            {Object.values(EVENT_CONFIGS).map((ev) => (
              <option key={ev.id} value={ev.id} className="text-black bg-white">{ev.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 text-xs">▼</span>
        </div>

        {/* Category Filter - Colored Glass */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="appearance-none cursor-pointer rounded-2xl bg-[#035dcc]/80 backdrop-blur-md border border-white/30 text-white font-semibold px-4 py-2.5 pr-8 text-sm outline-none shadow-sm transition-all hover:bg-[#035dcc]/90"
          >
            <option value="all" className="text-black bg-white">Semua Kategori</option>
            {config.categories.map((cat) => (
              <option key={cat.value} value={cat.value} className="text-black bg-white">
                {cat.emoji} {cat.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 text-xs">▼</span>
        </div>

        {/* Name/Group Filter - Colored Glass */}
        <div className="relative">
          <select
            value={selectedName}
            onChange={(e) => onNameChange(e.target.value)}
            className="appearance-none cursor-pointer rounded-2xl bg-[#035dcc]/80 backdrop-blur-md border border-white/30 text-white font-semibold px-4 py-2.5 pr-8 text-sm outline-none max-w-[200px] shadow-sm transition-all hover:bg-[#035dcc]/90"
          >
            <option value="all" className="text-black bg-white">Semua {config.participantLabel}</option>
            {names.map((n) => (
              <option key={n} value={n} className="text-black bg-white">{n}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 text-xs">▼</span>
        </div>

        {/* Total Points Badge - Frosted White */}
        <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/50 shadow-sm px-4 py-2.5 text-sm font-bold text-[#0D5C2F]">
          {totalPoints} titik
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Toggle Map Mode - iOS Segmented Control Style */}
        <div className="flex rounded-2xl bg-black/5 backdrop-blur-sm border border-white/40 p-1 shadow-inner">
          <button
            onClick={() => onMapModeChange('marker')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              mapMode === 'marker' 
                ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-gray-900' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
            }`}
          >
            🗺 Marker
          </button>
          <button
            onClick={() => onMapModeChange('heatmap')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              mapMode === 'heatmap' 
                ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-gray-900' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
            }`}
          >
            🔥 Heatmap
          </button>
        </div>

        {/* Refresh Button - Frosted Glass */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-2xl bg-white/50 backdrop-blur-md border border-white/60 shadow-sm px-4 py-2.5 text-sm font-bold text-gray-800 transition-all hover:bg-white/70 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
    </div>
  )
}