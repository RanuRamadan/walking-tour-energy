'use client'

import { useEffect, useState, useCallback } from 'react'
import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { Observation, EventId } from '../types'

interface UseObservationsResult {
  data: Observation[]
  loading: boolean
  error: string | null
  sessionIds: string[]
  refresh: () => void
}

export function useObservations(eventId: EventId): UseObservationsResult {
  const [data, setData] = useState<Observation[]>([])
  const [sessionIds, setSessionIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    setLoading(true)
    setData([])
    setSessionIds([])
    setError(null)

    let unsubscribers: (() => void)[] = []

    async function subscribeAllSessions() {
      try {
        const sessionsRef = collection(db, 'events', eventId, 'sessions')
        const sessionsSnap = await getDocs(sessionsRef)
        const ids = sessionsSnap.docs.map((doc) => doc.id)
        setSessionIds(ids)

        if (ids.length === 0) {
          setLoading(false)
          return
        }

        const allObservationsMap = new Map<string, Observation[]>()

        ids.forEach((sessionId) => {
          const q = query(
            collection(db, 'events', eventId, 'sessions', sessionId, 'observations'),
            orderBy('createdAt', 'desc')
          )

          const unsub = onSnapshot(
            q,
            (snapshot) => {
              const obs: Observation[] = snapshot.docs
                .map((doc) => {
                  const d = doc.data()
                  return {
                    id: doc.id,
                    sessionId,
                    group: d.group ?? sessionId,
                    category: d.category ?? '',
                    note: d.note ?? '',
                    image: d.image,
                    lat: Number(d.lat),
                    lng: Number(d.lng),
                    createdAt: d.createdAt?.toDate?.(),
                  }
                })
                .filter((item) => !isNaN(item.lat) && !isNaN(item.lng))

              allObservationsMap.set(sessionId, obs)

              const merged: Observation[] = []
              allObservationsMap.forEach((items) => merged.push(...items))
              merged.sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0
                return b.createdAt.getTime() - a.createdAt.getTime()
              })

              setData(merged)
              setLoading(false)
            },
            (err) => {
              console.error(`Error session ${sessionId}:`, err)
              setError(`Gagal memuat data session ${sessionId}`)
              setLoading(false)
            }
          )
          unsubscribers.push(unsub)
        })
      } catch (err) {
        console.error('Error fetching sessions:', err)
        setError('Gagal memuat daftar sesi.')
        setLoading(false)
      }
    }

    subscribeAllSessions()
    return () => { unsubscribers.forEach((u) => u()) }
  }, [eventId, refreshKey])

  return { data, loading, error, sessionIds, refresh }
}