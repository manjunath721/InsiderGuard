import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getProfile, login as apiLogin, logout as apiLogout, refreshToken as apiRefreshToken } from '@/lib/api'

type AuthUser = {
  id: number
  username: string
  email: string
  role: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoading(true)
      try {
        const profile = await getProfile()
        if (!active) return
        setUser(profile)
      } catch {
        const refreshed = await apiRefreshToken()
        if (refreshed) {
          try {
            const refreshedProfile = await getProfile()
            if (!active) return
            setUser(refreshedProfile)
          } catch {
            if (!active) return
            setUser(null)
          }
        } else {
          if (!active) return
          setUser(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [])

  const login = async (username: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      await apiLogin(username, password)
      const profile = await getProfile()
      setUser(profile)
      return true
    } catch (err) {
      setUser(null)
      setError(err instanceof Error ? err.message : 'Login failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
