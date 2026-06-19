export type EventId = 'kelana-energi' | 'jelajah-energi-kita'

export interface EventConfig {
  id: EventId
  label: string
  participantLabel: string // 'Peserta' atau 'Kelompok'
  categories: CategoryOption[]
}

export interface CategoryOption {
  value: string
  label: string
  emoji: string
  color: string
}

export interface Observation {
  id: string
  group: string       // nama peserta (kelana) atau nama kelompok (jelajah)
  category: string
  note: string
  image?: string
  lat: number
  lng: number
  createdAt?: Date
  sessionId: string
}

export type MapMode = 'marker' | 'heatmap'

export interface LeaderboardItem {
  name: string        // nama peserta atau kelompok
  total: number
  byCategory: Record<string, number>
}

export interface AnalyticsData {
  total: number
  byCategory: Record<string, number>
  dominantCategory: string | null
  insight: string
}