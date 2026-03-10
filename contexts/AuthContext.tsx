'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { User, type AuthChangeEvent, type Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { getProfileById } from '@/lib/services/profileService'
import type { UserProfile, UserRole } from '@/types/user'

const ROLE_CACHE_KEY = 'dw_user_role'

function getCachedRole(): UserRole | null {
  if (typeof window === 'undefined') return null
  return (localStorage.getItem(ROLE_CACHE_KEY) as UserRole) || null
}

function persistRole(role: UserRole | null) {
  if (typeof window === 'undefined') return
  if (role) localStorage.setItem(ROLE_CACHE_KEY, role)
  else localStorage.removeItem(ROLE_CACHE_KEY)
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  cachedRole: UserRole | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  cachedRole: null,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [cachedRole, setCachedRole] = useState<UserRole | null>(null)
  const lastUserIdRef = useRef<string | null>(null)

  // Read role from localStorage only on the client after hydration to avoid SSR mismatch
  useEffect(() => {
    const role = getCachedRole()
    if (role) setCachedRole(role)
  }, [])
  
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const fetchProfile = useCallback(async (userId: string) => {
    const retries = 3
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { data, error } = await getProfileById(userId)

        if (!error) return data

        if (attempt === retries - 1) {
          console.error('Error fetching profile:', error)
          return null
        }
      } catch (error) {
        if (attempt === retries - 1) {
          console.error('Error fetching profile:', error)
          return null
        }
      }

      await sleep(500 * (attempt + 1))
    }
    return null
  }, [])

  useEffect(() => {
    let isMounted = true
    let subscription: { unsubscribe: () => void } | null = null
    let consecutiveRefreshFailures = 0

    const performLocalSignOut = async () => {
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (error) {
        console.error('Error signing out after refresh failure:', error)
      } finally {
        if (isMounted) {
          setUser(null)
          setProfile(null)
        }
      }
    }

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
          lastUserIdRef.current = session?.user?.id ?? null
          if (session?.user) {
            const userProfile = await fetchProfile(session.user.id)
            if (isMounted) {
              setProfile(userProfile)
              const role = userProfile?.role ?? null
              setCachedRole(role)
              persistRole(role)
            }
          } else {
            setProfile(null)
            setCachedRole(null)
            persistRole(null)
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
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted) return

      // Token refresh doesn't change user identity — skip to avoid cascading re-renders
      if (event === 'TOKEN_REFRESHED') return

      const nextUser = session?.user ?? null
      const nextUserId = nextUser?.id ?? null
      const previousUserId = lastUserIdRef.current
      const shouldFetchProfile = Boolean(nextUserId) && nextUserId !== previousUserId

      setUser(nextUser)
      lastUserIdRef.current = nextUserId

      if (!nextUserId) {
        setProfile(null)
        setCachedRole(null)
        persistRole(null)
        return
      }

      // Avoid supabase queries directly inside auth callback to prevent auth-lock deadlocks.
      if (!shouldFetchProfile) {
        return
      }

      Promise.resolve().then(async () => {
        if (!isMounted) return
        const userProfile = await fetchProfile(nextUserId)
        if (isMounted) {
          setProfile(userProfile)
          const role = userProfile?.role ?? null
          setCachedRole(role)
          persistRole(role)
        }
      })
    })
    
    subscription = authSubscription

    // Refresh session when tab becomes visible after inactivity.
    // Keep session fresh proactively (some projects use short JWT lifetimes, e.g. ~5 minutes).
    const refreshSessionSafely = async () => {
      if (!isMounted) return
      const refreshWithTimeout = () =>
        Promise.race([
          supabase.auth.refreshSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Auth refresh timeout')), 8000)
          ),
        ])

      try {
        const { error } = await refreshWithTimeout()
        if (error) throw error
        consecutiveRefreshFailures = 0
        return
      } catch (error) {
        console.warn('Session refresh attempt failed, retrying once...', error)
      }

      await sleep(1000)

      try {
        const { error } = await refreshWithTimeout()
        if (error) throw error
        consecutiveRefreshFailures = 0
      } catch (error) {
        consecutiveRefreshFailures += 1
        console.error('Session refresh failed after retry:', error)

        if (consecutiveRefreshFailures >= 2) {
          console.warn('Signing out due to repeated session refresh failures')
          await performLocalSignOut()
        }
      }
    }

    const refreshInterval = setInterval(() => {
      void refreshSessionSafely()
    }, 4 * 60 * 1000)

    // Refresh session when tab becomes visible after inactivity.
    // onAuthStateChange handles user/profile updates.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        void refreshSessionSafely()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      clearInterval(refreshInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      subscription?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run once on mount

  const refreshProfile = useCallback(async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id)
      setProfile(userProfile)
      const role = userProfile?.role ?? null
      setCachedRole(role)
      persistRole(role)
    }
  }, [user, fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setCachedRole(null)
    persistRole(null)
  }, [])

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    cachedRole,
    signOut,
    refreshProfile
  }), [user, profile, loading, cachedRole, signOut, refreshProfile])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

