import { EventConfig } from '../types'

export const EVENT_CONFIGS: Record<string, EventConfig> = {
  'kelana-energi': {
    id: 'kelana-energi',
    label: 'Kelana Energi',
    participantLabel: 'Peserta',
    categories: [
      { value: 'terakomodasi',       label: 'Terakomodasi',       emoji: '✅', color: '#0D5C2F' },
      { value: 'tidak_terakomodasi', label: 'Tidak Terakomodasi', emoji: '❌', color: '#C0392B' },
    ],
  },
  'jelajah-energi-kita': {
    id: 'jelajah-energi-kita',
    label: 'Jelajah Energi Kita',
    participantLabel: 'Kelompok',
    categories: [
      { value: 'terbarukan', label: 'Terbarukan', emoji: '🌱', color: '#0D5C2F' },
      { value: 'hemat',      label: 'Hemat',      emoji: '💡', color: '#D4AC0D' },
      { value: 'boros',      label: 'Boros',       emoji: '⚠️', color: '#C0392B' },
    ],
  },
}

export const DEFAULT_CENTER: [number, number] = [-6.1899, 106.8429]

export function getCategoryMeta(eventId: string, categoryValue: string) {
  const config = EVENT_CONFIGS[eventId]
  if (!config) return { label: categoryValue, emoji: '📍', color: '#888' }
  const cat = config.categories.find((c) => c.value === categoryValue)
  return cat ?? { label: categoryValue, emoji: '📍', color: '#888' }
}