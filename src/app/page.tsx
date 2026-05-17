'use client'

import {
  ChangeEvent,
  useEffect,
  useState,
} from 'react'

import dynamic from 'next/dynamic'

import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
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
   RECENTER MAP
========================= */

const RecenterMap = dynamic(
  () =>
    import('react-leaflet').then(
      (mod) => {
        return function Wrapper(
          props: {
            position: [
              number,
              number
            ]
          }
        ) {
          const map =
            mod.useMap()

          useEffect(() => {
            map.flyTo(
              props.position,
              18
            )
          }, [
            props.position,
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

type MarkerType = {
  lat: number
  lng: number
  category: string
  note: string
  group: string
  image?: string
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

export default function Home() {
  const [markers, setMarkers] =
    useState<MarkerType[]>([])

  const [group, setGroup] =
    useState('')

  const [
    tempGroup,
    setTempGroup,
  ] = useState('Kelompok 1')

  const [
    showGroupModal,
    setShowGroupModal,
  ] = useState(true)

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('efisien')

  const [note, setNote] =
    useState('')

  const [image, setImage] =
    useState<string>('')

  const [loading, setLoading] =
    useState(false)

  const [
    userLocation,
    setUserLocation,
  ] = useState<
    [number, number] | null
  >(null)

  const [
    statusMessage,
    setStatusMessage,
  ] = useState(
    'Mendeteksi lokasi peserta...'
  )

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

  function getUserIcon(L: any) {
    if (!L) return undefined

    return new L.DivIcon({
      className: '',

      html: `
        <div style="
          width: 22px;
          height: 22px;
          background: #2563eb;
          border: 4px solid white;
          border-radius: 999px;
          box-shadow: 0 0 20px rgba(37,99,235,0.5);
        "></div>
      `,

      iconSize: [22, 22],
      iconAnchor: [11, 11],
    })
  }

  /* =========================
     LOAD OBSERVATIONS
  ========================= */

  const loadObservations =
    async (
      activeGroup: string
    ) => {
      try {
        const q = query(
          collection(
            db,
            'observations'
          ),
          where(
            'group',
            '==',
            activeGroup
          )
        )

        const querySnapshot =
          await getDocs(q)

        const data =
          querySnapshot.docs.map(
            (doc) => ({
              lat: doc.data().lat,
              lng: doc.data().lng,
              category:
                doc.data().category,
              note:
                doc.data().note,
              image:
                doc.data().image,
              group:
                doc.data().group,
            })
          )

        setMarkers(data)
      } catch (error) {
        console.log(error)
      }
    }

  /* =========================
     GPS
  ========================= */

  const getUserLocation = () => {
    if (
      typeof window ===
      'undefined'
    )
      return

    if (
      !navigator.geolocation
    ) {
      setStatusMessage(
        'Browser tidak mendukung GPS'
      )

      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat =
          position.coords.latitude

        const lng =
          position.coords.longitude

        setUserLocation([lat, lng])

        setStatusMessage(
          'Lokasi berhasil ditemukan 📍'
        )
      },

      (error) => {
        console.log(error)

        if (
          error.code === 1
        ) {
          setStatusMessage(
            'Izin lokasi ditolak 😭'
          )
        }

        if (
          error.code === 2
        ) {
          setStatusMessage(
            'Lokasi tidak tersedia'
          )
        }

        if (
          error.code === 3
        ) {
          setStatusMessage(
            'GPS timeout'
          )
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  /* =========================
     IMAGE
  ========================= */

  const handleImageUpload = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]

    if (!file) return

    const imageUrl =
      URL.createObjectURL(file)

    setImage(imageUrl)
  }

  /* =========================
     SAVE SESSION
  ========================= */

  const saveGroup = async () => {
    try {
      setLoading(true)

      localStorage.setItem(
        'walking-group',
        tempGroup
      )

      await addDoc(
        collection(
          db,
          'sessions'
        ),
        {
          group: tempGroup,
          isActive: true,
          createdAt:
            serverTimestamp(),
        }
      )

      setGroup(tempGroup)

      setShowGroupModal(false)

      setStatusMessage(
        `${tempGroup} siap observasi 🚀`
      )

      loadObservations(
        tempGroup
      )
    } catch (error) {
      console.log(error)

      setStatusMessage(
        'Gagal membuat sesi kelompok'
      )
    } finally {
      setLoading(false)
    }
  }

  /* =========================
     CHANGE GROUP
  ========================= */

  const changeGroup = () => {
    localStorage.removeItem(
      'walking-group'
    )

    setGroup('')

    setTempGroup(
      'Kelompok 1'
    )

    setMarkers([])

    setNote('')
    setImage('')

    setSelectedCategory(
      'efisien'
    )

    setShowGroupModal(true)
  }

  /* =========================
     ADD OBSERVATION
  ========================= */

  const addMarker = async () => {
    if (!note) {
      setStatusMessage(
        'Isi catatan observasi'
      )

      return
    }

    if (!userLocation) {
      setStatusMessage(
        'Lokasi belum ditemukan'
      )

      return
    }

    try {
      setLoading(true)

      await addDoc(
        collection(
          db,
          'observations'
        ),
        {
          group,

          category:
            selectedCategory,

          note,

          image: image || '',

          lat: userLocation[0],

          lng: userLocation[1],

          createdAt:
            serverTimestamp(),
        }
      )

      const newMarker = {
        lat: userLocation[0],
        lng: userLocation[1],
        category:
          selectedCategory,
        note,
        image,
        group,
      }

      setMarkers((prev) => [
        ...prev,
        newMarker,
      ])

      setStatusMessage(
        'Observasi berhasil dikirim 🚀'
      )

      setNote('')
      setImage('')

      setSelectedCategory(
        'efisien'
      )
    } catch (error) {
      console.log(error)

      setStatusMessage(
        'Gagal mengirim observasi'
      )
    } finally {
      setLoading(false)
    }
  }

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    setTimeout(() => {
      getUserLocation()
    }, 1000)

    const savedGroup =
      localStorage.getItem(
        'walking-group'
      )

    if (savedGroup) {
      setGroup(savedGroup)

      setShowGroupModal(false)

      loadObservations(
        savedGroup
      )
    }
  }, [])

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
      {/* GROUP MODAL */}

      {showGroupModal && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-24 mx-auto mb-5"
            />

            <h1 className="text-3xl font-black text-center">
              Selamat Datang
            </h1>

            <p className="text-center text-black/60 mt-3 leading-7">
              Pilih kelompok sebelum
              memulai observasi Jelajah Energi Kita aja.
            </p>

            <div className="mt-7">
              <select
                value={tempGroup}
                onChange={(e) =>
                  setTempGroup(
                    e.target.value
                  )
                }
                className="w-full rounded-2xl border border-black/10 bg-[#FAFAFA] p-4 outline-none text-black"
              >
                <option>
                  Kelompok 1
                </option>

                <option>
                  Kelompok 2
                </option>

                <option>
                  Kelompok 3
                </option>

                <option>
                  Kelompok 4
                </option>
              </select>
            </div>

            <button
              onClick={saveGroup}
              disabled={loading}
              className="w-full mt-6 bg-[#0D5C2F] text-white py-4 rounded-2xl font-bold text-lg"
            >
              {loading
                ? 'Memulai...'
                : 'Mulai Observasi'}
            </button>
          </div>
        </div>
      )}

      {/* GROUP MODAL */}

{showGroupModal && (
  <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
    <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl">
      <img
        src="/logo.png"
        alt="Logo"
        className="w-24 mx-auto mb-5"
      />

      <h1 className="text-3xl font-black text-center">
        Selamat Datang
      </h1>

      <p className="text-center text-black/60 mt-3 leading-7">
        Pilih kelompok sebelum
        memulai observasi.
      </p>

      <div className="mt-7">
        <select
          value={tempGroup}
          onChange={(e) =>
            setTempGroup(
              e.target.value
            )
          }
          className="w-full rounded-2xl border border-black/10 bg-[#FAFAFA] p-4 outline-none text-black"
        >
          <option>
            Kelompok 1
          </option>

          <option>
            Kelompok 2
          </option>

          <option>
            Kelompok 3
          </option>

          <option>
            Kelompok 4
          </option>
        </select>
      </div>

      <button
        onClick={saveGroup}
        disabled={loading}
        className="w-full mt-6 bg-[#0D5C2F] text-white py-4 rounded-2xl font-bold text-lg"
      >
        {loading
          ? 'Memulai...'
          : 'Mulai Observasi'}
      </button>
    </div>
  </div>
)}

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
                Jelajah Energi Kita
              </p>

              <h1 className="text-4xl font-black leading-tight">
                Transisi
                <br />
                Energi
              </h1>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-2xl px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">
                  {group}
                </p>

                <p className="text-xs text-black/50 mt-1">
                  {statusMessage}
                </p>
              </div>
              {!userLocation && (
                <button
                  onClick={
                    getUserLocation
                  }
                  className="bg-[#0D5C2F] text-white text-xs px-4 py-2 rounded-full font-bold active:scale-[0.98] transition"
                >
                  Aktifkan Lokasi 📍
                </button>
              )}
                            <button
                onClick={changeGroup}
                className="bg-black text-white text-xs px-4 py-2 rounded-full font-bold"
              >
                Ganti Kelompok
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}

      <section className="px-4">
        <div className="bg-white rounded-[32px] p-5 shadow-lg border border-black/5">
          <div>
            <p className="text-sm font-semibold mb-3">
              Pilih Kategori
            </p>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() =>
                  setSelectedCategory(
                    'efisien'
                  )
                }
                className={`rounded-2xl p-4 text-sm font-bold transition ${
                  selectedCategory ===
                  'efisien'
                    ? 'bg-[#0D5C2F] text-white'
                    : 'bg-[#E9F4EC] text-[#111111]'
                }`}
              >
                🌱
                <br />
                Efisien
              </button>

              <button
                onClick={() =>
                  setSelectedCategory(
                    'hemat'
                  )
                }
                className={`rounded-2xl p-4 text-sm font-bold transition ${
                  selectedCategory ===
                  'hemat'
                    ? 'bg-[#D8A300] text-white'
                    : 'bg-[#FFF4CF] text-[#111111]'
                }`}
              >
                💡
                <br />
                Hemat
              </button>

              <button
                onClick={() =>
                  setSelectedCategory(
                    'boros'
                  )
                }
                className={`rounded-2xl p-4 text-sm font-bold transition ${
                  selectedCategory ===
                  'boros'
                    ? 'bg-[#C0392B] text-white'
                    : 'bg-[#FFE5E1] text-[#111111]'
                }`}
              >
                ⚠️
                <br />
                Boros
              </button>
            </div>
          </div>

          {/* NOTE */}

          <div className="mt-7">
            <p className="text-sm font-semibold mb-2">
              Catatan Observasi
            </p>

            <textarea
              value={note}
              onChange={(e) =>
                setNote(
                  e.target.value
                )
              }
              placeholder="Contoh: Lampu menyala siang hari..."
              className="w-full h-32 rounded-2xl border border-black/10 bg-[#FAFAFA] p-4 outline-none text-[#111111]"
            />
          </div>

          {/* IMAGE */}

          <div className="mt-7">
            <p className="text-sm font-semibold mb-2">
              Upload Foto
            </p>

            <label className="flex flex-col items-center justify-center w-full h-40 rounded-3xl border-2 border-dashed border-black/10 bg-[#FAFAFA] cursor-pointer">
              <div className="text-center">
                <p className="text-4xl">
                  📷
                </p>

                <p className="text-sm text-black/50 mt-2">
                  Upload dokumentasi
                </p>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleImageUpload
                }
                className="hidden"
              />
            </label>

            {image && (
              <img
                src={image}
                alt="Preview"
                className="w-full h-52 object-cover rounded-3xl mt-4"
              />
            )}
          </div>

          {/* BUTTON */}

          <button
            onClick={addMarker}
            disabled={loading}
            className="w-full mt-8 bg-[#0D5C2F] text-white py-4 rounded-2xl font-bold text-lg"
          >
            {loading
              ? 'Mengirim...'
              : 'Tambah Observasi'}
          </button>

          {/* DONE */}

          <button
            onClick={() =>
              (window.location.href =
                '/hasil')
            }
            className="w-full mt-3 bg-black text-white py-4 rounded-2xl font-bold text-lg"
          >
            Selesai Observasi
          </button>
        </div>
      </section>

      {/* MAP */}

      <section className="px-4 py-5 pb-12">
        <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-black/5">
          <MapContainer
            center={
              userLocation ||
              timPosition
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

            {userLocation && (
              <RecenterMap
                position={
                  userLocation
                }
              />
            )}

            {userLocation && (
              <Marker
                position={
                  userLocation
                }
                icon={getUserIcon(L)}
              >
                <Popup>
                  📍 Posisi Anda
                </Popup>
              </Marker>
            )}

            {markers.map(
              (marker, index) => (
                <Marker
                  key={index}
                  position={[
                    marker.lat,
                    marker.lng,
                  ]}
                  icon={getMarkerIcon(
                    marker.category
                  )}
                >
                  <Popup>
                    <div className="space-y-3 min-w-[220px] text-[#111111]">
                      <div className="flex items-center justify-between">
                        <h2 className="font-black text-lg">
                          {
                            marker.group
                          }
                        </h2>

                        <div className="bg-[#111111] text-white text-xs px-3 py-1 rounded-full capitalize">
                          {
                            marker.category
                          }
                        </div>
                      </div>

                      <p className="text-sm leading-6">
                        {marker.note}
                      </p>

                      {marker.image && (
                        <img
                          src={
                            marker.image
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
    </main>
  )
}