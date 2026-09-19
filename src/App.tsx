import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NegotiationProvider } from './contexts/NegotiationContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NewNegotiation from './pages/NewNegotiation'
import StrategyPage from './pages/StrategyPage'
import Simulator from './pages/Simulator'
import SimulatorHub from './pages/SimulatorHub'
import History from './pages/History'
import Insights from './pages/Insights'
import Settings from './pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 20 }}>⚡</div>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading DealMind...</p>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function DemoBanner() {
  const { isDemo } = useAuth()
  if (!isDemo) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10001,
      background: 'var(--accent)', color: '#FFFFFF', textAlign: 'center',
      padding: '6px 16px', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
    }}>
      ⚡ DEMO MODE — Using mock AI responses. All features work! Data saves locally.
    </div>
  )
}

function AppContent() {
  const { isDemo } = useAuth()
  return (
    <div style={isDemo ? { paddingTop: 32 } : {}}>
      <DemoBanner />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/negotiate/new" element={<ProtectedRoute><NewNegotiation /></ProtectedRoute>} />
        <Route path="/negotiate/:id" element={<ProtectedRoute><StrategyPage /></ProtectedRoute>} />
        <Route path="/simulate/:id" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/simulate" element={<ProtectedRoute><SimulatorHub /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NegotiationProvider>
        <AppContent />
      </NegotiationProvider>
    </AuthProvider>
  )
}
