import { Link, useNavigate } from 'react-router-dom'
import { Plus, TrendingUp, Target, Zap, ArrowRight, Clock, BarChart2 } from 'lucide-react'
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

export default function Dashboard() {
  const { user, isDemo } = useAuth()
  const { negotiations } = useNegotiations()
  const navigate = useNavigate()

  const active = negotiations.filter(n => n.status !== 'completed').slice(0, 3)
  const completed = negotiations.filter(n => n.status === 'completed')
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, n) => s + (n.score || 0), 0) / completed.length)
    : 0

  return (
    <AppLayout>
      <div className="dashboard">
        {/* Header */}
        <div className="dash-header">
          <div>
            <p className="dash-greeting">{getGreeting()}, {user?.displayName?.split(' ')[0] || 'Negotiator'} 👋</p>
            <h1 className="dash-title">Ready for your next negotiation?</h1>
          </div>
          <button className="btn btn-accent" onClick={() => navigate('/negotiate/new')}>
            <Plus size={16} />
            New Negotiation
          </button>
        </div>

        {/* Stats row */}
        <div className="dash-stats">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(204,255,0,0.1)', color: 'var(--accent)' }}>
              <BarChart2 size={20} />
            </div>
            <div className="stat-info">
              <p className="stat-val">{negotiations.length}</p>
              <p className="stat-label">Total Negotiations</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
              <Target size={20} />
            </div>
            <div className="stat-info">
              <p className="stat-val">{avgScore || '—'}{avgScore ? '/100' : ''}</p>
              <p className="stat-label">Avg. Score</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
              <TrendingUp size={20} />
            </div>
            <div className="stat-info">
              <p className="stat-val">{completed.length}</p>
              <p className="stat-label">Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
              <Zap size={20} />
            </div>
            <div className="stat-info">
              <p className="stat-val">{active.length}</p>
              <p className="stat-label">In Progress</p>
            </div>
          </div>
        </div>

        <div className="dash-body">
          {/* Active Negotiations */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h2 className="heading-md">Active Negotiations</h2>
              <Link to="/history" className="btn btn-ghost btn-sm">View all</Link>
            </div>

            {active.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Zap size={28} /></div>
                <h3>No negotiations yet</h3>
                <p className="text-secondary">Start your first negotiation and let AI build your strategy.</p>
                <button className="btn btn-accent" onClick={() => navigate('/negotiate/new')}>
                  <Plus size={16} /> Start Negotiating
                </button>
              </div>
            ) : (
              <div className="neg-cards">
                {active.map(n => (
                  <NegotiationCard key={n.id} neg={n} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Start */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h2 className="heading-md">Quick Start</h2>
            </div>
            <div className="quick-cards">
              <button className="quick-card" onClick={() => navigate('/negotiate/new?type=salary')}>
                <span className="quick-emoji">💼</span>
                <span>Salary</span>
              </button>
              <button className="quick-card" onClick={() => navigate('/negotiate/new?type=rent')}>
                <span className="quick-emoji">🏠</span>
                <span>Rent</span>
              </button>
              <button className="quick-card" onClick={() => navigate('/negotiate/new?type=freelance')}>
                <span className="quick-emoji">💻</span>
                <span>Freelance</span>
              </button>
              <button className="quick-card" onClick={() => navigate('/negotiate/new?type=purchase')}>
                <span className="quick-emoji">🛍️</span>
                <span>Purchase</span>
              </button>
              <button className="quick-card" onClick={() => navigate('/negotiate/new?type=subscription')}>
                <span className="quick-emoji">🔄</span>
                <span>Subscription</span>
              </button>
              <button className="quick-card" onClick={() => navigate('/negotiate/new?type=business')}>
                <span className="quick-emoji">🤝</span>
                <span>Business</span>
              </button>
            </div>
          </div>
        </div>

        {/* Demo tip */}
        {isDemo && (
          <div className="demo-tip">
            <Zap size={16} style={{ color: 'var(--accent)' }} />
            <div>
              <strong>You're in Demo Mode.</strong> All features work! Data saves locally.
              <Link to="/register" className="auth-link" style={{ marginLeft: 8 }}>Create a free account →</Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function NegotiationCard({ neg }: { neg: any }) {
  const navigate = useNavigate()
  const statusColors: Record<string, string> = {
    draft: '#F59E0B',
    analyzed: '#3B82F6',
    simulating: '#8B5CF6',
    completed: '#22C55E',
  }

  return (
    <div className="neg-card" onClick={() => navigate(`/negotiate/${neg.id}`)}>
      <div className="neg-card-top">
        <div>
          <div className="neg-card-title">{neg.title}</div>
          <div className="neg-card-type">{neg.type}</div>
        </div>
        <span className="badge" style={{
          background: `${statusColors[neg.status]}1A`,
          color: statusColors[neg.status],
          fontSize: 11,
        }}>
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
    </div>
  )
}
