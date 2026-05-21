'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import dynamic from 'next/dynamic'

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'

import {
  BarChart3,
  Leaf,
  Lightbulb,
  MapPinned,
  TriangleAlert,
  Users,
  Zap,
} from 'lucide-react'

import { db } from '@/firebase/firebase'

import 'leaflet/dist/leaflet.css'

/* =========================
   DYNAMIC LEAFLET
========================= */

const MapContainer = dynamic(
  () =>
    import('react-leaflet').then(
      (mod) => mod.MapContainer
    ),
  {
    ssr: false,
  }
)

const Marker = dynamic(
  () =>
    import('react-leaflet').then(
      (mod) => mod.Marker
    ),
  {
    ssr: false,
  }
)

const Popup = dynamic(
  () =>
    import('react-leaflet').then(
      (mod) => mod.Popup
    ),
  {
    ssr: false,
  }
)

const TileLayer = dynamic(
  () =>
    import('react-leaflet').then(
      (mod) => mod.TileLayer
    ),
  {
    ssr: false,
  }
)

/* =========================
   AUTO FIT BOUNDS
========================= */
const HeatmapLayer = dynamic(
  async () => {
    const mod =
      await import(
        'react-leaflet'
      )

    return function Heatmap({
      data,
    }: {
      data: Observation[]
    }) {
      const map =
        mod.useMap()

      useEffect(() => {
        if (!map) return

        let heatLayer: any

        const load =
          async () => {
            const leaflet =
              await import(
                'leaflet'
              )

            await import(
              'leaflet.heat'
            )

            const L: any =
              leaflet.default ||
              leaflet

            const points =
              data.map(
                (item) => [
                  item.lat,
                  item.lng,
                  1,
                ]
              )

            heatLayer =
              (
                window as any
              ).L.heatLayer(
                points,
                {
                  radius: 35,
                  blur: 25,
                  maxZoom: 17,
                }
              )

            heatLayer.addTo(
              map
            )
          }

        load()

        return () => {
          if (
            heatLayer
          ) {
            map.removeLayer(
              heatLayer
            )
          }
        }
      }, [map, data])

      return null
    }
  },
  {
    ssr: false,
  }
)

const AutoFitBounds = dynamic(
  () =>
    import('react-leaflet').then(
      (mod) => {
        return function Wrapper(
          props: {
            data: Observation[]
          }
        ) {
          const map =
            mod.useMap()

          useEffect(() => {
            if (
              props.data.length === 0
            )
              return

            const bounds =
              props.data.map(
                (item) => [
                  item.lat,
                  item.lng,
                ]
              )

            map.fitBounds(
              bounds as any,
              {
                padding: [80, 80],
              }
            )
          }, [
            props.data,
            map,
          ])

          return null
        }
      }
    ),
  {
    ssr: false,
  }
)

/* =========================
   TYPES
========================= */

type Observation = {
  group: string
  category: string
  note: string
  image?: string
  lat: number
  lng: number
}

/* =========================
   DEFAULT POSITION
========================= */

const timPosition: [number, number] = [
  -6.1899,
  106.8429,
]

/* =========================
   PAGE
========================= */

export default function AdminPage() {
  const [data, setData] =
    useState<Observation[]>([])

  const [L, setL] =
    useState<any>(null)

  const [loading, setLoading] =
    useState(true)

  const [mapMode, setMapMode] =
  useState('marker')

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('all')

  const [
    selectedGroup,
    setSelectedGroup,
  ] = useState('all')

  /* =========================
     LOAD LEAFLET
  ========================= */

  useEffect(() => {
    import('leaflet').then(
      (leaflet) => {
        setL(leaflet)
      }
    )
  }, [])

  /* =========================
     REALTIME FIREBASE
  ========================= */

  useEffect(() => {
    const q = query(
      collection(
        db,
        'observations'
      ),
      orderBy(
        'createdAt',
        'desc'
      )
    )

    const unsubscribe =
      onSnapshot(
        q,
        (querySnapshot) => {
          const observations =
            querySnapshot.docs.map(
              (doc) => ({
                group:
                  doc.data().group,

                category:
                  doc.data().category,

                note:
                  doc.data().note,

                image:
                  doc.data().image,

                lat:
                  doc.data().lat,

                lng:
                  doc.data().lng,
              })
            )

          setData(observations)

          setLoading(false)
        }
      )

    return () =>
      unsubscribe()
  }, [])

  /* =========================
     ICONS
  ========================= */

  function getMarkerIcon(
    category: string
  ) {
    if (!L) return undefined

    let emoji = '⚠️'

    if (category === 'efisien')
      emoji = '🌱'

    if (category === 'hemat')
      emoji = '💡'

    return new L.DivIcon({
      className: '',

      html: `
        <div style="
          font-size: 34px;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.25));
        ">
          ${emoji}
        </div>
      `,

      iconSize: [34, 34],
      iconAnchor: [17, 17],
    })
  }

  /* =========================
     ANALYTICS
  ========================= */

  const totalObservations =
    data.length

  const efisien = data.filter(
    (item) =>
      item.category ===
      'efisien'
  ).length

  const hemat = data.filter(
    (item) =>
      item.category ===
      'hemat'
  ).length

  const boros = data.filter(
    (item) =>
      item.category ===
      'boros'
  ).length

  const groups = useMemo(() => {
    return [
      ...new Set(
        data.map(
          (item) => item.group
        )
      ),
    ]
  }, [data])

  const filteredData =
    data.filter((item) => {
      const categoryMatch =
        selectedCategory ===
          'all' ||
        item.category ===
          selectedCategory

      const groupMatch =
        selectedGroup ===
          'all' ||
        item.group ===
          selectedGroup

      return (
        categoryMatch &&
        groupMatch
      )
    })

  const borosPercentage =
  
    totalObservations > 0
      ? Math.round(
          (boros /
            totalObservations) *
            100
        )
      : 0

  const leaderboard =
    groups
      .map((groupName) => ({
        group: groupName,

        total: data.filter(
          (item) =>
            item.group ===
            groupName
        ).length,
      }))
      .sort(
        (a, b) =>
          b.total - a.total
      )

  /* =========================
     UI
  ========================= */

  return (
    <main className="min-h-screen bg-[#F4F1EA] text-[#111111] pb-16">
      {/* NAVBAR */}

      <nav className="sticky top-0 z-[9999] backdrop-blur-xl bg-white/70 border-b border-black/5">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-12 h-12 object-contain"
            />

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-black/40 font-bold">
                Kota Kita Kelas Kita
              </p>

              <h1 className="font-black text-xl">
                Urban Energy Dashboard
              </h1>
            </div>
          </div>

          <div className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold">
            Live GIS
          </div>
        </div>
      </nav>

      {/* HERO */}

      <section className="relative overflow-hidden px-6 pt-10 pb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-[#DCE6D4] to-[#F4F1EA]" />

        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="uppercase tracking-[0.25em] text-xs text-black/50 font-bold">
              GIS Dashboard
            </p>

            <h1 className="text-5xl font-black mt-2 leading-tight">
              Admin
              <br />
              Analytics
            </h1>

            <p className="text-black/60 mt-5 max-w-xl leading-8">
              Dashboard observasi energi realtime berbasis GIS untuk memantau hasil walking tour seluruh kelompok.
            </p>
          </div>

          <div className="bg-black text-white rounded-[32px] px-6 py-5 shadow-2xl min-w-[240px]">
            <p className="text-sm text-white/60">
              Total Observasi
            </p>

            <h2 className="text-5xl font-black mt-2">
              {loading
                ? '...'
                : totalObservations}
            </h2>
          </div>
        </div>
      </section>

      {/* FILTER */}

      <section className="px-6 pb-2">
        <div className="bg-white rounded-[32px] p-5 shadow-sm border border-black/5 flex flex-wrap gap-4 items-center">
          <select
            value={
              selectedCategory
            }
            onChange={(e) =>
              setSelectedCategory(
                e.target.value
              )
            }
            className="px-4 py-3 rounded-2xl bg-[#F7F7F7] outline-none font-semibold"
          >
            <option value="all">
              Semua Kategori
            </option>

            <option value="efisien">
              🌱 Efisien
            </option>

            <option value="hemat">
              💡 Hemat
            </option>

            <option value="boros">
              ⚠️ Boros
            </option>
          </select>

          <select
            value={selectedGroup}
            onChange={(e) =>
              setSelectedGroup(
                e.target.value
              )
            }
            className="px-4 py-3 rounded-2xl bg-[#F7F7F7] outline-none font-semibold"
          >
            <option value="all">
              Semua Kelompok
            </option>

            {groups.map(
              (
                groupName,
                index
              ) => (
                <option
                  key={index}
                  value={
                    groupName
                  }
                >
                  {groupName}
                </option>
              )
            )}
          </select>
          <div className="flex gap-3">
  <button
    onClick={() =>
      setMapMode(
        'marker'
      )
    }
    className={`px-5 py-3 rounded-2xl font-bold ${
      mapMode ===
      'marker'
        ? 'bg-black text-white'
        : 'bg-[#F7F7F7]'
    }`}
  >
    🗺 Marker
  </button>

  <button
    onClick={() =>
      setMapMode(
        'heatmap'
      )
    }
    className={`px-5 py-3 rounded-2xl font-bold ${
      mapMode ===
      'heatmap'
        ? 'bg-black text-white'
        : 'bg-[#F7F7F7]'
    }`}
  >
    🔥 Heatmap
  </button>
</div>
        </div>
      </section>

      {/* STATS */}

      <section className="px-6">
        <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-[32px] p-5 shadow-sm border border-black/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black/50">
                  Kelompok Aktif
                </p>

                <h2 className="text-4xl font-black mt-2">
                  {groups.length}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-[#EEF5EF] flex items-center justify-center">
                <Users size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-5 shadow-sm border border-black/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black/50">
                  Efisien
                </p>

                <h2 className="text-4xl font-black mt-2 text-[#0D5C2F]">
                  {efisien}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-[#EEF5EF] flex items-center justify-center">
                <Leaf size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-5 shadow-sm border border-black/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black/50">
                  Hemat
                </p>

                <h2 className="text-4xl font-black mt-2 text-[#D8A300]">
                  {hemat}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-[#FFF4CF] flex items-center justify-center">
                <Lightbulb size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-5 shadow-sm border border-black/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black/50">
                  Boros
                </p>

                <h2 className="text-4xl font-black mt-2 text-[#C0392B]">
                  {boros}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-[#FFE5E1] flex items-center justify-center">
                <TriangleAlert size={28} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAP + ANALYTICS */}

      <section className="px-6 pt-6 grid xl:grid-cols-[1.5fr_0.8fr] gap-6 items-start">
        {/* MAP */}

        <div className="bg-white rounded-[36px] overflow-hidden shadow-xl border border-black/5">
          <div className="p-6 border-b border-black/5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-black flex items-center gap-3">
                <MapPinned size={30} />
                GIS Observation Map
              </h2>

              <p className="text-black/50 mt-2">
                Persebaran observasi seluruh kelompok.
              </p>
            </div>

            <div className="bg-[#EEF5EF] text-[#0D5C2F] px-4 py-2 rounded-full font-bold text-sm">
              Live Observation
            </div>
          </div>

          <MapContainer
            center={
              filteredData.length >
              0
                ? [
                    filteredData[0]
                      .lat,
                    filteredData[0]
                      .lng,
                  ]
                : timPosition
            }
            zoom={17}
            minZoom={3}
            maxZoom={22}
            scrollWheelZoom={true}
            className="h-[75vh] w-full"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              maxNativeZoom={19}
              maxZoom={22}
              noWrap={true}
            />

            {filteredData.length > 0 && (
              <>
                {mapMode === 'heatmap' && (
                  <HeatmapLayer data={filteredData} />
                )}

                <AutoFitBounds data={filteredData} />
              </>
            )}

            {mapMode ===
                  'marker' &&
                  filteredData.map(
              
              (
                item,
                index
              ) => (
                <Marker
                  key={index}
                  position={[
                    item.lat,
                    item.lng,
                  ]}
                  icon={getMarkerIcon(
                    item.category
                  )}
                >
                  <Popup>
                    <div className="space-y-3 min-w-[220px] text-[#111111]">
                      <div className="flex items-center justify-between">
                        <h2 className="font-black text-lg">
                          {item.group}
                        </h2>

                        <div className="bg-black text-white text-xs px-3 py-1 rounded-full capitalize">
                          {
                            item.category
                          }
                        </div>
                      </div>

                      <p className="text-sm leading-6">
                        {item.note}
                      </p>

                      {item.image && (
                        <img
                          src={
                            item.image
                          }
                          alt="Observasi"
                          className="w-full h-36 object-cover rounded-2xl"
                        />
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            )}
          </MapContainer>
        </div>

        {/* SIDEBAR */}

        <div className="space-y-6 sticky top-24">
          {/* ANALYTICS */}

          <div className="bg-white rounded-[36px] p-6 shadow-sm border border-black/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF5EF] flex items-center justify-center">
                <BarChart3 size={28} />
              </div>

              <div>
                <p className="text-black/50 text-sm">
                  Analytics
                </p>

                <h2 className="text-3xl font-black">
                  Insight
                </h2>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">
                    Observasi Boros
                  </p>

                  <p className="font-black">
                    {
                      borosPercentage
                    }
                    %
                  </p>
                </div>

                <div className="w-full h-4 rounded-full bg-[#F2F2F2] overflow-hidden">
                  <div
                    className="h-full bg-[#C0392B] rounded-full"
                    style={{
                      width: `${borosPercentage}%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-[#F7F7F7] rounded-3xl p-5 leading-8 text-[15px] text-black/70">
                {boros >
                efisien
                  ? 'Mayoritas observasi menunjukkan penggunaan energi masih cukup boros di beberapa titik.'
                  : 'Mayoritas observasi menunjukkan penggunaan energi sudah cukup baik dan efisien.'}
              </div>
            </div>
          </div>

          {/* LEADERBOARD */}

          <div className="bg-white rounded-[36px] p-6 shadow-sm border border-black/5">
            <h2 className="text-3xl font-black mb-6">
              🏆 Leaderboard
            </h2>

            <div className="space-y-4">
              {leaderboard.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-[#F7F7F7] rounded-2xl px-4 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black">
                        #
                        {index +
                          1}
                      </div>

                      <div>
                        <p className="font-black">
                          {
                            item.group
                          }
                        </p>

                        <p className="text-sm text-black/50">
                          {
                            item.total
                          }{' '}
                          observasi
                        </p>
                      </div>
                    </div>

                    <div className="text-2xl">
                      {index ===
                      0
                        ? '🥇'
                        : index ===
                          1
                        ? '🥈'
                        : index ===
                          2
                        ? '🥉'
                        : '🏅'}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* GROUP LIST */}

          <div className="bg-white rounded-[36px] p-6 shadow-sm border border-black/5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF5EF] flex items-center justify-center">
                <Zap size={28} />
              </div>

              <div>
                <p className="text-black/50 text-sm">
                  Group Activity
                </p>

                <h2 className="text-3xl font-black">
                  Kelompok
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {groups.map(
                (
                  groupName,
                  index
                ) => {
                  const total =
                    data.filter(
                      (
                        item
                      ) =>
                        item.group ===
                        groupName
                    ).length

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-[#F7F7F7] rounded-2xl px-4 py-4"
                    >
                      <div>
                        <p className="font-black">
                          {
                            groupName
                          }
                        </p>

                        <p className="text-sm text-black/50 mt-1">
                          {total}{' '}
                          observasi
                        </p>
                      </div>

                      <div className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold">
                        Active
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}