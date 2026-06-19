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
} from 'firebase/firestore'

import {
  doc,
  setDoc
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

  const [leaderboard, setLeaderboard] =
  useState<
    {
      name: string
      total: number
    }[]
  >([])
  const DEFAULT_GROUP_NAME =
    'Kelana Energi'
  const DEFAULT_GROUP_ID =
    'kelana-energi'

  const [group, setGroup] =
    useState(DEFAULT_GROUP_NAME)

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

    let emoji = '📍'

    if (category === 'terakomodasi')
      emoji = '📍'

    if (category === 'tidak_terakomodasi')
      emoji = '📍'

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

      const savedGroupId =
        localStorage.getItem(
          'kelanaenergi-group-id'
        )
      const savedGroupName =
        localStorage.getItem(
          'kelanaenergi-group-name'
        )

      const activeGroupId =
        savedGroupId

      if (!activeGroupId) return
      const activeGroupName =
        savedGroupName ||
        DEFAULT_GROUP_NAME

      setGroup(activeGroupName)

      const q = query(
        collection(
          db,
          'events',
          'kelana-energi',
          'sessions',
          activeGroupId,
          'observations'
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
      loadLeaderboard()
      
    }, [])

const loadLeaderboard = async () => {
  try {
    const sessionsSnapshot = await getDocs(
      collection(
        db,
        'events',
        'kelana-energi',
        'sessions'
      )
    )

    console.log(
      'sessions:',
      sessionsSnapshot.docs.length
    )

    const results = []

    for (const sessionDoc of sessionsSnapshot.docs) {
      const observationsSnapshot =
        await getDocs(
          collection(
            db,
            'events',
            'kelana-energi',
            'sessions',
            sessionDoc.id,
            'observations'
          )
        )

      results.push({
        name: sessionDoc.id,
        total: observationsSnapshot.size
      })
    }

    results.sort(
      (a, b) => b.total - a.total
    )

    setLeaderboard(results)
  } catch (error) {
    console.log(error)
  }
}
  
  /* =========================
     STATS
  ========================= */

  const terakomodasi = data.filter(
    (d) => d.category === 'terakomodasi'
  ).length

  const tidakTerakomodasi = data.filter(
    (d) => d.category === 'tidak_terakomodasi'
  ).length

  /* =========================
     INSIGHT
  ========================= */

  let insight = 'Peserta berhasil menyelesaikan observasi pada titik-titik yang dikunjungi.'

  if (tidakTerakomodasi > terakomodasi) {
    insight =
      'Mayoritas observasi menunjukkan masih terdapat kebutuhan atau fasilitas yang belum terakomodasi'
  } else if (terakomodasi > tidakTerakomodasi) {
    insight =
      'Sebagian besar observasi menunjukkan kebutuhan dan fasilitas dapat terakomodasi'
  }

  /* =========================
     END OBSERVATION
  ========================= */

  const endObservation = () => {
    localStorage.removeItem(
      'kelanaenergi-group-id'
    )
    localStorage.removeItem(
      'kelanaenergi-group-name'
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
                peserta selama
                Kelana Energi berlangsung.
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}

      <section className="px-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-3xl p-4 shadow-sm">
            <p className="text-3xl font-black text-[#0D5C2F]">
              {terakomodasi}
            </p>

            <p className="text-sm text-black/60 mt-1">
              Terakomodasi
            </p>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm">
            <p className="text-3xl font-black text-[#C0392B]">
              {tidakTerakomodasi}
            </p>

            <p className="text-sm text-black/60 mt-1">
              Tidak Terakomodasi
            </p>
          </div>
        </div>
      </section>

      {/* LEADERBOARD */}

<section className="px-4 pt-5">
  <div className="bg-white rounded-[32px] p-6 shadow-sm">
    <h2 className="text-2xl font-black mb-5">
      🏆 Leaderboard
    </h2>

    <div className="space-y-3">
      {leaderboard.map(
        (item, index) => (

            <div
              key={item.name}
              style={{
                animationDelay: `${index * 150}ms`
              }}
              className={`opacity-0 animate-[fadeIn_0.5s_ease_forwards] flex items-center justify-between rounded-2xl px-4 py-3
              ${
                index === 0
                  ? 'bg-yellow-100 border-2 border-yellow-400'
                  : index === 1
                  ? 'bg-gray-100'
                  : index === 2
                  ? 'bg-orange-100'
                  : 'bg-[#F8F8F8]'
              }`}
            >
                        
              <style jsx global>{`
                          @keyframes fadeIn {
                            from {
                              opacity: 0;
                              transform: translateY(20px);
                            }

                            to {
                              opacity: 1;
                              transform: translateY(0);
                            }
                          }
                        `}</style>

            <div className="flex items-center gap-3">
              <span className="font-black text-lg">
                {index === 0
                  ? '🥇'
                  : index === 1
                  ? '🥈'
                  : index === 2
                  ? '🥉'
                  : `${index + 1}.`}
              </span>

              <span className="font-semibold">
                {item.name
                  .split('-')
                  .map(
                    word =>
                      word.charAt(0).toUpperCase() +
                      word.slice(1)
                  )
                  .join(' ')
                }
              </span>
            </div>
                
          <span className="font-black text-lg">
            {item.total} 📍
          </span>
          </div>
        )
      )}
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
          peserta akan keluar dari
          sesi Kelana Energi.
        </p>
      </section>
    </main>
  )
}