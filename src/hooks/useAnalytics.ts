import { useMemo } from 'react'
import { Observation, AnalyticsData, LeaderboardItem } from '../types'
import { EVENT_CONFIGS } from '../lib/constants'

export function useAnalytics(eventId: string, data: Observation[]): AnalyticsData {
  return useMemo(() => {
    const config = EVENT_CONFIGS[eventId]
    const categories = config?.categories ?? []
    const total = data.length

    // Hitung per kategori
    const byCategory: Record<string, number> = {}
    categories.forEach((cat) => {
      byCategory[cat.value] = data.filter((d) => d.category === cat.value).length
    })

    // Cari kategori dominan
    let dominantCategory: string | null = null
    let maxCount = 0
    Object.entries(byCategory).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count
        dominantCategory = cat
      }
    })

    // Generate insight berdasarkan event
    let insight = 'Belum ada data observasi yang cukup untuk analisis.'
    if (total > 0 && dominantCategory) {
      const dominantConfig = categories.find((c) => c.value === dominantCategory)
      const dominantLabel = dominantConfig?.label ?? dominantCategory

      if (eventId === 'kelana-energi') {
        if (dominantCategory === 'terakomodasi') {
          insight = 'Mayoritas titik observasi menunjukkan bisa terakomodasi.'
        } else {
          insight = 'Mayoritas titik observasi menunjukkan masih belum bisa terakomodasi.'
        }
      } else {
        if (dominantCategory === 'terbarukan') {
          insight = 'Mayoritas observasi menunjukkan penggunaan energi sudah cukup efisien dan berkelanjutan.'
        } else if (dominantCategory === 'hemat') {
          insight = 'Mayoritas observasi menunjukkan masyarakat sudah mulai menerapkan penghematan energi.'
        } else if (dominantCategory === 'boros') {
          insight = 'Mayoritas observasi menunjukkan penggunaan energi masih cukup boros di beberapa titik.'
        }
      }
    }

    return { total, byCategory, dominantCategory, insight }
  }, [eventId, data])
}

export function useLeaderboard(data: Observation[], names: string[], eventId: string): LeaderboardItem[] {
  return useMemo(() => {
    const config = EVENT_CONFIGS[eventId]
    const categories = config?.categories.map((c) => c.value) ?? []

    return names
      .map((name) => {
        const nameData = data.filter((d) => d.group === name)
        const byCategory: Record<string, number> = {}
        categories.forEach((cat) => {
          byCategory[cat] = nameData.filter((d) => d.category === cat).length
        })
        return { name, total: nameData.length, byCategory }
      })
      .sort((a, b) => b.total - a.total)
  }, [data, names, eventId])
}

export function useNames(data: Observation[]): string[] {
  return useMemo(() => [...new Set(data.map((d) => d.group))].sort(), [data])
}