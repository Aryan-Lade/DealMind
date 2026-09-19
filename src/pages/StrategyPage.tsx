import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Target, TrendingDown, Shield, Zap, ArrowRight,
  ThumbsUp, ThumbsDown, MessageSquare, BarChart2
} from 'lucide-react'
import { useNegotiations } from '../contexts/NegotiationContext'
import { formatCurrency } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import './StrategyPage.css'

function ProgressRing({ value, size = 120, label }: { value: number; size?: number; label: string }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  return (
    <div className="prog-ring">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 1.2s ease' }} />
      </svg>
      <div className="prog-ring-inner">
        <span className="prog-ring-val">{value}</span>
        <span className="prog-ring-label">{label}</span>
      </div>
    </div>
  )
}

export default function StrategyPage() {
  const { id } = useParams<{ id: string }>()
  const { getById } = useNegotiations()
  const navigate = useNavigate()
  const neg = id ? getById(id) : null
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialCheckDone(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (initialCheckDone && !neg) {
      navigate('/dashboard')
    }
  }, [initialCheckDone, neg, navigate])

  if (!neg || !neg.analysis) {
    return (
      <AppLayout>
        <div className="strategy-loading">
          <div className="analyzing-icon animate-pulse-glow"><Zap size={28} /></div>
          <p>Loading strategy...</p>
        </div>
      </AppLayout>
    )
  }

  const a = neg.analysis

  const leverageData = a.leverage_breakdown?.map((l: any) => ({
    name: l.factor,
    score: l.score,
  })) || []

  return (
    <AppLayout>
      <div className="strategy-page">
        {/* Header */}
        <div className="strategy-header">
          <div>
            <p className="text-muted body-sm" style={{ textTransform: 'capitalize' }}>{neg.type} negotiation</p>
            <h1 className="strategy-title">{neg.title}</h1>
          </div>
          <button className="btn btn-accent" onClick={() => navigate(`/simulate/${neg.id}`)}>
            <MessageSquare size={16} />
            Start Simulator
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Key Metrics */}
        <div className="strategy-metrics">
          <div className="strategy-metric-card sm-target">
            <div className="sm-icon"><Target size={18} /></div>
            <div className="sm-val">{formatCurrency(a.target_offer)}</div>
            <div className="sm-label">Target Offer</div>
          </div>
          <div className="strategy-metric-card sm-opening">
            <div className="sm-icon"><TrendingDown size={18} /></div>
            <div className="sm-val">{formatCurrency(a.opening_offer)}</div>
            <div className="sm-label">Opening Offer</div>
          </div>
          <div className="strategy-metric-card sm-walkaway">
            <div className="sm-icon"><Shield size={18} /></div>
            <div className="sm-val">{formatCurrency(a.walk_away)}</div>
            <div className="sm-label">Walk-away</div>
          </div>
          <div className="strategy-metric-card sm-batna">
            <div className="sm-icon"><Zap size={18} /></div>
            <div className="sm-val">{formatCurrency(a.batna)}</div>
            <div className="sm-label">BATNA</div>
          </div>
        </div>

        <div className="strategy-body">
          {/* Left Column */}
          <div className="strategy-left">
            {/* Leverage Score */}
            <div className="card strategy-leverage-card">
              <h2 className="heading-md" style={{ marginBottom: 24 }}>Leverage Analysis</h2>
              <div className="leverage-top">
                <ProgressRing value={a.leverage_score} label="Leverage" />
                <div className="leverage-breakdown">
                  {leverageData.map((l: any, i: number) => (
                    <div key={i} className="lev-item">
                      <div className="lev-row">
                        <span className="body-sm">{l.name}</span>
                        <span className="body-sm" style={{ fontWeight: 700, color: l.score > 75 ? 'var(--accent)' : 'var(--text-secondary)' }}>{l.score}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${l.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="body-sm text-muted" style={{ marginTop: 16, fontStyle: 'italic' }}>
                * AI estimates based on user-provided information
              </p>
            </div>

            {/* Strategy */}
            <div className="card" style={{ marginTop: 16 }}>
              <h2 className="heading-md" style={{ marginBottom: 16 }}>Recommended Strategy</h2>
              <p className="body-md text-secondary">{a.strategy}</p>
              <div className="strategy-details" style={{ marginTop: 20 }}>
                <div className="sd-item">
                  <span className="sd-label">Acceptance Probability</span>
                  <span className="sd-val" style={{ color: 'var(--accent)' }}>
                    {Math.round((a.acceptance_probability || 0.6) * 100)}%
                  </span>
                </div>
                <div className="sd-item">
                  <span className="sd-label">Recommended Counter</span>
                  <span className="sd-val">{formatCurrency(a.recommended_counter_offer)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="strategy-right">
            {/* Best Arguments */}
            <div className="card">
              <h2 className="heading-md" style={{ marginBottom: 16 }}>
                <ThumbsUp size={18} style={{ color: 'var(--success)' }} /> Use These Arguments
              </h2>
              <div className="arg-list">
                {a.best_arguments?.map((arg: any, i: number) => (
                  <div key={i} className="arg-item arg-good">
                    <div className="arg-top">
                      <span className="badge" style={{
                        background: arg.strength === 'strong' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                        color: arg.strength === 'strong' ? 'var(--success)' : 'var(--warning)',
                        fontSize: 10,
                      }}>
                        {arg.strength?.toUpperCase()}
                      </span>
                    </div>
                    <p className="body-sm" style={{ fontStyle: 'italic', marginBottom: 6 }}>"{arg.text}"</p>
                    <p className="body-sm text-muted">✓ {arg.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Arguments to Avoid */}
            <div className="card" style={{ marginTop: 16 }}>
              <h2 className="heading-md" style={{ marginBottom: 16 }}>
                <ThumbsDown size={18} style={{ color: 'var(--danger)' }} /> Avoid These Arguments
              </h2>
              <div className="arg-list">
                {a.arguments_to_avoid?.map((arg: any, i: number) => (
                  <div key={i} className="arg-item arg-bad">
                    <p className="body-sm" style={{ fontStyle: 'italic', marginBottom: 6 }}>"{arg.text}"</p>
                    <p className="body-sm text-muted">⚠️ {arg.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="card" style={{ marginTop: 16 }}>
              <h2 className="heading-md" style={{ marginBottom: 16 }}>Your Position</h2>
              <div className="pos-grid">
                <div>
                  <p className="body-sm text-muted" style={{ marginBottom: 8 }}>💪 Strengths</p>
                  {a.strengths?.map((s: string, i: number) => (
                    <div key={i} className="pos-item pos-strong">✓ {s}</div>
                  ))}
                </div>
                <div>
                  <p className="body-sm text-muted" style={{ marginBottom: 8 }}>⚠️ Watch Out</p>
                  {a.weaknesses?.map((w: string, i: number) => (
                    <div key={i} className="pos-item pos-weak">⚠ {w}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="strategy-cta">
          <div className="strategy-cta-text">
            <h3>Ready to practice?</h3>
            <p className="text-secondary">Simulate the negotiation against an AI opponent with real-time coaching.</p>
          </div>
          <button className="btn btn-accent btn-lg" onClick={() => navigate(`/simulate/${neg.id}`)}>
            <MessageSquare size={18} />
            Start AI Simulation
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
