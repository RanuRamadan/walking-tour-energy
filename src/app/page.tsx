'use client'

import {
  ChangeEvent,
  useEffect,
  useState,
} from 'react'

import dynamic from 'next/dynamic'
import Script from 'next/script'

import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
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

  const [groupId, setGroupId] =
    useState('')

  // eventId untuk pemisahan tiap event (sementara hardcode)
  const ACTIVE_EVENT_ID =
    'kelana-energi'


  const [
    showGroupModal,
    setShowGroupModal,
  ] = useState(true)

  const DEFAULT_GROUP_NAME =
    'Kelana Energi'
  const DEFAULT_GROUP_ID =
    'kelana-energi'

  const [tempGroup, setTempGroup] =
    useState(DEFAULT_GROUP_NAME)
  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('terakomodasi')

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

  let emoji = '📍'

  if (
    category ===
    'terakomodasi'
  ) {
    emoji = '📍'
  }

  if (
    category ===
    'tidak_terakomodasi'
  ) {
    emoji = '📍'
  }

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
      activeGroupId: string
    ) => {
      try {
        const q = query(
          collection(
            db,
            'events',
            ACTIVE_EVENT_ID,
            'sessions',
            activeGroupId,
            'observations'
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
            group: doc.data().group || '',
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

 const handleImageUpload = async (
  e: ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0]

  if (!file) return

  try {
    setLoading(true)

    const formData =
      new FormData()

    formData.append(
      'file',
      file
    )

    formData.append(
      'upload_preset',
      'walkingtour'
    )

    const response =
      await fetch(
        'https://api.cloudinary.com/v1_1/dxujsbkya/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      )

    const data =
      await response.json()

    setImage(
      data.secure_url
    )

    setStatusMessage(
      'Foto berhasil upload 📸'
    )
  } catch (error) {
    console.log(error)

    setStatusMessage(
      'Gagal upload foto 😭'
    )
  } finally {
    setLoading(false)
  }
}

  /* =========================
     SAVE SESSION
  ========================= */

const saveGroup = async () => {
  // VALIDASI INPUT
  if (!tempGroup.trim()) {
    alert('Nama wajib diisi dulu ya!')
    return
  }

  // prevent double click
  if (loading) return

  setLoading(true)

  try {
    const newGroupName = tempGroup.trim()

    const newGroupId = newGroupName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')

    localStorage.setItem(
      'kelanaenergi-group-id',
      newGroupId
    )

    localStorage.setItem(
      'kelanaenergi-group-name',
      newGroupName
    )

    await setDoc(
      doc(
        db,
        'events',
        'kelana-energi',
        'sessions',
        newGroupId
      ),
      {
        name: newGroupName,
        active: true,
        createdAt: serverTimestamp(),
      }
    )

    console.log('SESSION CREATED:', newGroupId)

    setGroup(newGroupName)
    setGroupId(newGroupId)

    setShowGroupModal(false)

    setStatusMessage(
      `${newGroupName} siap observasi 🚀`
    )

    loadObservations(newGroupId)
  } catch (error) {
    console.log(error)

    setStatusMessage('Gagal membuat sesi kelompok')
  } finally {
    setLoading(false)
  }
}
  /* =========================
     CHANGE GROUP
  ========================= */

  const changeGroup = () => {
    localStorage.removeItem(
      'kelanaenergi-group-id'
    )
    localStorage.removeItem(
      'kelanaenergi-group-name'
    )

    setGroup('')
    setGroupId('')

    setMarkers([])

    setImage('')

    setSelectedCategory(
      'terakomodasi'
    )

    setShowGroupModal(true)
  }

  /* =========================
     ADD OBSERVATION
  ========================= */

  const addMarker = async () => {

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
          'events',
          ACTIVE_EVENT_ID,
          'sessions',
          groupId,
          'observations'
        ),
        {
          group,
          groupId,
          category:
            selectedCategory,
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

      setImage('')

      setSelectedCategory(
        'Terakomodasi'
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

    const savedGroupId =
      localStorage.getItem(
        'kelanaenergi-group-id'
      )
    const savedGroupName =
      localStorage.getItem(
        'kelanaenergi-group-name'
      )

    const activeGroupId =
      savedGroupId || ''
    const activeGroupName =
      savedGroupName ||
      DEFAULT_GROUP_NAME

    setGroup(activeGroupName)
    setTempGroup(activeGroupName)
    setGroupId(activeGroupId)
      if (
        savedGroupId &&
        savedGroupName
      ) {
        setShowGroupModal(false)

        loadObservations(
          activeGroupId
        )
      } else {
        setShowGroupModal(true)
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
              Isi dengan nama kamu ya!
            </p>

            <div className="mt-7">
              <input
                type="text"
                
                placeholder="Nama lengkapmu?"
                onChange={(e) =>
                  setTempGroup(e.target.value)
                }
                className="w-full rounded-2xl border border-black/10 bg-[#FAFAFA] p-4 text-black"
              />
              
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
                Kelana Energi
              </p>

              <h1 className="text-4xl font-black leading-tight">
                Peta
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
                Ganti User
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}

      <section className="px-4">
        <div className="bg-white rounded-[32px] p-5 shadow-lg border border-black/5">
            {/* IMAGE (ambil foto dulu) */}
            <div className="mt-7">
              <p className="text-sm font-semibold mb-2">
                Upload Foto
              </p>

              <style>{`
                @keyframes cameraPulse {
                  0% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.6; transform: scale(1.05); }
                  100% { opacity: 1; transform: scale(1); }
                }
                .camera-icon-animate {
                  animation: cameraPulse 2s ease-in-out infinite;
                }
              `}</style>
              <label className="group flex flex-col items-center justify-center w-full h-40 rounded-3xl border-2 border-dashed border-black/10 bg-[#FAFAFA] cursor-pointer hover:shadow-lg transition-shadow duration-200">
                <div className="text-center">
                  <svg className={`mx-auto transition-all duration-300 ${image ? 'opacity-40' : 'camera-icon-animate'}`} width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 7H6L7 5H17L18 7H20V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V7Z" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="3.5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>

                  <p className="text-sm text-black/50 mt-3">
                    Upload dokumentasi / ambil foto
                  </p>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
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

            {/* CATEGORY */}

            <div className="mt-7">
              <p className="text-sm font-semibold mb-3">
                Menurutmu, apakah ini terakomodasi panel surya?
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    setSelectedCategory(
                      'terakomodasi'
                    )
                  }
                  className={`rounded-2xl p-4 h-[90px] text-sm font-bold transition flex flex-col items-center justify-center ${
                    selectedCategory ===
                    'terakomodasi'
                      ? 'bg-[#0D5C2F] text-white'
                      : 'bg-[#E9F4EC] text-[#111111]'
                  }`}
                >
                    <svg className={`${selectedCategory === 'terakomodasi' ? 'animate-pulse' : 'transition-transform transform hover:scale-105'} text-white`} width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="mt-2">Terakomodasi</span>
                </button>

                <button
                  onClick={() =>
                    setSelectedCategory(
                      'tidak_terakomodasi'
                    )
                  }
                  className={`rounded-2xl p-4 h-[90px] text-sm font-bold transition flex flex-col items-center justify-center ${
                    selectedCategory ===
                    'tidak_terakomodasi'
                      ? 'bg-[#C0392B] text-white'
                      : 'bg-[#FFE5E1] text-[#111111]'
                  }`}
                >
                  <svg className={`${selectedCategory === 'tidak_terakomodasi' ? 'animate-pulse' : 'transition-transform transform hover:scale-105'} text-white`} width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="mt-2">Tidak Terakomodasi</span>
                </button>
              </div>
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
