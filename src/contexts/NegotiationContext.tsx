import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
  setCurrentNegotiation: (n: Negotiation | null) => void
  addNegotiation: (n: Omit<Negotiation, 'id' | 'createdAt' | 'updatedAt'>) => Negotiation
  updateNegotiation: (id: string, updates: Partial<Negotiation>) => void
  deleteNegotiation: (id: string) => void
  getById: (id: string) => Negotiation | undefined
}

const NegotiationContext = createContext<NegotiationContextType | null>(null)

const STORAGE_KEY = 'dealmind_negotiations'

export function NegotiationProvider({ children }: { children: ReactNode }) {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [currentNegotiation, setCurrentNegotiation] = useState<Negotiation | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Convert date strings back to Date objects
        const withDates = parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
        }))
        setNegotiations(withDates)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const persist = (data: Negotiation[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const addNegotiation = (n: Omit<Negotiation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newN: Negotiation = {
      ...n,
      id: 'neg-' + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const updated = [newN, ...negotiations]
    setNegotiations(updated)
    persist(updated)
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
  }

  const deleteNegotiation = (id: string) => {
    const updated = negotiations.filter(n => n.id !== id)
    setNegotiations(updated)
    persist(updated)
  }

  const getById = (id: string) => negotiations.find(n => n.id === id)

  return (
    <NegotiationContext.Provider value={{
      negotiations,
      currentNegotiation,
      setCurrentNegotiation,
      addNegotiation,
      updateNegotiation,
      deleteNegotiation,
      getById,
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
