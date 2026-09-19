import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api, TOKEN_KEY } from '../services/api'

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  isAdmin?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isDemo: boolean
  isAdmin: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initAuth() {
      // Clear any legacy demo flags
      localStorage.removeItem('dealmind_demo')

      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) {
        localStorage.removeItem('dealmind_user')
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const profile = await api.get<User>('/api/auth/me')
        setUser(profile)
        localStorage.setItem('dealmind_user', JSON.stringify(profile))
      } catch {
        // If session token is invalid or expired, log out
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('dealmind_user')
        setUser(null)
      }

      setLoading(false)
    }

    initAuth()
  }, [])

  const signInWithGoogle = async () => {
    try {
      const res = await api.post<{ token: string; user: User }>('/api/auth/google', {
        email: 'google.user@dealmind.ai',
        displayName: 'Google User',
      })
      if (res.token) {
        localStorage.setItem(TOKEN_KEY, res.token)
      }
      setUser(res.user)
      localStorage.setItem('dealmind_user', JSON.stringify(res.user))
    } catch (err: any) {
      throw new Error(err.message || 'Google sign-in failed. Please try again.')
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    if (!email) throw new Error('Email is required')
    if (!password) throw new Error('Password is required')

    try {
      const res = await api.post<{ token: string; user: User }>('/api/auth/login', {
        email,
        password,
      })
      if (res.token) {
        localStorage.setItem(TOKEN_KEY, res.token)
      }
      setUser(res.user)
      localStorage.setItem('dealmind_user', JSON.stringify(res.user))
    } catch (err: any) {
      // Re-throw server database error to ensure unregistered users cannot sign in
      throw new Error(err.message || 'Login failed. Please check your credentials.')
    }
  }

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    if (!email || !name || !password) throw new Error('All fields required')

    try {
      const res = await api.post<{ token: string; user: User }>('/api/auth/register', {
        email,
        password,
        name,
      })
      if (res.token) {
        localStorage.setItem(TOKEN_KEY, res.token)
      }
      setUser(res.user)
      localStorage.setItem('dealmind_user', JSON.stringify(res.user))
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed. Please try again.')
    }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('dealmind_user')
    localStorage.removeItem('dealmind_demo')
  }

  const isAdmin = user?.email?.toLowerCase().trim() === 'aryan_as_admin@gmail.com' || Boolean(user?.isAdmin)

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isDemo: false,
      isAdmin,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
