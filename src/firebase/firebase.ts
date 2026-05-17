import { initializeApp } from 'firebase/app'

import {
  getFirestore,
} from 'firebase/firestore'

import {
  getStorage,
} from 'firebase/storage'

const firebaseConfig = {
  apiKey:
    'AIzaSyB5M7kj0lUKGnv2-K-cghSK0tD67XTED94',

  authDomain:
    'kota-kita-kelas-kita.firebaseapp.com',

  projectId:
    'kota-kita-kelas-kita',

  storageBucket:
    'kota-kita-kelas-kita.firebasestorage.app',

  messagingSenderId:
    '688729258921',

  appId:
    '1:688729258921:web:21f5e2d3eecaa42c89a2b8',
}

const app =
  initializeApp(firebaseConfig)

export const db =
  getFirestore(app)

export const storage =
  getStorage(app)