import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loadProfile = async (currentSession) => {
      if (!active) return
      setSession(currentSession)
      if (!currentSession?.user) {
        setProfile(null)
        setLoading(false)
        return
      }
      const { data, error } = await supabase.from('profiles')
        .select('id,full_name,phone,role').eq('id', currentSession.user.id).maybeSingle()
      if (!active) return
      if (error) console.error('Profile loading failed:', error.message)
      setProfile(data ?? null)
      setLoading(false)
    }
    supabase.auth.getSession().then(({ data }) => loadProfile(data.session)).catch(() => setLoading(false))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Avoid awaiting a database request inside the auth event callback.
      setTimeout(() => { if (active) loadProfile(newSession) }, 0)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  const refreshProfile = async () => {
    if (!session?.user) return
    const { data, error } = await supabase.from('profiles')
      .select('id,full_name,phone,role').eq('id', session.user.id).maybeSingle()
    if (!error) setProfile(data)
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, isAdmin: profile?.role === 'admin', refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
