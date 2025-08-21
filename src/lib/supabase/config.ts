import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Check if we're in demo mode (no real Supabase config)
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your_supabase') || false

const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-role-key'
}

// Log configuration status for debugging
if (typeof window !== 'undefined') {
  console.log('Supabase Config Status:', {
    isDemoMode,
    url: supabaseConfig.url,
    anonKey: supabaseConfig.anonKey.substring(0, 20) + '...',
    hasEnvUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasEnvAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    environment: process.env.NODE_ENV
  })
}

// Initialize Supabase client
let supabase: any = null

try {
  if (isDemoMode) {
    console.warn('Demo mode: Using mock Supabase client for development')
    // Create a mock client for demo mode
    supabase = {
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInAnonymously: () => Promise.resolve({ 
          data: { 
            user: { 
              id: 'demo-user-' + Math.random().toString(36).substring(7),
              email: null,
              is_anonymous: true 
            } 
          }, 
          error: null 
        }),
        signOut: () => Promise.resolve({ error: null }),
        getUser: () => Promise.resolve({ 
          data: { 
            user: { 
              id: 'demo-user',
              email: null,
              is_anonymous: true 
            } 
          }, 
          error: null 
        })
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
        subscribe: () => ({ 
          on: () => ({ 
            subscribe: () => ({ unsubscribe: () => {} }) 
          }) 
        })
      }),
      channel: () => ({
        on: () => ({
          on: () => ({
            subscribe: () => ({ unsubscribe: () => {} })
          })
        })
      }),
      removeChannel: () => {},
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: null }),
          download: () => Promise.resolve({ data: null, error: null }),
          remove: () => Promise.resolve({ data: null, error: null })
        })
      }
    }
  } else {
    // Create real Supabase client
    supabase = createBrowserClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    )
  }
} catch (error) {
  console.error('Failed to initialize Supabase:', error)
  // Create mock client for development when Supabase fails
  supabase = null
}

export { supabase, isDemoMode }

// Ensure user is authenticated (sign in anonymously if needed)
export async function ensureAuthenticated() {
  // If Supabase is not available, create a mock user
  if (!supabase || isDemoMode) {
    console.warn('Supabase not available or in demo mode. Creating mock user for development.')
    return {
      id: 'mock-user-' + Math.random().toString(36).substring(7),
      email: null,
      is_anonymous: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_metadata: {},
      app_metadata: {}
    } as any
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (user) {
      return user
    }
    
    // Sign in anonymously
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
    
    if (authError) {
      throw authError
    }
    
    console.log('Authenticated anonymously for multiplayer features')
    return authData.user
  } catch (error: any) {
    console.error('Failed to authenticate:', error)
    
    // Return a mock user object for development when Supabase auth is not available
    return {
      id: 'mock-user-' + Math.random().toString(36).substring(7),
      email: null,
      is_anonymous: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_metadata: {},
      app_metadata: {}
    } as any
  }
}

// Export default client
export default supabase