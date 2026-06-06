import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getSupabase, isSupabaseMode } from '../lib/supabaseClient'
import {
  supabaseFetchProfile,
  supabaseSignOut,
  persistSupabaseUser,
  clearSupabaseSession
} from '../services/supabaseAuth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [utilisateur, setUtilisateur] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('utilisateur') || 'null')
    } catch {
      return null
    }
  })
  const [authReady, setAuthReady] = useState(!isSupabaseMode())

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseMode()) return
    const profile = await supabaseFetchProfile()
    if (profile) {
      setUtilisateur(profile)
      persistSupabaseUser(profile)
    }
    return profile
  }, [])

  useEffect(() => {
    if (!isSupabaseMode()) return undefined

    const sb = getSupabase()

    sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        refreshProfile().finally(() => setAuthReady(true))
      } else {
        clearSupabaseSession()
        setUtilisateur(null)
        setAuthReady(true)
      }
    })

    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        await refreshProfile()
      } else {
        setUtilisateur(null)
        clearSupabaseSession()
      }
    })

    return () => subscription.unsubscribe()
  }, [refreshProfile])

  const logout = useCallback(async () => {
    if (isSupabaseMode()) {
      await supabaseSignOut()
    }
    clearSupabaseSession()
    setSession(null)
    setUtilisateur(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isSupabaseMode: isSupabaseMode(),
        session,
        utilisateur,
        setUtilisateur,
        authReady,
        refreshProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
