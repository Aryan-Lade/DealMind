import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isDemo: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  enterDemoMode: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// Mock user for demo mode
const DEMO_USER: User = {
  uid: 'demo-user-001',
  email: 'demo@dealmind.ai',
  displayName: 'Demo User',
  photoURL: undefined,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    // Check localStorage for persisted session
    const stored = localStorage.getItem('dealmind_user')
    const demoMode = localStorage.getItem('dealmind_demo')
    if (demoMode === 'true') {
      setUser(DEMO_USER)
      setIsDemo(true)
    } else if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('dealmind_user')
      }
    }
    setLoading(false)
  }, [])

  const enterDemoMode = () => {
    setUser(DEMO_USER)
    setIsDemo(true)
    localStorage.setItem('dealmind_demo', 'true')
    localStorage.setItem('dealmind_user', JSON.stringify(DEMO_USER))
  }

  const signInWithGoogle = async () => {
    // In real implementation, use Firebase Google sign-in
    // For now, use mock mode
    const mockUser: User = {
      uid: 'google-user-' + Date.now(),
      email: 'user@gmail.com',
      displayName: 'Google User',
    }
    setUser(mockUser)
    localStorage.setItem('dealmind_user', JSON.stringify(mockUser))
  }

  const signInWithEmail = async (email: string, _password: string) => {
    if (!email) throw new Error('Email is required')
    // Mock sign-in
    const mockUser: User = {
      uid: 'email-user-' + Date.now(),
      email,
      displayName: email.split('@')[0],
    }
    setUser(mockUser)
    localStorage.setItem('dealmind_user', JSON.stringify(mockUser))
  }

  const signUpWithEmail = async (email: string, _password: string, name: string) => {
    if (!email || !name) throw new Error('All fields required')
    const mockUser: User = {
      uid: 'email-user-' + Date.now(),
      email,
      displayName: name,
    }
    setUser(mockUser)
    localStorage.setItem('dealmind_user', JSON.stringify(mockUser))
  }

  const signOut = async () => {
    setUser(null)
    setIsDemo(false)
    localStorage.removeItem('dealmind_user')
    localStorage.removeItem('dealmind_demo')
  }

  return (
    <AuthContext.Provider value={{ user, loading, isDemo, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, enterDemoMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
