import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Zap, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, isDemo, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isLanding = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-icon"><Zap size={16} /></span>
          <span className="navbar-logo-text">DealMind</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar-links">
          {isLanding ? (
            <>
              <a href="#how-it-works" className="navbar-link">How it Works</a>
              <a href="#use-cases" className="navbar-link">Use Cases</a>
              <a href="#simulator" className="navbar-link">Simulator</a>
              <a href="#about" className="navbar-link">About</a>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="navbar-link">Dashboard</Link>
              <Link to="/negotiate/new" className="navbar-link">New Deal</Link>
              <Link to="/history" className="navbar-link">History</Link>
              <Link to="/insights" className="navbar-link">Insights</Link>
            </>
          )}
        </div>

        {/* Auth Buttons */}
        <div className="navbar-actions">
          {user ? (
            <div className="navbar-user">
              <div className="navbar-avatar">
                {user.displayName?.[0]?.toUpperCase() || <User size={14} />}
              </div>
              <span className="navbar-username">{user.displayName?.split(' ')[0]}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <Zap size={14} />
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar-mobile">
          {isLanding ? (
            <>
              <a href="#how-it-works" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>How it Works</a>
              <a href="#use-cases" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>Use Cases</a>
              <a href="#simulator" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>Simulator</a>
              <a href="#about" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>About</a>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/negotiate/new" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>New Deal</Link>
              <Link to="/history" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>History</Link>
              <Link to="/insights" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>Insights</Link>
            </>
          )}
          <div className="navbar-mobile-actions">
            {user ? (
              <button className="btn btn-ghost" onClick={handleSignOut}>Sign Out</button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn btn-accent" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
