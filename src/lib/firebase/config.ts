import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

// Check if we're in demo mode (no real Firebase config)
const isDemoMode = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY

const firebaseConfig = {
  // Use real Firebase config from environment variables, or demo values for development
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemo-Key-For-Local-Development-Only",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const db = getFirestore(app)
export const auth = getAuth(app)

// Connect to emulators in development or demo mode
if (typeof window !== 'undefined') {
  const shouldUseEmulators = process.env.NODE_ENV === 'development' || isDemoMode
  
  if (shouldUseEmulators) {
    try {
      // Only connect if not already connected
      if (!auth.config.emulator) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
        console.log('Connected to Firebase Auth emulator')
      }
      // @ts-expect-error - private property but needed for emulator check
      if (!db._delegate._databaseId.projectId.includes('localhost')) {
        connectFirestoreEmulator(db, 'localhost', 8080)
        console.log('Connected to Firebase Firestore emulator')
      }
    } catch (error) {
      console.warn('Could not connect to Firebase emulators (this is expected if not running locally):', error)
    }
  }
}

export { isDemoMode }

export default app