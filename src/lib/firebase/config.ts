import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth'

// Check if we're in demo mode (no real Firebase config)
const isDemoMode = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Demo')

const firebaseConfig = {
  // Use real Firebase config from environment variables, or demo values for development
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemo-Key-For-Local-Development-Only",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
}

// Log configuration status for debugging
if (typeof window !== 'undefined') {
  console.log('Firebase Config Status:', {
    isDemoMode,
    projectId: firebaseConfig.projectId,
    hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  })
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const db = getFirestore(app)
export const auth = getAuth(app)

// Connect to emulators in development or demo mode
if (typeof window !== 'undefined') {
  const shouldUseEmulators = process.env.NODE_ENV === 'development' && isDemoMode
  
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
      console.warn('Could not connect to Firebase emulators:', error)
    }
  } else if (!isDemoMode) {
    console.log('Using production Firebase configuration')
  }
}

// Ensure user is authenticated (sign in anonymously if needed)
export async function ensureAuthenticated() {
  if (auth.currentUser) {
    return auth.currentUser
  }
  
  if (isDemoMode) {
    console.warn('Demo mode: Multiplayer features may not work properly')
    // In demo mode, create a mock user for development
    return {
      uid: 'demo-user-' + Math.random().toString(36).substring(7),
      displayName: 'Demo User',
      isAnonymous: true
    } as any
  }
  
  try {
    const result = await signInAnonymously(auth)
    console.log('Authenticated anonymously for multiplayer features')
    return result.user
  } catch (error: any) {
    console.error('Failed to authenticate:', error)
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/admin-restricted-operation') {
      console.warn('Anonymous authentication is disabled in Firebase. Creating mock user for development.')
      // Return a mock user object for development when anonymous auth is disabled
      return {
        uid: 'mock-user-' + Math.random().toString(36).substring(7),
        displayName: 'Anonymous Player',
        isAnonymous: true,
        email: null,
        emailVerified: false,
        photoURL: null,
        providerData: [],
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      } as any
    }
    
    throw new Error(`Authentication failed: ${error.message || 'Please check your internet connection and Firebase configuration.'}`)
  }
}

export { isDemoMode }

export default app