import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useNegotiations } from '../contexts/NegotiationContext'
import { formatCurrency } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell, Area, AreaChart
} from 'recharts'
import { TrendingUp, Target, BarChart2, Award, Zap, ArrowRight } from 'lucide-react'
import './Insights.css'

const COLORS = ['#FF5722', '#38BDF8', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
}
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="chart-tooltip">
        <p className="ct-label">{label}</p>
        <p className="ct-val">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

export default function Insights() {
  const { negotiations } = useNegotiations()
  const navigate = useNavigate()

  const completed = negotiations.filter(n => n.status === 'completed')
  const totalNeg = negotiations.length
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, n) => s + (n.score || 0), 0) / completed.length)
    : 0
  const avgAchievement = completed.length
    ? Math.round(completed.reduce((s, n) => {
        const target = n.desiredOffer
        const final = n.finalOffer || n.currentOffer
        const pct = target > n.currentOffer
          ? Math.min(100, ((final - n.currentOffer) / (target - n.currentOffer)) * 100)
          : 0
        return s + pct
      }, 0) / completed.length)
    : 0

  const scoreData = completed.slice(-8).map((n, i) => ({
    name: `#${i + 1}`,
    score: n.score || 0,
    label: n.title.slice(0, 14),
  }))

  const typeData = ['salary', 'rent', 'freelance', 'purchase', 'subscription', 'business']
    .map((type, i) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count: negotiations.filter(n => n.type === type).length,
      color: COLORS[i],
    }))
    .filter(d => d.count > 0)

  const STAT_CARDS = [
    {
      val: totalNeg,
      label: 'Total Negotiations',
      icon: BarChart2,
      color: '#FF5722',
      bg: 'rgba(255,87,34,0.08)',
      suffix: '',
    },
    {
      val: completed.length,
      label: 'Completed',
      icon: Award,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.08)',
      suffix: '',
    },
    {
      val: avgScore || '—',
      label: 'Avg. Score',
      icon: Target,
      color: '#38BDF8',
      bg: 'rgba(56,189,248,0.08)',
      suffix: avgScore ? '/100' : '',
    },
    {
      val: avgAchievement,
      label: 'Target Achievement',
      icon: TrendingUp,
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.08)',
      suffix: '%',
    },
  ]

  return (
    <AppLayout>
      <div className="insights-page">

        {/* ── Hero ── */}
        <motion.div
          className="insights-hero"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="insights-hero-blob blob-a" />
          <div className="insights-hero-blob blob-b" />
          <div className="ih-left">
            <div className="ih-eyebrow">
              <TrendingUp size={13} />
              <span>Performance Analytics</span>
            </div>
            <h1 className="ih-title">Negotiation Insights</h1>
            <p className="ih-sub">Track your performance, win rate, and improvement areas over time.</p>
          </div>
          {completed.length === 0 && (
            <button className="btn btn-dark btn-lg" onClick={() => navigate('/negotiate/new')}>
              <Zap size={16} /> Start a Negotiation
            </button>
          )}
        </motion.div>

        {/* ── Stats Grid ── */}
        <motion.div
          className="insights-stats"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {STAT_CARDS.map(s => (
            <motion.div
              key={s.label}
              className="insight-stat-card"
              variants={itemVariants}
              whileHover={{ y: -4, boxShadow: '0 14px 36px rgba(0,0,0,0.07)' }}
            >
              <div className="isc-icon" style={{ background: s.bg, color: s.color }}>
                <s.icon size={20} />
              </div>
              <div className="isc-body">
                <div className="isc-val" style={{ color: s.color }}>
                  {s.val}{s.suffix}
                </div>
                <div className="isc-label">{s.label}</div>
              </div>
              {/* Mini bar */}
              <div className="isc-bar" style={{ background: s.bg }}>
                <div className="isc-bar-fill" style={{ background: s.color, width: `${Math.min(100, Number(s.val) || 0)}%` }} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {completed.length === 0 ? (
          <motion.div
            className="insights-empty"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="ins-empty-icon">📊</div>
            <h3 className="ins-empty-title">No completed negotiations yet</h3>
            <p className="ins-empty-desc">Complete a negotiation simulation to unlock your analytics dashboard.</p>
            <button className="btn btn-accent btn-lg" onClick={() => navigate('/simulate')}>
              <Zap size={16} /> Try Simulator
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="insights-charts"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Score Trend */}
            <motion.div className="chart-card chart-wide" variants={itemVariants}>
              <div className="cc-header">
                <div>
                  <h2 className="cc-title">Score Trend</h2>
                  <p className="cc-sub">Your negotiation score over the last {scoreData.length} sessions</p>
                </div>
                <div className="cc-badge" style={{ background: 'rgba(56,189,248,0.1)', color: '#38BDF8' }}>
                  Live Data
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={scoreData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5722" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#FF5722" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(10,10,14,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#9EA0AC', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#9EA0AC', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#FF5722"
                    strokeWidth={2.5}
                    fill="url(#scoreGrad)"
                    dot={{ fill: '#FF5722', r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 7, fill: '#FF5722' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* By Type */}
            <motion.div className="chart-card" variants={itemVariants}>
              <div className="cc-header">
                <div>
                  <h2 className="cc-title">By Negotiation Type</h2>
                  <p className="cc-sub">How your deals are distributed</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={typeData} barCategoryGap="35%">
                  <CartesianGrid stroke="rgba(10,10,14,0.06)" vertical={false} />
                  <XAxis dataKey="type" tick={{ fill: '#9EA0AC', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9EA0AC', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {typeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Win Rate Donut-style */}
            <motion.div className="chart-card chart-metric-card" variants={itemVariants}>
              <div className="cc-header">
                <div>
                  <h2 className="cc-title">Win Rate</h2>
                  <p className="cc-sub">Deals where score ≥ 70</p>
                </div>
              </div>
              <div className="win-rate-display">
                <div className="wr-ring">
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(10,10,14,0.08)" strokeWidth="12" />
                    <circle
                      cx="70" cy="70" r="58"
                      fill="none"
                      stroke="#FF5722"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 58}`}
                      strokeDashoffset={`${2 * Math.PI * 58 * (1 - (completed.filter(n => (n.score || 0) >= 70).length / Math.max(completed.length, 1)))}`}
                      transform="rotate(-90 70 70)"
                    />
                  </svg>
                  <div className="wr-inner">
                    <span className="wr-pct">
                      {completed.length ? Math.round((completed.filter(n => (n.score || 0) >= 70).length / completed.length) * 100) : 0}%
                    </span>
                    <span className="wr-lbl">Win Rate</span>
                  </div>
                </div>
                <div className="wr-meta">
                  <div className="wr-row">
                    <span className="wr-dot" style={{ background: '#10B981' }} />
                    <span className="wr-text">Won (≥70): <strong>{completed.filter(n => (n.score || 0) >= 70).length}</strong></span>
                  </div>
                  <div className="wr-row">
                    <span className="wr-dot" style={{ background: '#F59E0B' }} />
                    <span className="wr-text">Avg Score: <strong>{avgScore}/100</strong></span>
                  </div>
                  <div className="wr-row">
                    <span className="wr-dot" style={{ background: '#38BDF8' }} />
                    <span className="wr-text">Total: <strong>{completed.length}</strong></span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Results Table */}
            <motion.div className="chart-card chart-wide" variants={itemVariants}>
              <div className="cc-header">
                <div>
                  <h2 className="cc-title">Recent Results</h2>
                  <p className="cc-sub">Breakdown of your completed negotiations</p>
                </div>
              </div>
              <div className="insights-table">
                <div className="it-header">
                  <span>Negotiation</span>
                  <span>Type</span>
                  <span>Target</span>
                  <span>Final</span>
                  <span>Score</span>
                  <span></span>
                </div>
                {completed.slice(0, 6).map(n => (
                  <div key={n.id} className="it-row" onClick={() => navigate(`/negotiate/${n.id}`)}>
                    <span className="it-title">{n.title}</span>
                    <span className="it-type">{n.type}</span>
                    <span className="it-num">{formatCurrency(n.desiredOffer)}</span>
                    <span className="it-num" style={{ color: '#10B981' }}>{n.finalOffer ? formatCurrency(n.finalOffer) : '—'}</span>
                    <span>
                      <span
                        className="score-pill"
                        style={{
                          background: (n.score || 0) >= 80 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                          color: (n.score || 0) >= 80 ? '#10B981' : '#F59E0B',
                        }}
                      >
                        {n.score || '—'}/100
                      </span>
                    </span>
                    <span className="it-arrow"><ArrowRight size={14} /></span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
