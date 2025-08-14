import { supabase, isDemoMode } from './config'

export interface UserProfile {
  id: string
  user_id: string
  username: string
  display_name?: string
  email_verified: boolean
  profile_picture_url?: string
  preferred_table_level: string
  preferred_game_variant: string
  created_at: string
  updated_at: string
}

export interface UserGameData {
  id: string
  user_id: string
  total_chips: number
  current_table_level: string
  current_game_variant: string
  
  // Statistics
  total_hands_played: number
  hands_won: number
  hands_lost: number
  hands_pushed: number
  blackjacks_hit: number
  total_winnings: number
  total_losses: number
  biggest_win: number
  biggest_loss: number
  winning_streak: number
  current_streak: number
  longest_winning_streak: number
  
  // Advanced statistics
  hands_by_variant: Record<string, number>
  hands_by_table_level: Record<string, number>
  strategy_accuracy: Record<string, number>
  betting_patterns: Record<string, any>
  
  // Achievements and progression
  achievements_unlocked: string[]
  achievement_progress: Record<string, any>
  tables_unlocked: string[]
  variants_unlocked: string[]
  tutorial_progress: Record<string, any>
  
  // Multiplayer statistics
  multiplayer_games_played: number
  multiplayer_games_won: number
  multiplayer_tables_hosted: number
  multiplayer_total_winnings: number
  
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  email_confirmed_at?: string
  profile?: UserProfile
  gameData?: UserGameData
}

// Simple profanity filter - basic words to block
const PROFANITY_LIST = [
  'fuck', 'shit', 'damn', 'hell', 'bitch', 'ass', 'crap', 'piss', 'bastard',
  'whore', 'slut', 'faggot', 'nigger', 'retard', 'gay', 'homo', 'nazi',
  'hitler', 'penis', 'vagina', 'sex', 'porn', 'nude', 'boobs', 'dick'
]

export class AuthService {
  /**
   * Validate username format and availability
   */
  async validateUsername(username: string): Promise<{ isValid: boolean; error?: string }> {
    if (isDemoMode || !supabase) {
      return { isValid: true }
    }

    // Check length
    if (username.length < 3 || username.length > 16) {
      return { isValid: false, error: 'Username must be between 3 and 16 characters' }
    }

    // Check format
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and dashes' }
    }

    // Check for admin
    if (username.toLowerCase().includes('admin')) {
      return { isValid: false, error: 'Username cannot contain "admin"' }
    }

    // Check for profanity
    const lowercaseUsername = username.toLowerCase()
    for (const word of PROFANITY_LIST) {
      if (lowercaseUsername.includes(word)) {
        return { isValid: false, error: 'Username contains inappropriate content' }
      }
    }

    try {
      // Check availability in database
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('username')
        .ilike('username', username)
        .single()

      if (existingUser) {
        return { isValid: false, error: 'Username is already taken' }
      }

      return { isValid: true }
    } catch (error) {
      // If no user found, username is available
      return { isValid: true }
    }
  }

  /**
   * Sign up new user with email and password
   */
  async signUp(email: string, password: string, username: string): Promise<{ user?: AuthUser; error?: string }> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Mock sign up')
      return {
        user: {
          id: 'demo-user',
          email,
          profile: {
            id: 'demo-profile',
            user_id: 'demo-user',
            username,
            email_verified: false,
            preferred_table_level: 'beginner',
            preferred_game_variant: 'vegas',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }
    }

    try {
      // Validate username first
      const validation = await this.validateUsername(username)
      if (!validation.isValid) {
        return { error: validation.error }
      }

      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) {
        return { error: authError.message }
      }

      if (!authData.user) {
        return { error: 'Failed to create user account' }
      }

      console.log('User created:', authData.user.id, 'Session:', !!authData.session)

      // If there's a session, set it immediately to ensure RLS works
      if (authData.session) {
        await supabase.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token
        })
        
        // Wait a moment for session to be established
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Create user profile using database function (bypasses RLS)
      console.log('Creating profile for user:', authData.user.id)
      const { data: profileResult, error: profileError } = await supabase
        .rpc('create_user_profile', {
          p_user_id: authData.user.id,
          p_username: username,
          p_email_verified: false
        })

      if (profileError) {
        console.error('Profile creation failed:', profileError)
        return { error: `Failed to create user profile: ${profileError.message}` }
      }

      console.log('Profile created successfully:', profileResult)

      // Create initial game data using database function (bypasses RLS)
      const { error: gameDataError } = await supabase
        .rpc('create_user_game_data', {
          p_user_id: authData.user.id,
          p_total_chips: 1000,
          p_current_table_level: 'beginner',
          p_current_game_variant: 'vegas'
        })

      if (gameDataError) {
        console.warn('Game data creation failed:', gameDataError)
        // Game data creation failed, but this is not critical for signup
      }

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          email_confirmed_at: authData.user.email_confirmed_at,
          profile: profileResult
        }
      }
    } catch (error: any) {
      return { error: error.message || 'Sign up failed' }
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string): Promise<{ user?: AuthUser; error?: string }> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Mock sign in')
      return {
        user: {
          id: 'demo-user',
          email,
          email_confirmed_at: new Date().toISOString(),
          profile: {
            id: 'demo-profile',
            user_id: 'demo-user',
            username: 'DemoUser',
            email_verified: true,
            preferred_table_level: 'beginner',
            preferred_game_variant: 'vegas',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }
    }

    try {
      console.log('Attempting sign in for:', email)
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.error('Sign in auth error:', authError)
        return { error: authError.message }
      }

      if (!authData.user || !authData.session) {
        console.error('Sign in failed: no user or session')
        return { error: 'Sign in failed' }
      }

      console.log('Sign in successful, user ID:', authData.user.id)

      // Wait a moment for the auth state to update
      await new Promise(resolve => setTimeout(resolve, 100))

      // Get user profile
      let profile = await this.getUserProfile(authData.user.id)
      
      if (!profile) {
        console.warn('No profile found for user:', authData.user.id, '- this user may need profile creation')
        return { error: 'Account data not found. Please try signing up again with a new account.' }
      }

      console.log('Profile loaded:', profile.username)

      const user = {
        id: authData.user.id,
        email: authData.user.email!,
        email_confirmed_at: authData.user.email_confirmed_at,
        profile
      }

      return { user }
    } catch (error: any) {
      console.error('Sign in error:', error)
      return { error: error.message || 'Sign in failed' }
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error?: string }> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Mock sign out')
      return {}
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return { error: error.message }
      }
      return {}
    } catch (error: any) {
      return { error: error.message || 'Sign out failed' }
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ error?: string }> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Mock password reset')
      return {}
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error: any) {
      return { error: error.message || 'Password reset failed' }
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (isDemoMode || !supabase) {
      return null
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      const profile = await this.getUserProfile(user.id)

      // If user exists but profile doesn't, the user was likely deleted externally
      if (!profile) {
        // Sign out the user since their account no longer exists
        await supabase.auth.signOut()
        return null
      }

      return {
        id: user.id,
        email: user.email!,
        email_confirmed_at: user.email_confirmed_at,
        profile
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    if (isDemoMode || !supabase) {
      return undefined
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        // Profile doesn't exist - this shouldn't happen for properly signed up users
        return undefined
      }

      return data
    } catch (error) {
      return undefined
    }
  }

  /**
   * Get user game data by user ID
   */
  async getUserGameData(userId: string): Promise<UserGameData | undefined> {
    if (isDemoMode || !supabase) {
      return undefined
    }

    try {
      const { data, error } = await supabase
        .from('user_game_data')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        return undefined
      }

      return data
    } catch (error) {
      return undefined
    }
  }

  /**
   * Update user game data
   */
  async updateGameData(userId: string, gameData: Partial<UserGameData>): Promise<{ error?: string }> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Mock game data update')
      return {}
    }

    try {
      const { error } = await supabase
        .from('user_game_data')
        .update(gameData)
        .eq('user_id', userId)

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error: any) {
      return { error: error.message || 'Failed to update game data' }
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<{ error?: string }> {
    if (isDemoMode || !supabase) {
      console.warn('Demo mode: Mock email verification')
      return {}
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: (await this.getCurrentUser())?.email || ''
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error: any) {
      return { error: error.message || 'Failed to resend verification email' }
    }
  }

  /**
   * Check if user email is verified
   */
  isEmailVerified(user: AuthUser | null): boolean {
    if (isDemoMode) {
      return true
    }
    return user?.email_confirmed_at != null
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    if (isDemoMode || !supabase) {
      return () => {}
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id || 'no user')
      
      if (session?.user) {
        try {
          const profile = await this.getUserProfile(session.user.id)
          
          // If user exists but profile doesn't, the user was likely deleted externally
          if (!profile) {
            console.warn('User exists but profile not found, signing out')
            // Sign out the user since their account no longer exists
            await supabase.auth.signOut()
            callback(null)
            return
          }
          
          const user = {
            id: session.user.id,
            email: session.user.email!,
            email_confirmed_at: session.user.email_confirmed_at,
            profile
          }
          
          console.log('Auth state change - user authenticated:', user.profile?.username)
          callback(user)
        } catch (error) {
          console.error('Error loading profile during auth state change:', error)
          callback(null)
        }
      } else {
        console.log('Auth state change - user signed out')
        callback(null)
      }
    })

    return () => subscription.unsubscribe()
  }
}

export const authService = new AuthService()