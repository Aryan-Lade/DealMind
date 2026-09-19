import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Trash2, Eye, Play, Clock, Filter } from 'lucide-react'
import { useNegotiations } from '../contexts/NegotiationContext'
import { formatCurrency } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'
import './History.css'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', analyzed: 'Ready', simulating: 'Simulating', completed: 'Completed'
}

export default function History() {
  const { negotiations, deleteNegotiation } = useNegotiations()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

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

  return (
    <AppLayout>
      <div className="history-page">
        <div className="history-header">
          <h1 className="heading-lg">My Negotiations</h1>
          <button className="btn btn-accent" onClick={() => navigate('/negotiate/new')}>+ New</button>
        </div>

        <div className="history-controls">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input className="search-input" placeholder="Search negotiations..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-tabs">
            {['all', 'analyzed', 'completed'].map(f => (
              <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : STATUS_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 32 }}>
            <div className="empty-icon"><Search size={24} /></div>
            <h3>{search ? 'No results found' : 'No negotiations yet'}</h3>
            <p className="text-secondary">{search ? 'Try a different search term' : 'Start your first negotiation to see it here.'}</p>
            {!search && <button className="btn btn-accent" onClick={() => navigate('/negotiate/new')}>Start Negotiating</button>}
          </div>
        ) : (
          <div className="history-list">
            {filtered.map(n => {
              const statusColor: Record<string, string> = {
                draft: '#F59E0B', analyzed: '#3B82F6', simulating: '#8B5CF6', completed: '#22C55E'
              }
              return (
                <div key={n.id} className="history-item" onClick={() => navigate(n.status === 'analyzed' || n.status === 'draft' ? `/negotiate/${n.id}` : `/negotiate/${n.id}`)}>
                  <div className="hi-main">
                    <div className="hi-type-badge" style={{ background: `${statusColor[n.status]}1A`, color: statusColor[n.status] }}>
                      {n.type}
                    </div>
                    <div>
                      <h3 className="hi-title">{n.title}</h3>
                      <div className="hi-meta">
                        <Clock size={12} />
                        {n.createdAt.toLocaleDateString()}
                        <span>·</span>
                        <span style={{ color: statusColor[n.status], fontWeight: 600 }}>{STATUS_LABELS[n.status]}</span>
                      </div>
                    </div>
                  </div>

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
                    {n.score && (
                      <div className="hm">
                        <span className="hm-label">Score</span>
                        <span className="hm-val">{n.score}/100</span>
                      </div>
                    )}
                    {n.finalOffer && (
                      <div className="hm">
                        <span className="hm-label">Final</span>
                        <span className="hm-val" style={{ color: 'var(--success)' }}>{formatCurrency(n.finalOffer)}</span>
                      </div>
                    )}
                  </div>

                  <div className="hi-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/negotiate/${n.id}`)}>
                      <Eye size={14} /> View
                    </button>
                    {n.status === 'analyzed' && (
                      <button className="btn btn-accent btn-sm" onClick={() => navigate(`/simulate/${n.id}`)}>
                        <Play size={14} /> Simulate
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={(e) => handleDelete(n.id, e)}
                      style={{ color: 'var(--danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
