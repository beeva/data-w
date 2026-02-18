'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { getProfileById } from '@/lib/services/profileService'
import type { UserProfile } from '@/types/user'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Memoize supabase client to prevent re-creation on every render
  const supabase = useMemo(() => createClient(), [])

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await getProfileById(userId)

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    let subscription: { unsubscribe: () => void } | null = null

    const initializeAuth = async () => {
      try {
        // Race getSession against a timeout to prevent navigator.locks deadlock
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
        ])

        if (!isMounted) return

        if (!sessionResult) {
          console.warn('Auth session fetch timed out, continuing without session')
          if (isMounted) setLoading(false)
          return
        }

        const { data: { session }, error } = sessionResult as Awaited<ReturnType<typeof supabase.auth.getSession>>

        if (error) {
          console.error('Error getting session:', error)
          if (isMounted) setLoading(false)
          return
        }

        if (isMounted) {
          setUser(session?.user ?? null)
          if (session?.user) {
            const userProfile = await fetchProfile(session.user.id)
            if (isMounted) setProfile(userProfile)
          } else {
            setProfile(null)
          }
          setLoading(false)
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError' && !error?.message?.includes('aborted')) {
          console.error('Error initializing auth:', error)
        }
        if (isMounted) setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      
      setUser(session?.user ?? null)
      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id)
        if (isMounted) setProfile(userProfile)
      } else {
        setProfile(null)
      }
    })
    
    subscription = authSubscription

    // Refresh session when tab becomes visible after inactivity
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        supabase.auth.refreshSession().then(({ data: { session }, error: refreshError }) => {
          if (!isMounted) return
          if (refreshError || !session) {
            setUser(null)
            setProfile(null)
          } else {
            setUser(session.user)
          }
        }).catch(() => {})
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      subscription?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run once on mount

  const refreshProfile = useCallback(async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id)
      setProfile(userProfile)
    }
  }, [user, fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [supabase])

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    signOut,
    refreshProfile
  }), [user, profile, loading, signOut, refreshProfile])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

