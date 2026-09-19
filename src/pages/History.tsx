import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Trash2, Eye, Play, Clock, Plus, FileText, ArrowRight, TrendingUp, Zap } from 'lucide-react'
import { useNegotiations } from '../contexts/NegotiationContext'
import { formatCurrency } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'
import './History.css'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:      { label: 'Draft',      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  analyzed:   { label: 'Ready',      color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
  simulating: { label: 'Simulating', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  completed:  { label: 'Completed',  color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
}

const TYPE_EMOJIS: Record<string, string> = {
  salary: '💼', rent: '🏠', freelance: '💻', purchase: '🛍️',
  subscription: '🔄', business: '🤝', other: '📋',
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.22 } },
}

export default function History() {
  const { negotiations, deleteNegotiation } = useNegotiations()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const FILTERS = [
    { key: 'all',       label: 'All',       count: negotiations.length },
    { key: 'analyzed',  label: 'Ready',     count: negotiations.filter(n => n.status === 'analyzed').length },
    { key: 'completed', label: 'Completed', count: negotiations.filter(n => n.status === 'completed').length },
  ]

  const filtered = negotiations.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.type.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || n.status === filter
    return matchSearch && matchFilter
  })

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this negotiation?')) deleteNegotiation(id)
  }

  const completed = negotiations.filter(n => n.status === 'completed').length
  const ready = negotiations.filter(n => n.status === 'analyzed').length

  return (
    <AppLayout>
      <div className="history-page">

        {/* ── Hero Header ── */}
        <motion.div
          className="history-hero"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="history-hero-blob" />
          <div className="hh-left">
            <div className="hh-eyebrow">
              <FileText size={13} />
              <span>Negotiation Archive</span>
            </div>
            <h1 className="hh-title">My Negotiations</h1>
            <div className="hh-stats">
              <div className="hh-stat">
                <span className="hh-stat-val">{negotiations.length}</span>
                <span className="hh-stat-lbl">Total</span>
              </div>
              <div className="hh-stat-div" />
              <div className="hh-stat">
                <span className="hh-stat-val" style={{ color: '#38BDF8' }}>{ready}</span>
                <span className="hh-stat-lbl">Ready to Simulate</span>
              </div>
              <div className="hh-stat-div" />
              <div className="hh-stat">
                <span className="hh-stat-val" style={{ color: '#10B981' }}>{completed}</span>
                <span className="hh-stat-lbl">Completed</span>
              </div>
            </div>
          </div>
          <button className="btn btn-dark btn-lg" onClick={() => navigate('/negotiate/new')}>
            <Plus size={16} /> New Negotiation
          </button>
        </motion.div>

        {/* ── Controls Bar ── */}
        <motion.div
          className="history-controls"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.36 }}
        >
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search by title or type…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-tabs">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`filter-tab ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <span className="filter-count">{f.count}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── List ── */}
        {filtered.length === 0 ? (
          <motion.div
            className="history-empty"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18 }}
          >
            <div className="he-icon-wrap">
              <div className="he-icon-bg" />
              {search ? <Search size={28} className="he-icon" /> : <Zap size={28} className="he-icon" />}
            </div>
            <h3 className="he-title">{search ? 'No results found' : 'No negotiations yet'}</h3>
            <p className="he-desc">
              {search ? 'Try a different search term or clear your filters.' : 'Start your first AI-powered negotiation and it will appear here.'}
            </p>
            {!search && (
              <button className="btn btn-accent btn-lg" onClick={() => navigate('/negotiate/new')}>
                <Plus size={16} /> Start Negotiating
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="history-list"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence>
              {filtered.map(n => {
                const sc = STATUS_CONFIG[n.status] || STATUS_CONFIG.draft
                const emoji = TYPE_EMOJIS[n.type] || '📋'
                return (
                  <motion.div
                    key={n.id}
                    className="history-item"
                    variants={itemVariants}
                    exit="exit"
                    whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(0,0,0,0.07)' }}
                    onClick={() => navigate(`/negotiate/${n.id}`)}
                  >
                    {/* Type badge */}
                    <div className="hi-type-badge" style={{ background: sc.bg }}>
                      <span className="hi-emoji">{emoji}</span>
                      <span style={{ color: sc.color, fontWeight: 700, fontSize: 11, textTransform: 'capitalize' }}>{n.type}</span>
                    </div>

                    {/* Main info */}
                    <div className="hi-main">
                      <h3 className="hi-title">{n.title}</h3>
                      <div className="hi-meta">
                        <Clock size={11} />
                        {n.createdAt.toLocaleDateString()}
                        <span className="hi-status-pill" style={{ background: sc.bg, color: sc.color }}>
                          {sc.label}
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="hi-metrics">
                      <div className="hm">
                        <span className="hm-label">Target</span>
                        <span className="hm-val">{formatCurrency(n.desiredOffer)}</span>
                      </div>
                      {n.analysis && (
                        <div className="hm">
                          <span className="hm-label">Leverage</span>
                          <span className="hm-val" style={{ color: 'var(--accent)' }}>{n.analysis.leverage_score}%</span>
                        </div>
                      )}
                      {n.score != null && (
                        <div className="hm">
                          <span className="hm-label">Score</span>
                          <span className="hm-val" style={{ color: n.score >= 70 ? '#10B981' : '#F59E0B' }}>{n.score}/100</span>
                        </div>
                      )}
                      {n.finalOffer != null && (
                        <div className="hm">
                          <span className="hm-label">Final</span>
                          <span className="hm-val" style={{ color: '#10B981' }}>{formatCurrency(n.finalOffer)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="hi-actions" onClick={e => e.stopPropagation()}>
                      <button className="hi-action-btn" onClick={() => navigate(`/negotiate/${n.id}`)}>
                        <Eye size={14} /> View
                      </button>
                      {n.status === 'analyzed' && (
                        <button className="hi-action-btn hi-sim-btn" onClick={() => navigate(`/simulate/${n.id}`)}>
                          <Play size={13} /> Simulate
                        </button>
                      )}
                      <button
                        className="hi-action-btn hi-del-btn"
                        onClick={e => handleDelete(n.id, e)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <ArrowRight size={14} className="hi-arrow" />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
