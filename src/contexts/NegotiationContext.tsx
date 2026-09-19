import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api, TOKEN_KEY } from '../services/api'
import { useAuth } from './AuthContext'

export interface Negotiation {
  id: string
  title: string
  type: string
  currentOffer: number
  desiredOffer: number
  walkAway: number
  minAcceptable: number
  maxDesired: number
  batna: string
  context: string
  strengths: string
  deadline: string
  otherParty: string
  relationship: string
  analysis?: any
  status: 'draft' | 'analyzed' | 'simulating' | 'completed'
  createdAt: Date
  updatedAt: Date
  score?: number
  finalOffer?: number
  messages?: any[]
}

interface NegotiationContextType {
  negotiations: Negotiation[]
  currentNegotiation: Negotiation | null
  cloudStatus: 'synced' | 'syncing' | 'offline' | 'local'
  setCurrentNegotiation: (n: Negotiation | null) => void
  addNegotiation: (n: Omit<Negotiation, 'id' | 'createdAt' | 'updatedAt'>) => Negotiation
  updateNegotiation: (id: string, updates: Partial<Negotiation>) => void
  deleteNegotiation: (id: string) => void
  getById: (id: string) => Negotiation | undefined
  syncToCloud: () => Promise<number>
}

const NegotiationContext = createContext<NegotiationContextType | null>(null)

const STORAGE_KEY = 'dealmind_negotiations'

export function NegotiationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [currentNegotiation, setCurrentNegotiation] = useState<Negotiation | null>(null)
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'syncing' | 'offline' | 'local'>('local')

  // When user changes / signs in, load negotiations from database
  useEffect(() => {
    async function loadUserNegotiations() {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token || !user) {
        setNegotiations([])
        setCurrentNegotiation(null)
        setCloudStatus('local')
        return
      }

      try {
        setCloudStatus('syncing')
        const remoteItems = await api.get<any[]>('/api/negotiations')
        const withDates = remoteItems.map(n => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
        }))

        setNegotiations(withDates)
        localStorage.setItem(`${STORAGE_KEY}_${user.uid}`, JSON.stringify(withDates))
        setCloudStatus('synced')
      } catch (err) {
        console.warn('Could not load from database, checking local cache:', err)
        const stored = localStorage.getItem(`${STORAGE_KEY}_${user.uid}`)
        if (stored) {
          try {
            const parsed = JSON.parse(stored).map((n: any) => ({
              ...n,
              createdAt: new Date(n.createdAt),
              updatedAt: new Date(n.updatedAt),
            }))
            setNegotiations(parsed)
          } catch {
            localStorage.removeItem(`${STORAGE_KEY}_${user.uid}`)
          }
        }
        setCloudStatus('offline')
      }
    }

    loadUserNegotiations()
  }, [user])

  const persist = (data: Negotiation[]) => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.uid}`, JSON.stringify(data))
    }
  }

  const syncToCloud = async (): Promise<number> => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token || !user) return 0

    setCloudStatus('syncing')
    try {
      const res = await api.post<{ success: boolean; synced: number }>('/api/negotiations/sync', {
        negotiations,
      })
      setCloudStatus('synced')
      return res.synced || 0
    } catch (err) {
      setCloudStatus('offline')
      throw err
    }
  }

  const addNegotiation = (n: Omit<Negotiation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newN: Negotiation = {
      ...n,
      id: 'neg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const updated = [newN, ...negotiations]
    setNegotiations(updated)
    persist(updated)

    // Save to database
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && user) {
      setCloudStatus('syncing')
      api.post('/api/negotiations', newN)
        .then(() => setCloudStatus('synced'))
        .catch(err => {
          console.warn('Failed to save to database, cached locally:', err)
          setCloudStatus('offline')
        })
    }

    return newN
  }

  const updateNegotiation = (id: string, updates: Partial<Negotiation>) => {
    const updated = negotiations.map(n =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n
    )
    setNegotiations(updated)
    persist(updated)

    if (currentNegotiation?.id === id) {
      setCurrentNegotiation(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null)
    }

    // Save update to database
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && user) {
      setCloudStatus('syncing')
      api.put(`/api/negotiations/${id}`, updates)
        .then(() => setCloudStatus('synced'))
        .catch(err => {
          console.warn('Failed to update in database, cached locally:', err)
          setCloudStatus('offline')
        })
    }
  }

  const deleteNegotiation = (id: string) => {
    const updated = negotiations.filter(n => n.id !== id)
    setNegotiations(updated)
    persist(updated)

    const token = localStorage.getItem(TOKEN_KEY)
    if (token && user) {
      setCloudStatus('syncing')
      api.delete(`/api/negotiations/${id}`)
        .then(() => setCloudStatus('synced'))
        .catch(err => {
          console.warn('Failed to delete from database:', err)
          setCloudStatus('offline')
        })
    }
  }

  const getById = (id: string) => negotiations.find(n => n.id === id)

  return (
    <NegotiationContext.Provider value={{
      negotiations,
      currentNegotiation,
      cloudStatus,
      setCurrentNegotiation,
      addNegotiation,
      updateNegotiation,
      deleteNegotiation,
      getById,
      syncToCloud,
    }}>
      {children}
    </NegotiationContext.Provider>
  )
}

export function useNegotiations() {
  const ctx = useContext(NegotiationContext)
  if (!ctx) throw new Error('useNegotiations must be used within NegotiationProvider')
  return ctx
}
