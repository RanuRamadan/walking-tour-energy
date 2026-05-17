'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import dynamic from 'next/dynamic'

import {
  collection,
  getDocs,
} from 'firebase/firestore'

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

const TileLayer = dynamic(
  () =>
    import('react-leaflet').then(
      (mod) => mod.TileLayer
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
   MAIN PAGE
========================= */

export default function AdminPage() {
  const [data, setData] =
    useState<Observation[]>([])

  const [
    selectedGroup,
    setSelectedGroup,
  ] = useState('Semua')

  const [L, setL] =
    useState<any>(null)

  /* =========================
     LOAD LEAFLET CLIENT ONLY
  ========================= */

  useEffect(() => {
    import('leaflet').then(
      (leaflet) => {
        setL(leaflet)
      }
    )
  }, [])

  /* =========================
     LOAD DATA
  ========================= */

  const loadData = async () => {
    try {
      const querySnapshot =
        await getDocs(
          collection(
            db,
            'observations'
          )
        )

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
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  /* =========================
     GROUPS
  ========================= */

  const groups = useMemo(() => {
    const uniqueGroups = [
      ...new Set(
        data.map(
          (item) => item.group
        )
      ),
    ]

    return [
      'Semua',
      ...uniqueGroups,
    ]
  }, [data])

  /* =========================
     FILTERED DATA
  ========================= */

  const filteredData =
    selectedGroup === 'Semua'
      ? data
      : data.filter(
          (item) =>
            item.group ===
            selectedGroup
        )

  /* =========================
     STATS
  ========================= */

  const efisien =
    filteredData.filter(
      (d) =>
        d.category ===
        'efisien'
    ).length

  const hemat =
    filteredData.filter(
      (d) =>
        d.category ===
        'hemat'
    ).length

  const boros =
    filteredData.filter(
      (d) =>
        d.category ===
        'boros'
    ).length

  /* =========================
     ICONS
  ========================= */

  const getMarkerIcon = (
    category: string
  ) => {
    if (!L) return undefined

    if (category === 'efisien') {
      return new L.DivIcon({
        className: '',

        html: `
          <div style="
            font-size: 34px;
            transform: translate(-50%, -50%);
            filter: drop-shadow(0 6px 12px rgba(0,0,0,0.25));
          ">
            🌱
          </div>
        `,

        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })
    }

    if (category === 'hemat') {
      return new L.DivIcon({
        className: '',

        html: `
          <div style="
            font-size: 34px;
            transform: translate(-50%, -50%);
            filter: drop-shadow(0 6px 12px rgba(0,0,0,0.25));
          ">
            💡
          </div>
        `,

        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })
    }

    return new L.DivIcon({
      className: '',

      html: `
        <div style="
          font-size: 34px;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.25));
        ">
          ⚠️
        </div>
      `,

      iconSize: [34, 34],
      iconAnchor: [17, 17],
    })
  }

  /* =========================
     CATEGORY EMOJI
  ========================= */

  const getEmoji = (
    category: string
  ) => {
    if (category === 'efisien')
      return '🌱'

    if (category === 'hemat')
      return '💡'

    return '⚠️'
  }

  /* =========================
     UI
  ========================= */

  return (
    <main
      className="min-h-screen bg-[#F4F1EA] text-[#111111]"
      style={{
        fontFamily:
          'Roboto, sans-serif',
      }}
    >
      {/* HERO */}

      <section className="relative overflow-hidden px-5 pt-8 pb-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#DCE6D4] to-[#F4F1EA]" />

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-20 h-20 object-contain"
            />

            <div>
              <p className="uppercase text-xs tracking-[0.25em] text-black/50 font-medium">
                Dashboard Admin
              </p>

              <h1 className="text-4xl font-black leading-tight">
                Monitoring
                <br />
                Observasi
              </h1>
            </div>
          </div>

          {/* FILTER */}

          <div className="mt-6 bg-white rounded-3xl p-4 shadow-sm">
            <p className="text-sm font-semibold mb-3">
              Filter Kelompok
            </p>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {groups.map((group) => (
                <button
                  key={group}
                  onClick={() =>
                    setSelectedGroup(
                      group
                    )
                  }
                  className={`px-4 py-3 rounded-2xl whitespace-nowrap text-sm font-bold transition ${
                    selectedGroup ===
                    group
                      ? 'bg-black text-white'
                      : 'bg-[#F3F3F3] text-[#111111]'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}

      <section className="px-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-3xl p-4 shadow-sm">
            <p className="text-3xl font-black text-[#0D5C2F]">
              {efisien}
            </p>

            <p className="text-sm text-black/60 mt-1">
              Efisien
            </p>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm">
            <p className="text-3xl font-black text-[#D8A300]">
              {hemat}
            </p>

            <p className="text-sm text-black/60 mt-1">
              Hemat
            </p>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm">
            <p className="text-3xl font-black text-[#C0392B]">
              {boros}
            </p>

            <p className="text-sm text-black/60 mt-1">
              Boros
            </p>
          </div>
        </div>
      </section>

      {/* MAP */}

      <section className="px-4 py-5">
        <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-black/5">
          <div className="p-5 border-b border-black/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  Live Observation Map
                </h2>

                <p className="text-sm text-black/50 mt-1">
                  Semua titik observasi
                  peserta
                </p>
              </div>

              <div className="bg-[#EEF5EF] text-[#0D5C2F] text-xs px-3 py-2 rounded-full font-bold">
                {
                  filteredData.length
                }{' '}
                titik
              </div>
            </div>
          </div>

          <MapContainer
            center={timPosition}
            zoom={16}
            scrollWheelZoom={true}
            className="h-[70vh] w-full z-0"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            {filteredData.map(
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
                          {
                            item.group
                          }
                        </h2>

                        <div className="bg-black text-white text-xs px-3 py-1 rounded-full capitalize">
                          {
                            item.category
                          }
                        </div>
                      </div>

                      <p className="text-4xl">
                        {getEmoji(
                          item.category
                        )}
                      </p>

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
      </section>

      {/* OBSERVATION LIST */}

      <section className="px-4 pb-12">
        <div className="space-y-4">
          {filteredData.map(
            (
              item,
              index
            ) => (
              <div
                key={index}
                className="bg-white rounded-[28px] p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-black/50">
                      Kelompok
                    </p>

                    <h2 className="text-xl font-black">
                      {item.group}
                    </h2>
                  </div>

                  <div className="bg-black text-white text-xs px-3 py-2 rounded-full capitalize">
                    {item.category}
                  </div>
                </div>

                <p className="text-4xl mb-4">
                  {getEmoji(
                    item.category
                  )}
                </p>

                <p className="leading-7 text-[15px] text-black/75">
                  {item.note}
                </p>

                {item.image && (
                  <img
                    src={item.image}
                    alt="Observasi"
                    className="w-full h-56 object-cover rounded-3xl mt-5"
                  />
                )}
              </div>
            )
          )}
        </div>
      </section>
    </main>
  )
}