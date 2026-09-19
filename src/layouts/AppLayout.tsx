import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Plus, FileText, MessageSquare,
  BarChart2, Settings, Zap, LogOut, ChevronLeft, ChevronRight, Menu
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './AppLayout.css'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Plus, label: 'New Negotiation', path: '/negotiate/new' },
  { icon: FileText, label: 'My Negotiations', path: '/history' },
  { icon: MessageSquare, label: 'Simulator', path: '/simulate' },
  { icon: BarChart2, label: 'Insights', path: '/insights' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, isDemo, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const Sidebar = () => (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <Link to="/dashboard" className="sidebar-logo-link">
          <span className="navbar-logo-icon"><Zap size={14} /></span>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="sidebar-logo-text">DealMind</span>
              <span className="sidebar-version-pill">v2.0</span>
            </div>
          )}
        </Link>
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <span className="sidebar-link-icon">
                <item.icon size={17} />
              </span>
              {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
              {!collapsed && isActive && <span className="sidebar-active-dot" />}
            </Link>
          )
        })}
      </nav>

      {/* CTA if not collapsed */}
      {!collapsed && (
        <div className="sidebar-cta">
          <button className="sidebar-cta-btn" onClick={() => navigate('/negotiate/new')}>
            <Plus size={14} />
            New Negotiation
          </button>
        </div>
      )}

      {/* User */}
      <div className="sidebar-user">
        {isDemo && !collapsed && (
          <div className="sidebar-demo-badge">⚡ Demo Mode</div>
        )}
        <div className="sidebar-user-info">
          <div className="sidebar-avatar">
            {user?.displayName?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="sidebar-user-details">
              <p className="sidebar-user-name">{user?.displayName || 'User'}</p>
              <p className="sidebar-user-email">{user?.email}</p>
            </div>
          )}
        </div>
        <button className="sidebar-signout" onClick={handleSignOut} title="Sign out">
          <LogOut size={15} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )

  return (
    <div className="app-layout">
      {/* Mobile header */}
      <header className="mobile-header">
        <button className="btn btn-icon btn-ghost" onClick={() => setMobileOpen(!mobileOpen)}>
          <Menu size={20} />
        </button>
        <Link to="/dashboard" className="auth-logo" style={{ margin: 0 }}>
          <span className="navbar-logo-icon"><Zap size={13} /></span>
          DealMind
        </Link>
        {isDemo && <span className="badge badge-accent" style={{ fontSize: 10 }}>Demo</span>}
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              className="mobile-sidebar"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="app-body">
        <div className="desktop-sidebar">
          <Sidebar />
        </div>
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  )
}
