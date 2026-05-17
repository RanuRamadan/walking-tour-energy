'use client'

import {
  useEffect,
  useState,
} from 'react'

import dynamic from 'next/dynamic'

import {
  collection,
  getDocs,
  query,
  where,
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
                padding: [60, 60],
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
   MAIN PAGE
========================= */

export default function HasilPage() {
  const [data, setData] =
    useState<Observation[]>([])

  const [group, setGroup] =
    useState('')

  const [L, setL] =
    useState<any>(null)

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
     LOAD DATA
  ========================= */

  const loadData = async () => {
    try {
      if (
        typeof window ===
        'undefined'
      )
        return

      const savedGroup =
        localStorage.getItem(
          'walking-group'
        )

      if (!savedGroup) return

      setGroup(savedGroup)

      const q = query(
        collection(
          db,
          'observations'
        ),
        where(
          'group',
          '==',
          savedGroup
        )
      )

      const querySnapshot =
        await getDocs(q)

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

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    loadData()
  }, [])

  /* =========================
     STATS
  ========================= */

  const efisien = data.filter(
    (d) =>
      d.category ===
      'efisien'
  ).length

  const hemat = data.filter(
    (d) =>
      d.category ===
      'hemat'
  ).length

  const boros = data.filter(
    (d) =>
      d.category ===
      'boros'
  ).length

  /* =========================
     INSIGHT
  ========================= */

  let insight =
    'Kelompok berhasil melakukan observasi energi.'

  if (
    boros > efisien &&
    boros > hemat
  ) {
    insight =
      'Mayoritas observasi menunjukkan penggunaan energi masih cukup boros.'
  }

  if (
    efisien > hemat &&
    efisien > boros
  ) {
    insight =
      'Sebagian besar observasi menunjukkan penggunaan energi sudah cukup efisien.'
  }

  if (
    hemat > efisien &&
    hemat > boros
  ) {
    insight =
      'Kelompok menemukan beberapa upaya penghematan energi sudah mulai diterapkan.'
  }

  /* =========================
     END OBSERVATION
  ========================= */

  const endObservation = () => {
    localStorage.removeItem(
      'walking-group'
    )

    window.location.href = '/'
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
                Hasil Observasi
              </p>

              <h1 className="text-4xl font-black leading-tight">
                {group || 'Kelompok'}
              </h1>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-2xl px-4 py-4 shadow-sm">
            <p className="text-sm leading-7 text-black/70">
              Ringkasan hasil observasi
              energi kelompok selama
              walking tour berlangsung.
            </p>
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
                  Peta Observasi
                </h2>

                <p className="text-sm text-black/50 mt-1">
                  Titik observasi kelompok
                </p>
              </div>

              <div className="bg-[#EEF5EF] text-[#0D5C2F] text-xs px-3 py-2 rounded-full font-bold">
                {data.length} titik
              </div>
            </div>
          </div>

          <MapContainer
            center={
              data.length > 0
                ? [
                    data[0].lat,
                    data[0].lng,
                  ]
                : timPosition
            }
            zoom={17}
            minZoom={3}
            maxZoom={22}
            scrollWheelZoom={true}
            className="h-[70vh] w-full"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              maxNativeZoom={19}
              maxZoom={22}
              noWrap={true}
            />

            {/* AUTO FOCUS */}

            {data.length > 0 && (
              <AutoFitBounds
                data={data}
              />
            )}

            {/* MARKERS */}

            {data.map(
              (item, index) => (
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
      </section>

      {/* INSIGHT */}

      <section className="px-4">
        <div className="bg-white rounded-[32px] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF5EF] flex items-center justify-center text-2xl">
              📊
            </div>

            <div>
              <p className="text-sm text-black/50">
                Insight Observasi
              </p>

              <h2 className="text-2xl font-black">
                Ringkasan
              </h2>
            </div>
          </div>

          <p className="leading-8 text-[15px] text-black/75">
            {insight}
          </p>
        </div>
      </section>

      {/* END BUTTON */}

      <section className="px-4 py-8 pb-14">
        <button
          onClick={endObservation}
          className="w-full bg-black text-white py-5 rounded-[24px] font-black text-lg shadow-lg active:scale-[0.98] transition"
        >
          Akhiri Observasi
        </button>

        <p className="text-center text-xs text-black/40 mt-4 leading-6">
          Setelah observasi diakhiri,
          kelompok akan keluar dari
          sesi walking tour.
        </p>
      </section>
    </main>
  )
}