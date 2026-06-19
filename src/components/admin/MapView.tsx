'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Observation, MapMode } from '../../types'
import { DEFAULT_CENTER, getCategoryMeta } from '../../lib/constants'

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false })
const TileLayer   = dynamic(() => import('react-leaflet').then((m) => m.TileLayer),    { ssr: false })
const Marker      = dynamic(() => import('react-leaflet').then((m) => m.Marker),       { ssr: false })
const Popup       = dynamic(() => import('react-leaflet').then((m) => m.Popup),        { ssr: false })

const AutoFitBounds = dynamic(
  () => import('react-leaflet').then((mod) => {
    return function AutoFitBoundsInner({ data }: { data: Observation[] }) {
      const map = mod.useMap()
      useEffect(() => {
        if (data.length === 0) return
        const bounds = data.map((item) => [item.lat, item.lng] as [number, number])
        map.fitBounds(bounds, { padding: [60, 60] })
      }, [data, map])
      return null
    }
  }),
  { ssr: false }
)

const HeatmapLayer = dynamic(
  () => import('react-leaflet').then((mod) => {
    return function HeatmapLayerInner({ data }: { data: Observation[] }) {
      const map = mod.useMap()
      useEffect(() => {
        if (!map) return
        let heatLayer: any
        const load = async () => {
          await import('leaflet.heat')
          const points = data.map((item) => [item.lat, item.lng, 1])
          heatLayer = (window as any).L.heatLayer(points, { radius: 35, blur: 25, maxZoom: 17 })
          heatLayer.addTo(map)
        }
        load()
        return () => { if (heatLayer) map.removeLayer(heatLayer) }
      }, [map, data])
      return null
    }
  }),
  { ssr: false }
)

interface MapViewProps {
  data: Observation[]
  mode: MapMode
  eventId: string
}

export function MapView({ data, mode, eventId }: MapViewProps) {
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    import('leaflet').then((leaflet) => setL(leaflet))
  }, [])

  function getMarkerIcon(category: string) {
    if (!L) return undefined
    const { emoji } = getCategoryMeta(eventId, category)
    return new L.DivIcon({
      className: '',
      html: `<div style="font-size:32px;transform:translate(-50%,-50%);filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">${emoji}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
  }

  return (
    <MapContainer
      center={data.length > 0 ? [data[0].lat, data[0].lng] : DEFAULT_CENTER}
      zoom={15}
      minZoom={3}
      maxZoom={22}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxNativeZoom={19}
        maxZoom={22}
      />

      {data.length > 0 && <AutoFitBounds data={data} />}
      {mode === 'heatmap' && data.length > 0 && <HeatmapLayer data={data} />}

      {mode === 'marker' && data.map((item) => (
        <Marker key={item.id} position={[item.lat, item.lng]} icon={getMarkerIcon(item.category)}>
          <Popup>
            <div className="min-w-[220px] space-y-3 p-1 font-sans">
              <div className="flex items-center justify-between gap-2">
                <p className="font-black text-base text-gray-900">{item.group}</p>
                <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white capitalize">
                  {getCategoryMeta(eventId, item.category).label}
                </span>
              </div>
              {item.note && (
                <p className="text-sm leading-relaxed text-gray-600">{item.note}</p>
              )}
              {item.image && (
                <img src={item.image} alt="Foto observasi" className="h-36 w-full rounded-xl object-cover" />
              )}
              {item.createdAt && (
                <p className="text-xs text-gray-400">{item.createdAt.toLocaleString('id-ID')}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}