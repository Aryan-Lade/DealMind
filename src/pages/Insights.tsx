import { useNegotiations } from '../contexts/NegotiationContext'
import { formatCurrency } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell
} from 'recharts'
import './Insights.css'

const ACCENT = '#FF5722'
const ACCENT_DIM = 'rgba(255, 87, 34, 0.3)'

export default function Insights() {
  const { negotiations } = useNegotiations()

  const completed = negotiations.filter(n => n.status === 'completed')
  const totalNeg = negotiations.length
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, n) => s + (n.score || 0), 0) / completed.length)
    : 0
  const avgAchievement = completed.length
    ? Math.round(completed.reduce((s, n) => {
        const target = n.desiredOffer
        const final = n.finalOffer || n.currentOffer
        const pct = target > n.currentOffer ? Math.min(100, ((final - n.currentOffer) / (target - n.currentOffer)) * 100) : 0
        return s + pct
      }, 0) / completed.length)
    : 0

  const scoreData = completed.slice(-8).map((n, i) => ({
    name: `#${i + 1}`,
    score: n.score || 0,
    label: n.title.slice(0, 12),
  }))

  const typeData = ['salary', 'rent', 'freelance', 'purchase', 'subscription', 'business'].map(type => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count: negotiations.filter(n => n.type === type).length,
  })).filter(d => d.count > 0)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="chart-tooltip">
          <p style={{ fontWeight: 700 }}>{label}</p>
          <p style={{ color: ACCENT }}>{payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  return (
    <AppLayout>
      <div className="insights-page">
        <h1 className="heading-lg" style={{ marginBottom: 32 }}>Negotiation Insights</h1>

        {/* Overview stats */}
        <div className="insights-stats">
          <div className="insight-stat">
            <div className="is-val">{totalNeg}</div>
            <div className="is-label">Total Negotiations</div>
          </div>
          <div className="insight-stat">
            <div className="is-val">{completed.length}</div>
            <div className="is-label">Completed</div>
          </div>
          <div className="insight-stat">
            <div className="is-val" style={{ color: ACCENT }}>{avgScore || '—'}</div>
            <div className="is-label">Avg. Score</div>
          </div>
          <div className="insight-stat">
            <div className="is-val" style={{ color: '#22C55E' }}>{avgAchievement || 0}%</div>
            <div className="is-label">Avg. Target Achievement</div>
          </div>
        </div>

        {completed.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <div className="empty-icon">📊</div>
            <h3>No completed negotiations</h3>
            <p className="text-secondary">Complete a simulation to see your analytics here.</p>
          </div>
        ) : (
          <div className="insights-charts">
            {/* Score over time */}
            <div className="chart-card">
              <h2 className="heading-md" style={{ marginBottom: 20 }}>Negotiation Score Trend</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={scoreData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#71717A', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke={ACCENT} strokeWidth={2} dot={{ fill: ACCENT, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Negotiation types */}
            <div className="chart-card">
              <h2 className="heading-md" style={{ marginBottom: 20 }}>By Negotiation Type</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={typeData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="type" tick={{ fill: '#71717A', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#71717A', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {typeData.map((_, i) => <Cell key={i} fill={ACCENT} fillOpacity={0.7 + i * 0.05} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent negotiations table */}
            <div className="chart-card chart-wide">
              <h2 className="heading-md" style={{ marginBottom: 20 }}>Recent Results</h2>
              <div className="insights-table">
                <div className="it-header">
                  <span>Negotiation</span>
                  <span>Type</span>
                  <span>Target</span>
                  <span>Final</span>
                  <span>Score</span>
                </div>
                {completed.slice(0, 6).map(n => (
                  <div key={n.id} className="it-row">
                    <span className="it-title">{n.title}</span>
                    <span className="it-type">{n.type}</span>
                    <span>{formatCurrency(n.desiredOffer)}</span>
                    <span style={{ color: '#22C55E' }}>{n.finalOffer ? formatCurrency(n.finalOffer) : '—'}</span>
                    <span>
                      <span className="score-pill" style={{
                        background: (n.score || 0) >= 80 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                        color: (n.score || 0) >= 80 ? '#22C55E' : '#F59E0B',
                      }}>
                        {n.score || '—'}/100
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
