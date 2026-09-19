import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  )
}

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUpWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await signUpWithEmail(email, password, name)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate('/dashboard')
    } catch {
      setError('Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <span className="navbar-logo-icon"><Zap size={14} /></span>
          <span>DealMind</span>
        </Link>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle text-secondary">Start negotiating smarter in minutes</p>

        <button className="btn btn-dark auth-google" onClick={handleGoogle} disabled={loading}>
          <GoogleIcon size={18} />
          Continue with Google
        </button>

        <div className="auth-divider"><span>or sign up with email</span></div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span>{error}</span>
              {error.toLowerCase().includes('already exists') && (
                <Link to="/login" style={{ color: '#FF5722', fontWeight: 600, textDecoration: 'underline' }}>
                  Click here to Sign In &rarr;
                </Link>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-wrapper">
              <User size={16} className="input-icon" />
              <input type="text" className="form-input input-with-icon" placeholder="Your name"
                value={name} onChange={e => setName(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input type="email" className="form-input input-with-icon" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input type={showPw ? 'text' : 'password'} className="form-input input-with-icon input-with-right-icon"
                placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="input-right-icon" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-accent auth-submit" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : (<>Create Account <ArrowRight size={16} /></>)}
          </button>
        </form>

        <div className="auth-links">
          <span className="text-secondary">Already have an account?</span>
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>

      </div>
    </div>
  )
}
