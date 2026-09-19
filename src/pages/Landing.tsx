import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Zap, ArrowRight, Target, TrendingUp, Brain, Shield,
  ChevronRight, Star, MessageSquare, BarChart2, Clock,
  DollarSign, Home, Briefcase, ShoppingBag, RefreshCw, Building2
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency } from '../data/mockData'
import './Landing.css'

// Animated counter hook
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

const USE_CASES = [
  { icon: DollarSign, label: 'Salary', color: '#22C55E', desc: 'Know your market value & anchor high' },
  { icon: Home, label: 'Rent', color: '#3B82F6', desc: 'Negotiate with your landlord confidently' },
  { icon: Briefcase, label: 'Freelancing', color: '#F59E0B', desc: 'Price your work at its real value' },
  { icon: ShoppingBag, label: 'Purchases', color: '#EC4899', desc: 'Never pay sticker price again' },
  { icon: RefreshCw, label: 'Subscriptions', color: '#8B5CF6', desc: 'Cancel leverage into better deals' },
  { icon: Building2, label: 'Business', color: '#EF4444', desc: 'Close deals on your terms' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Tell us your situation', desc: 'Share the offer, your goal, context, and alternatives.' },
  { step: '02', title: 'AI finds your leverage', desc: 'DealMind maps your bargaining power across key factors.' },
  { step: '03', title: 'Build your strategy', desc: 'Get opening offers, walk-away points, and best arguments.' },
  { step: '04', title: 'Practice against AI', desc: 'Simulate the opponent at different difficulty levels.' },
  { step: '05', title: 'Negotiate confidently', desc: 'Walk in prepared. Know exactly when to push or walk away.' },
]

const PROBLEMS = [
  { icon: Brain, title: "Don't know your leverage", desc: "Most people enter negotiations blind to their actual bargaining power." },
  { icon: Target, title: "Don't know what to offer", desc: "Opening too high or too low can instantly kill your deal." },
  { icon: Shield, title: "Don't know when to push", desc: "Without a strategy, pressure from the other side leads to costly mistakes." },
]

export default function Landing() {
  const { user, enterDemoMode } = useAuth()
  const navigate = useNavigate()
  const heroRef = useRef<HTMLDivElement>(null)
  const metricsRef = useRef<HTMLDivElement>(null)
  const [metricsVisible, setMetricsVisible] = useState(false)

  // Parallax hero
  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${window.scrollY * 0.08}px)`
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Metrics visibility
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setMetricsVisible(true)
    }, { threshold: 0.3 })
    if (metricsRef.current) observer.observe(metricsRef.current)
    return () => observer.disconnect()
  }, [])

  const handleDemo = () => {
    enterDemoMode()
    navigate('/dashboard')
  }

  const handleStart = () => {
    if (user) navigate('/negotiate/new')
    else navigate('/register')
  }

  const leverage = useCounter(82, 1800, metricsVisible)
  const target = useCounter(95, 2000, metricsVisible)
  const saved = useCounter(150000, 2200, metricsVisible)

  return (
    <div className="landing">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="hero">
        {/* Ambient glow */}
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <Zap size={12} />
              AI-Powered Negotiation Strategist
            </div>

            <h1 className="hero-headline">
              Know Your Leverage.<br />
              <span className="hero-accent">Negotiate Smarter.</span>
            </h1>

            <p className="hero-subtext">
              DealMind turns uncertainty into strategy — analyzing your leverage,
              simulating the other side, and coaching you toward better deals.
            </p>

            <div className="hero-ctas">
              <button className="btn btn-accent btn-lg" onClick={handleStart}>
                <Zap size={18} />
                Start Negotiating
              </button>
              <button className="btn btn-ghost btn-lg" onClick={handleDemo}>
                Try Interactive Demo
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="hero-social-proof">
              <div className="proof-avatars">
                {['A', 'B', 'C', 'D'].map((l, i) => (
                  <div key={i} className="proof-avatar" style={{ zIndex: 4 - i }}>{l}</div>
                ))}
              </div>
              <div>
                <div className="proof-stars">
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
                </div>
                <span className="proof-text">Loved by 2,400+ negotiators</span>
              </div>
            </div>
          </div>

          {/* Hero Visualization */}
          <div className="hero-visual" ref={heroRef}>
            <div className="deal-card deal-card-main">
              <div className="deal-label">ACTIVE NEGOTIATION</div>
              <div className="deal-title">Software Engineer Offer</div>

              <div className="deal-row">
                <div className="deal-col">
                  <span className="deal-col-label">Current</span>
                  <span className="deal-col-val deal-col-low">{formatCurrency(800000)}</span>
                </div>
                <div className="deal-arrow">→</div>
                <div className="deal-col">
                  <span className="deal-col-label">Target</span>
                  <span className="deal-col-val deal-col-high">{formatCurrency(1000000)}</span>
                </div>
              </div>

              <div className="deal-metrics">
                <div className="deal-metric">
                  <span className="dm-label">Opening</span>
                  <span className="dm-val">{formatCurrency(1050000)}</span>
                </div>
                <div className="deal-metric">
                  <span className="dm-label">Walk-away</span>
                  <span className="dm-val">{formatCurrency(900000)}</span>
                </div>
                <div className="deal-metric">
                  <span className="dm-label">BATNA</span>
                  <span className="dm-val">{formatCurrency(920000)}</span>
                </div>
              </div>

              <div className="deal-leverage">
                <div className="dl-header">
                  <span>Leverage Score</span>
                  <span className="dl-pct">82%</span>
                </div>
                <div className="dl-bar">
                  <div className="dl-fill" style={{ width: '82%' }} />
                </div>
              </div>
            </div>

            {/* Coach bubble */}
            <div className="coach-bubble">
              <div className="coach-icon"><Brain size={14} /></div>
              <div className="coach-text">
                <strong>AI Coach:</strong> Counter at ₹10 LPA — your competing offer makes this realistic.
              </div>
            </div>

            {/* Opponent bubble */}
            <div className="opponent-bubble">
              <span className="opp-label">Opponent:</span>
              <span>"We can offer ₹8.5 LPA."</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROBLEMS ===== */}
      <section className="section problems-section">
        <div className="container">
          <div className="section-header">
            <p className="section-overline">The Problem</p>
            <h2 className="display-md">Negotiation shouldn't be guesswork.</h2>
          </div>
          <div className="grid-3" style={{ marginTop: 48 }}>
            {PROBLEMS.map((p, i) => (
              <div className="problem-card" key={i}>
                <div className="problem-icon"><p.icon size={22} /></div>
                <h3 className="heading-md">{p.title}</h3>
                <p className="body-md text-secondary">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== USE CASES ===== */}
      <section className="section" id="use-cases">
        <div className="container">
          <div className="section-header">
            <p className="section-overline">Use Cases</p>
            <h2 className="display-md">One AI strategist.<br />Every negotiation.</h2>
          </div>
          <div className="use-cases-grid" style={{ marginTop: 48 }}>
            {USE_CASES.map((uc, i) => (
              <div className="use-case-card" key={i} onClick={handleStart}>
                <div className="uc-icon" style={{ background: `${uc.color}1A`, color: uc.color }}>
                  <uc.icon size={24} />
                </div>
                <h3 className="heading-md">{uc.label}</h3>
                <p className="body-sm text-secondary">{uc.desc}</p>
                <span className="uc-arrow"><ChevronRight size={16} /></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section how-section" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <p className="section-overline">Process</p>
            <h2 className="display-md">How DealMind Works</h2>
          </div>
          <div className="steps-grid" style={{ marginTop: 60 }}>
            {HOW_IT_WORKS.map((s, i) => (
              <div className="step-card" key={i}>
                <div className="step-number">{s.step}</div>
                <h3 className="heading-md" style={{ marginTop: 16 }}>{s.title}</h3>
                <p className="body-sm text-secondary" style={{ marginTop: 8 }}>{s.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== METRICS ===== */}
      <section className="section metrics-section" ref={metricsRef}>
        <div className="container">
          <div className="metrics-inner">
            <div className="metric-item">
              <div className="metric-num">{leverage}%</div>
              <div className="metric-label">Average Leverage Identified</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="metric-num">{target}%</div>
              <div className="metric-label">Target Achievement Rate</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="metric-num">{formatCurrency(saved)}</div>
              <div className="metric-label">Avg. Value Unlocked Per Deal</div>
            </div>
          </div>
          <p className="metrics-disclaimer">* AI-generated simulation metrics based on demo scenarios</p>
        </div>
      </section>

      {/* ===== SIMULATOR PREVIEW ===== */}
      <section className="section simulator-preview-section" id="simulator">
        <div className="container">
          <div className="section-header">
            <p className="section-overline">Live Demo</p>
            <h2 className="display-md">Watch DealMind in action.</h2>
            <p className="body-lg text-secondary" style={{ marginTop: 16 }}>
              An AI opponent, a real-time coach, and full strategy — all in one place.
            </p>
          </div>

          <div className="simulator-preview" style={{ marginTop: 48 }}>
            <div className="sim-chat">
              <div className="sim-msg sim-msg-opponent">
                <div className="sim-msg-label">Opponent · HR Manager</div>
                <div className="sim-msg-bubble">
                  "We can offer ₹8.5 LPA. That's the top of our budget for this level."
                </div>
              </div>
              <div className="sim-msg sim-msg-user">
                <div className="sim-msg-label">You</div>
                <div className="sim-msg-bubble">
                  "I appreciate the offer. However, given my competing offer and the market rate, I'm looking at ₹10 LPA."
                </div>
              </div>
              <div className="sim-msg sim-msg-opponent">
                <div className="sim-msg-label">Opponent · HR Manager</div>
                <div className="sim-msg-bubble">
                  "₹10 LPA is quite ambitious. Could you share more about your other offer?"
                </div>
              </div>
            </div>
            <div className="sim-coach-panel">
              <div className="sim-coach-header">
                <Brain size={16} style={{ color: 'var(--accent)' }} />
                <strong>AI Coach</strong>
              </div>
              <div className="sim-coach-item sim-coach-good">
                <span className="sim-coach-tag">✓ Strong</span>
                <p>You anchored at ₹10 LPA without revealing your walk-away.</p>
              </div>
              <div className="sim-coach-item sim-coach-warn">
                <span className="sim-coach-tag">⚡ Tip</span>
                <p>Don't disclose the exact competing offer — say "competitive offer from a leading firm."</p>
              </div>
              <div className="sim-suggestion">
                <p className="body-sm text-secondary">Suggested response:</p>
                <p className="body-sm" style={{ marginTop: 4 }}>
                  "I have a formal offer from another company. I'd prefer to join here, but I need the compensation to align."
                </p>
              </div>
              <button className="btn btn-accent" style={{ width: '100%', marginTop: 16 }} onClick={handleDemo}>
                Try Simulator <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="section cta-section" id="about">
        <div className="container">
          <div className="cta-inner">
            <div className="cta-glow" />
            <p className="section-overline">Get Started</p>
            <h2 className="display-md">Your next negotiation<br />starts here.</h2>
            <p className="body-lg text-secondary" style={{ marginTop: 16 }}>
              Stop leaving money on the table. Build your strategy in minutes.
            </p>
            <div className="hero-ctas" style={{ marginTop: 36, justifyContent: 'center' }}>
              <button className="btn btn-accent btn-lg" onClick={handleStart}>
                <Zap size={18} />
                Build My Strategy
              </button>
              <button className="btn btn-ghost btn-lg" onClick={handleDemo}>
                <MessageSquare size={16} />
                Try Demo First
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="navbar-logo-icon"><Zap size={16} /></span>
                <span style={{ fontWeight: 800, fontSize: 18 }}>DealMind</span>
              </div>
              <p className="footer-tagline">Know your leverage. Negotiate smarter.</p>
            </div>
            <div className="footer-links-grid">
              <div>
                <p className="footer-col-title">Product</p>
                <a href="#how-it-works" className="footer-link">How it Works</a>
                <a href="#use-cases" className="footer-link">Use Cases</a>
                <a href="#simulator" className="footer-link">Simulator</a>
              </div>
              <div>
                <p className="footer-col-title">Legal</p>
                <a href="#" className="footer-link">Privacy</a>
                <a href="#" className="footer-link">Terms</a>
              </div>
              <div>
                <p className="footer-col-title">Community</p>
                <a href="https://github.com" target="_blank" className="footer-link">GitHub</a>
                <a href="#" className="footer-link">Discord</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="body-sm text-muted">© 2024 DealMind. Built with AI at GDG Cloud Nagpur Hackathon.</p>
            <p className="body-sm text-muted">AI outputs are simulations. Not financial or legal advice.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
