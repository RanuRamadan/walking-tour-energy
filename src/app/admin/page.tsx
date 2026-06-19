'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { BarChart3, MapPinned, Users, Activity } from 'lucide-react'

import { EventId, MapMode } from '../../types'
import { EVENT_CONFIGS } from '../../lib/constants'
import { useObservations } from '../../hooks/useObservations'
import { useAnalytics, useLeaderboard, useNames } from '../../hooks/useAnalytics'
import { FilterBar } from '../../components/admin/FilterBar'
import { StatCard } from '../../components/admin/StatCard'
import { Leaderboard } from '../../components/admin/Leaderboard'
import { InsightPanel } from '../../components/admin/InsightPanel'
import { ObservationFeed } from '../../components/admin/ObservationFeed'

import 'leaflet/dist/leaflet.css'

const MapView = dynamic(
  () => import('../../components/admin/MapView').then((m) => m.MapView),
  { ssr: false, loading: () => <MapSkeleton /> }
)

function MapSkeleton() {
  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
      <div className="text-center text-black/30">
        <div className="text-5xl mb-3">🗺</div>
        <p className="font-semibold">Memuat peta...</p>
      </div>
    </div>
  )
}

function Section({
  title, icon, children, action,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-[28px] bg-white border border-black/5 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EEF5EF] flex items-center justify-center text-[#0D5C2F]">
            {icon}
          </div>
          <h2 className="font-black text-lg text-gray-900">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-3xl bg-black/5 animate-pulse" />
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [eventId, setEventId] = useState<EventId>('kelana-energi')
  const [mapMode, setMapMode] = useState<MapMode>('marker')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedName, setSelectedName] = useState('all')

  const config = EVENT_CONFIGS[eventId]

  const { data, loading, error, sessionIds, refresh } = useObservations(eventId)
  const names = useNames(data)

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const catOk = selectedCategory === 'all' || item.category === selectedCategory
      const nameOk = selectedName === 'all' || item.group === selectedName
      return catOk && nameOk
    })
  }, [data, selectedCategory, selectedName])

  const analytics = useAnalytics(eventId, filteredData)
  const leaderboard = useLeaderboard(filteredData, names, eventId)

  function handleEventChange(id: EventId) {
    setEventId(id)
    setSelectedCategory('all')
    setSelectedName('all')
  }

  // Stat cards — 1 card per kategori + 1 card total
  const statCards = [
    { label: 'Total Observasi', value: analytics.total, icon: '📊', color: '#111111' },
    ...config.categories.map((cat) => ({
      label: cat.label,
      value: analytics.byCategory[cat.value] ?? 0,
      icon: cat.emoji,
      color: cat.color,
      sub: analytics.total > 0
        ? `${Math.round(((analytics.byCategory[cat.value] ?? 0) / analytics.total) * 100)}%`
        : '0%',
    })),
  ]

  return (
    <main className="min-h-screen bg-[#F4F1EA] pb-16">

      {/* HEADER */}
      <header className="px-6 pt-8 pb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#0D5C2F] mb-1">
              Dashboard Admin
            </p>
            <h1 className="text-4xl font-black text-gray-900 leading-tight">
              {config.label}
            </h1>
            <p className="text-black/40 mt-1 text-sm">
              Monitoring observasi lapangan secara realtime
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="rounded-2xl bg-white border border-black/5 shadow-sm px-4 py-2 text-sm font-bold text-black/60">
              {sessionIds.length} sesi aktif
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-[#0D5C2F] px-4 py-2 text-sm font-bold text-white shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-300" />
              </span>
              Live
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 space-y-5">

        {/* FILTER BAR */}
        <FilterBar
          eventId={eventId}
          onEventChange={handleEventChange}
          mapMode={mapMode}
          onMapModeChange={setMapMode}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedName={selectedName}
          onNameChange={setSelectedName}
          names={names}
          totalPoints={filteredData.length}
          loading={loading}
          onRefresh={refresh}
        />

        {/* ERROR */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm font-medium text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* STAT CARDS */}
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className={`grid gap-4 ${statCards.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {statCards.map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                color={card.color}
                sub={'sub' in card ? card.sub : undefined}
              />
            ))}
          </div>
        )}

        {/* MAP + SIDEBAR */}
        <div className="grid xl:grid-cols-[1fr_380px] gap-5 items-start">

          <div className="rounded-[28px] overflow-hidden shadow-sm border border-black/5 bg-white">
            <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EEF5EF] flex items-center justify-center text-[#0D5C2F]">
                  <MapPinned size={18} />
                </div>
                <div>
                  <h2 className="font-black text-lg text-gray-900">GIS Observation Map</h2>
                  <p className="text-xs text-black/40">
                    {mapMode === 'marker' ?  'Marker mode' : 'Heatmap mode'} L && · {filteredData.length} titik
                  </p>
                </div>
              </div>
              <div className="text-xs font-bold text-[#0D5C2F] bg-[#EEF5EF] px-3 py-1.5 rounded-full">
                {sessionIds.length} {config.participantLabel.toLowerCase()}
              </div>
            </div>
            <div className="h-[60vh]">
              {loading ? <MapSkeleton /> : <MapView data={filteredData} mode={mapMode} eventId={eventId} />}
            </div>
          </div>

          <div className="space-y-5">
            <Section title="Analitik" icon={<BarChart3 size={16} />}>
              <InsightPanel analytics={analytics} eventId={eventId} />
            </Section>

            <Section
              title="Leaderboard"
              icon={<span className="text-base leading-none">🏆</span>}
              action={
                <span className="text-xs text-black/40 font-medium">
                  {names.length} {config.participantLabel.toLowerCase()}
                </span>
              }
            >
              <Leaderboard items={leaderboard} eventId={eventId} />
            </Section>
          </div>
        </div>

        {/* BOTTOM: Feed + Aktivitas */}
        <div className="grid xl:grid-cols-2 gap-5">

          <Section
            title="Observasi Terbaru"
            icon={<Activity size={16} />}
            action={<span className="text-xs text-black/40 font-medium">{filteredData.length} total</span>}
          >
            <ObservationFeed data={filteredData} eventId={eventId} maxItems={20} />
          </Section>

          <Section
            title={`Aktivitas ${config.participantLabel}`}
            icon={<Users size={16} />}
            action={<span className="text-xs text-black/40 font-medium">{names.length} aktif</span>}
          >
            {names.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-black/30">
                <span className="text-4xl">👥</span>
                <p className="mt-2 text-sm font-medium">
                  Belum ada {config.participantLabel.toLowerCase()} aktif
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {leaderboard.map((item, i) => {
                  const pct = analytics.total > 0 ? (item.total / analytics.total) * 100 : 0
                  return (
                    <button
                      key={item.name}
                      onClick={() =>
                        setSelectedName(selectedName === item.name ? 'all' : item.name)
                      }
                      className={`w-full text-left rounded-2xl p-4 transition-all border ${
                        selectedName === item.name
                          ? 'border-[#0D5C2F] bg-[#F0F7F1]'
                          : 'border-transparent bg-[#F7F7F7] hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}
                          </span>
                          <span className="font-black text-sm text-gray-900">{item.name}</span>
                        </div>
                        <span className="text-sm font-black text-[#0D5C2F]">{item.total}</span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
                        <div
                          className="h-full rounded-full bg-[#0D5C2F] transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="mt-2 flex gap-3 text-xs text-black/40 flex-wrap">
                        {config.categories.map((cat) => (
                          <span key={cat.value}>
                            {cat.emoji} {item.byCategory[cat.value] ?? 0}
                          </span>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </Section>
        </div>
      </div>
    </main>
  )
}