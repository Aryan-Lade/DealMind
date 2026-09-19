import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageSquare, Zap, Play, ArrowRight, Briefcase, Home, Laptop, Building, Plus, Brain, Shield } from 'lucide-react'
import AppLayout from '../../src/layouts/AppLayout'
import { useNegotiations } from '../../src/contexts/NegotiationContext'
import { DEMO_SCENARIOS, MOCK_ANALYSIS, formatCurrency } from '../../src/data/mockData'
import './SimulatorHub.css'

const QUICK_SCENARIOS = [
  {
    key: 'salary',
    title: 'Senior Software Engineer Salary',
    role: 'HR Talent Partner',
    icon: Briefcase,
    color: '#CCFF00',
    type: 'salary',
    currentOffer: 800000,
    desiredOffer: 1000000,
    walkAway: 900000,
    context: 'You received an initial offer of ₹8 LPA. You bring 3 years of production React/Node experience and have a competing offer at ₹9.2 LPA.',
    difficulty: 'Intermediate',
  },
  {
    key: 'rent',
    title: 'Apartment Lease Renewal',
    role: 'Property Landlord',
    icon: Home,
    color: '#38BDF8',
    type: 'rent',
    currentOffer: 35000,
    desiredOffer: 28000,
    walkAway: 32000,
    context: 'Your landlord proposed a 20% rent hike to ₹35,000. You have been an impeccable tenant for 3 years and found comparable units at ₹29,000.',
    difficulty: 'Beginner',
  },
  {
    key: 'freelance',
    title: 'High-Ticket Client Retainer',
    role: 'Startup Founder',
    icon: Laptop,
    color: '#A855F7',
    type: 'freelance',
    currentOffer: 50000,
    desiredOffer: 80000,
    walkAway: 65000,
    context: 'A fast-growing fintech startup wants your full design and dev services. Their opening budget is ₹50,000/mo, but the scope justifies ₹80,000.',
    difficulty: 'Advanced',
  },
  {
    key: 'business',
    title: 'Enterprise Vendor Contract',
    role: 'VP of Procurement',
    icon: Building,
    color: '#F97316',
    type: 'business',
    currentOffer: 120000,
    desiredOffer: 90000,
    walkAway: 105000,
    context: 'Negotiating a multi-seat B2B SaaS annual subscription. Seeking a 25% discount in exchange for a 2-year upfront commitment.',
    difficulty: 'Advanced',
  },
]

export default function SimulatorHub() {
  const { negotiations, addNegotiation } = useNegotiations()
  const navigate = useNavigate()

  const activeNegotiations = negotiations.filter(n => n.analysis || n.status !== 'draft')

  const startQuickScenario = (scenario: typeof QUICK_SCENARIOS[0]) => {
    // Check if matching negotiation already exists
    const existing = negotiations.find(n => n.title === scenario.title)
    if (existing) {
      navigate(`/simulate/${existing.id}`)
      return
    }

    const baseData = DEMO_SCENARIOS[scenario.key] || {
      title: scenario.title,
      type: scenario.type,
      currentOffer: scenario.currentOffer,
      desiredOffer: scenario.desiredOffer,
      walkAway: scenario.walkAway,
      minAcceptable: scenario.walkAway,
      maxDesired: scenario.desiredOffer * 1.2,
      batna: String(scenario.walkAway),
      context: scenario.context,
      strengths: 'Proven track record, clear market alternatives, strong leverage',
      deadline: '1 week',
      otherParty: scenario.role,
      relationship: 'professional',
    }

    const newNeg = addNegotiation({
      ...baseData,
      status: 'analyzed',
      analysis: {
        ...MOCK_ANALYSIS,
        negotiation_type: scenario.type,
        target_offer: scenario.desiredOffer,
        walk_away: scenario.walkAway,
        opening_offer: Math.round(scenario.desiredOffer * 1.08),
        recommended_counter_offer: scenario.desiredOffer,
      },
    })

    navigate(`/simulate/${newNeg.id}`)
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }),
  }

  const DIFFICULTY_STYLE: Record<string, { color: string; bg: string }> = {
    Beginner:     { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    Intermediate: { color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
    Advanced:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  }

  return (
    <AppLayout>
      <div className="simhub-page">

        {/* ── Hero Banner ── */}
        <motion.div
          className="simhub-hero"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="simhub-blob blob-1" />
          <div className="simhub-blob blob-2" />
          <div className="simhub-hero-left">
            <div className="simhub-eyebrow">
              <Brain size={13} /> AI Negotiation Simulator
            </div>
            <h1 className="simhub-title">Practice. Win.<br /><span className="simhub-title-accent">Repeat.</span></h1>
            <p className="simhub-subtitle">
              Roleplay against an intelligent AI counterparty calibrated to your scenario.
              Get instant coaching, concession tracking, and real-time feedback.
            </p>
            <div className="simhub-hero-pills">
              {['4 AI Personas', 'Real-Time Coach', 'Concession Tracker', 'Score & Grade'].map(p => (
                <span key={p} className="simhub-hero-pill">{p}</span>
              ))}
            </div>
          </div>
          <div className="simhub-hero-right">
            <div className="simhub-hero-card">
              <Shield size={20} style={{ color: 'var(--accent)', marginBottom: 12 }} />
              <div className="shc-val">92%</div>
              <div className="shc-lbl">Avg. Win Rate</div>
            </div>
            <div className="simhub-hero-card">
              <Brain size={20} style={{ color: '#38BDF8', marginBottom: 12 }} />
              <div className="shc-val" style={{ color: '#38BDF8' }}>∞</div>
              <div className="shc-lbl">Practice Rounds</div>
            </div>
          </div>
        </motion.div>

        {/* ── Active Negotiations ── */}
        {activeNegotiations.length > 0 && (
          <div className="simhub-section">
            <motion.div
              className="simhub-section-header"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div>
                <h2 className="simhub-section-title">Your Active Negotiations</h2>
                <p className="simhub-section-sub">Ready-to-simulate scenarios from your prepared strategies</p>
              </div>
              <span className="simhub-count-badge">{activeNegotiations.length} ready</span>
            </motion.div>
            <div className="simhub-active-grid">
              {activeNegotiations.map((neg, i) => (
                <motion.div
                  key={neg.id}
                  className="simhub-active-card"
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.07)' }}
                >
                  <div className="simhub-active-top">
                    <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>{neg.type}</span>
                    <span className="text-xs text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
                      {new Date(neg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="simhub-active-name">{neg.title}</h3>
                  <div className="simhub-active-numbers">
                    <div className="san">
                      <span className="san-lbl">Their Offer</span>
                      <p className="san-val">{formatCurrency(neg.currentOffer)}</p>
                    </div>
                    <div className="san">
                      <span className="san-lbl">Your Target</span>
                      <p className="san-val" style={{ color: 'var(--accent)' }}>{formatCurrency(neg.desiredOffer)}</p>
                    </div>
                  </div>
                  <button
                    className="btn btn-dark"
                    style={{ width: '100%', marginTop: 18 }}
                    onClick={() => navigate(`/simulate/${neg.id}`)}
                  >
                    <Play size={14} /> Launch Simulation
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick Practice ── */}
        <div className="simhub-section">
          <motion.div
            className="simhub-section-header"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div>
              <h2 className="simhub-section-title">Instant Practice Scenarios</h2>
              <p className="simhub-section-sub">Jump into a realistic negotiation in 1 click — no setup needed</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/negotiate/new')}>
              <Plus size={14} /> Create Custom
            </button>
          </motion.div>

          <div className="simhub-presets-grid">
            {QUICK_SCENARIOS.map((sc, i) => {
              const Icon = sc.icon
              const diff = DIFFICULTY_STYLE[sc.difficulty] || DIFFICULTY_STYLE.Beginner
              return (
                <motion.div
                  key={sc.key}
                  className="simhub-preset-card"
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  whileHover={{ y: -5, boxShadow: `0 20px 50px ${sc.color}14` }}
                >
                  <div className="simhub-preset-header">
                    <div className="simhub-preset-icon" style={{ background: `${sc.color}15`, color: sc.color }}>
                      <Icon size={22} />
                    </div>
                    <span className="diff-badge" style={{ background: diff.bg, color: diff.color }}>
                      {sc.difficulty}
                    </span>
                  </div>

                  <h3 className="simhub-preset-title">{sc.title}</h3>
                  <p className="simhub-opponent-label">vs. <strong>{sc.role}</strong></p>
                  <p className="simhub-preset-desc">{sc.context}</p>

                  <div className="simhub-preset-metrics">
                    <div className="spm">
                      <span className="spm-lbl">Opening</span>
                      <span className="spm-val">{formatCurrency(sc.currentOffer)}</span>
                    </div>
                    <div className="spm-div" />
                    <div className="spm">
                      <span className="spm-lbl">Target</span>
                      <span className="spm-val" style={{ color: 'var(--accent)' }}>{formatCurrency(sc.desiredOffer)}</span>
                    </div>
                    <div className="spm-div" />
                    <div className="spm">
                      <span className="spm-lbl">Walk-away</span>
                      <span className="spm-val" style={{ color: 'var(--danger)' }}>{formatCurrency(sc.walkAway)}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-dark"
                    style={{ width: '100%', marginTop: 20 }}
                    onClick={() => startQuickScenario(sc)}
                  >
                    Start Roleplay <ArrowRight size={15} />
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
