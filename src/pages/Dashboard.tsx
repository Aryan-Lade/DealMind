import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, TrendingUp, Target, Zap, ArrowRight, Clock, BarChart2, Sparkles, Brain, Shield, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNegotiations } from '../contexts/NegotiationContext'
import { formatCurrency } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'
import './Dashboard.css'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const QUICK_SCENARIOS = [
  {
    emoji: '💼', type: 'salary', label: 'Salary & Equity',
    desc: 'Negotiate your package with AI-powered anchor framing and BATNA leverage.',
    color: '#FF5722', bg: 'rgba(255,87,34,0.08)',
  },
  {
    emoji: '🏠', type: 'rent', label: 'Rent & Lease',
    desc: 'Lock in better terms using vacancy data and payment history as leverage.',
    color: '#10B981', bg: 'rgba(16,185,129,0.08)',
  },
  {
    emoji: '💻', type: 'freelance', label: 'Freelance / Retainer',
    desc: 'Defend your scope and price your work with structured value packages.',
    color: '#38BDF8', bg: 'rgba(56,189,248,0.08)',
  },
  {
    emoji: '🛍️', type: 'purchase', label: 'Purchase Deal',
    desc: 'Flip the power dynamic and extract maximum concessions from sellers.',
    color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',
  },
  {
    emoji: '🤝', type: 'business', label: 'Business Contract',
    desc: 'Lock in multi-year terms and SLA guarantees that protect your growth.',
    color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',
  },
  {
    emoji: '🔄', type: 'subscription', label: 'Subscription / SaaS',
    desc: 'Win volume discounts and uptime guarantees from software vendors.',
    color: '#EC4899', bg: 'rgba(236,72,153,0.08)',
  },
]

const FEATURE_PILLS = [
  { icon: '⚖️', label: 'BATNA Calculator' },
  { icon: '🧠', label: 'AI Coach' },
  { icon: '📊', label: 'Leverage Score' },
  { icon: '⚓', label: 'Anchor Framing' },
  { icon: '👤', label: 'Persona Profiler' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
}

export default function Dashboard() {
  const { user, isDemo } = useAuth()
  const { negotiations } = useNegotiations()
  const navigate = useNavigate()

  const active = negotiations.filter(n => n.status !== 'completed').slice(0, 3)
  const completed = negotiations.filter(n => n.status === 'completed')
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, n) => s + (n.score || 0), 0) / completed.length)
    : 0

  const stats = [
    { label: 'Total Negotiations', val: negotiations.length, icon: BarChart2, color: '#FF5722', bg: 'rgba(255,87,34,0.1)' },
    { label: 'Avg. Score', val: avgScore ? `${avgScore}/100` : '—', icon: Target, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Completed', val: completed.length, icon: TrendingUp, color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
    { label: 'In Progress', val: active.length, icon: Zap, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  ]

  return (
    <AppLayout>
      <div className="dashboard">

        {/* ── Hero Banner ── */}
        <motion.div
          className="dash-hero"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {/* Decorative blobs */}
          <div className="dash-hero-blob blob-1" />
          <div className="dash-hero-blob blob-2" />

          <div className="dash-hero-left">
            <div className="dash-hero-eyebrow">
              <span className="status-dot" />
              <span className="font-mono text-xs">{getGreeting()}, {user?.displayName?.split(' ')[0] || 'Negotiator'}</span>
            </div>
            <h1 className="dash-hero-title">
              Win Every<br />
              <span className="dash-hero-title-accent">Negotiation.</span>
            </h1>
            <p className="dash-hero-sub">AI-powered strategy, real-time coaching, and full scenario simulation in one workspace.</p>
            <div className="dash-hero-actions">
              <button className="btn btn-dark btn-lg" onClick={() => navigate('/negotiate/new')}>
                <Plus size={18} /> New Negotiation
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/simulate')}>
                <Brain size={18} /> Practice Now
              </button>
            </div>
          </div>

          {/* Feature pills floating */}
          <div className="dash-hero-pills">
            {FEATURE_PILLS.map((p, i) => (
              <motion.div
                key={p.label}
                className="dash-feature-pill"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                whileHover={{ y: -3, boxShadow: '0 12px 28px rgba(0,0,0,0.1)' }}
              >
                <span className="pill-emoji">{p.icon}</span>
                <span className="pill-label">{p.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          className="dash-stats"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {stats.map(s => (
            <motion.div
              key={s.label}
              className="stat-card"
              variants={itemVariants}
              whileHover={{ y: -4, boxShadow: '0 14px 36px rgba(0,0,0,0.07)' }}
            >
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <s.icon size={20} />
              </div>
              <div className="stat-info">
                <p className="stat-val">{s.val}</p>
                <p className="stat-label">{s.label}</p>
              </div>
              <div className="stat-sparkline">
                <svg width="60" height="28" viewBox="0 0 60 28" fill="none">
                  <polyline
                    points="0,22 12,16 24,18 36,10 48,8 60,4"
                    stroke={s.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.5"
                    fill="none"
                  />
                  <circle cx="60" cy="4" r="2.5" fill={s.color} />
                </svg>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="dash-body">
          {/* ── Active Negotiations ── */}
          <div className="dash-section">
            <motion.div
              className="dash-section-header"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <h2 className="dash-section-title">Active Negotiations</h2>
                <p className="dash-section-sub">Your live deals in progress</p>
              </div>
              <Link to="/history" className="dash-section-link">
                View all <ChevronRight size={14} />
              </Link>
            </motion.div>

            {active.length === 0 ? (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35, duration: 0.4 }}
              >
                <div className="empty-icon-wrap">
                  <div className="empty-icon-bg" />
                  <Zap size={28} className="empty-icon" />
                </div>
                <h3 className="empty-title">No negotiations yet</h3>
                <p className="empty-desc">Start your first negotiation and let AI build your strategy in seconds.</p>
                <button className="btn btn-accent btn-lg" onClick={() => navigate('/negotiate/new')}>
                  <Sparkles size={16} /> Start Negotiating
                </button>
              </motion.div>
            ) : (
              <motion.div
                className="neg-cards"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {active.map(n => (
                  <NegotiationCard key={n.id} neg={n} />
                ))}
              </motion.div>
            )}
          </div>

          {/* ── Quick Start ── */}
          <div className="dash-section">
            <motion.div
              className="dash-section-header"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div>
                <h2 className="dash-section-title">Quick Start Scenarios</h2>
                <p className="dash-section-sub">Pick a real-world deal type and jump straight in</p>
              </div>
            </motion.div>

            <motion.div
              className="quick-cards"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {QUICK_SCENARIOS.map((s, i) => (
                <motion.button
                  key={s.type}
                  className="quick-card"
                  variants={itemVariants}
                  whileHover={{ y: -4, boxShadow: `0 16px 40px ${s.color}18` }}
                  onClick={() => navigate(`/negotiate/new?type=${s.type}`)}
                >
                  <div className="qc-icon-wrap" style={{ background: s.bg }}>
                    <span className="qc-emoji">{s.emoji}</span>
                  </div>
                  <div className="qc-body">
                    <div className="qc-label">{s.label}</div>
                    <div className="qc-desc">{s.desc}</div>
                  </div>
                  <div className="qc-arrow" style={{ color: s.color }}>
                    <ArrowRight size={16} />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>

          {/* ── AI Capability Showcase ── */}
          <motion.div
            className="dash-capability-strip"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.45 }}
          >
            <div className="dcs-left">
              <div className="dcs-badge">
                <Shield size={13} />
                Powered by Gemini 2.0 Flash
              </div>
              <h3 className="dcs-title">Your AI Negotiation Coach</h3>
              <p className="dcs-desc">Real-time strategy, anchor scoring, counterparty simulation — all in one place.</p>
              <button className="btn btn-dark btn-sm" onClick={() => navigate('/simulate')}>
                Try Simulator <ArrowRight size={14} />
              </button>
            </div>
            <div className="dcs-right">
              <div className="dcs-metric-card">
                <span className="dcs-m-val">92%</span>
                <span className="dcs-m-lbl">Avg. Win Rate</span>
              </div>
              <div className="dcs-metric-card dcs-m-accent">
                <span className="dcs-m-val">4 styles</span>
                <span className="dcs-m-lbl">AI Personas</span>
              </div>
              <div className="dcs-metric-card">
                <span className="dcs-m-val">∞ rounds</span>
                <span className="dcs-m-lbl">Practice Loops</span>
              </div>
            </div>
          </motion.div>
        </div>


      </div>
    </AppLayout>
  )
}

function NegotiationCard({ neg }: { neg: any }) {
  const navigate = useNavigate()
  const statusColors: Record<string, { color: string; bg: string }> = {
    draft: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    analyzed: { color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
    simulating: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
    completed: { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  }
  const sc = statusColors[neg.status] || statusColors.draft

  return (
    <motion.div
      className="neg-card"
      variants={itemVariants}
      whileHover={{ y: -4, boxShadow: '0 16px 44px rgba(0,0,0,0.07)' }}
      onClick={() => navigate(`/negotiate/${neg.id}`)}
    >
      <div className="neg-card-top">
        <div>
          <div className="neg-card-title">{neg.title}</div>
          <div className="neg-card-type badge" style={{ background: sc.bg, color: sc.color, fontSize: 10 }}>{neg.type}</div>
        </div>
        <span className="neg-status-badge" style={{ background: sc.bg, color: sc.color }}>
          {neg.status}
        </span>
      </div>

      <div className="neg-card-metrics">
        <div className="ncm">
          <span className="ncm-label">Target</span>
          <span className="ncm-val">{formatCurrency(neg.desiredOffer)}</span>
        </div>
        {neg.analysis && (
          <>
            <div className="ncm">
              <span className="ncm-label">Walk-away</span>
              <span className="ncm-val">{formatCurrency(neg.walkAway)}</span>
            </div>
            <div className="ncm">
              <span className="ncm-label">Leverage</span>
              <span className="ncm-val" style={{ color: 'var(--accent)' }}>{neg.analysis.leverage_score}%</span>
            </div>
          </>
        )}
      </div>

      <div className="neg-card-footer">
        <span className="neg-date">
          <Clock size={12} />
          {neg.createdAt.toLocaleDateString()}
        </span>
        <span className="neg-continue">
          {neg.status === 'analyzed' ? 'Start Simulator' : 'Continue'}
          <ArrowRight size={14} />
        </span>
      </div>
    </motion.div>
  )
}
