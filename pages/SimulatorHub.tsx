import { useNavigate } from 'react-router-dom'
import { MessageSquare, Zap, Play, ArrowRight, Briefcase, Home, Laptop, Building, Plus } from 'lucide-react'
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

  return (
    <AppLayout>
      <div className="simhub-page">
        {/* Banner */}
        <div className="simhub-hero">
          <div className="simhub-badge">
            <Zap size={13} style={{ color: 'var(--accent)' }} />
            AI Opponent + Real-Time Executive Coach
          </div>
          <h1 className="heading-lg simhub-title">Negotiation Simulation Arena</h1>
          <p className="text-secondary simhub-subtitle">
            Roleplay live against an intelligent AI counterparty calibrated to your scenario.
            Receive instant tactic analysis, concession tracking, and real-time coaching before the real deal.
          </p>
        </div>

        {/* Active Negotiations Section */}
        {activeNegotiations.length > 0 && (
          <div className="simhub-section">
            <div className="simhub-section-header">
              <h2 className="heading-md">Your Active Negotiations</h2>
              <span className="text-secondary text-sm">Select a scenario you prepared</span>
            </div>
            <div className="simhub-active-grid">
              {activeNegotiations.map(neg => (
                <div key={neg.id} className="simhub-active-card">
                  <div className="simhub-active-top">
                    <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>{neg.type}</span>
                    <span className="text-secondary text-xs">{new Date(neg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="simhub-active-name">{neg.title}</h3>
                  <div className="simhub-active-numbers">
                    <div>
                      <span className="text-xs text-muted">Their Offer:</span>
                      <p className="text-sm font-semibold">{formatCurrency(neg.currentOffer)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted">Target:</span>
                      <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(neg.desiredOffer)}</p>
                    </div>
                  </div>
                  <button
                    className="btn btn-accent btn-sm"
                    style={{ marginTop: 16, width: '100%' }}
                    onClick={() => navigate(`/simulate/${neg.id}`)}
                  >
                    <Play size={14} />
                    Launch Simulation
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Practice Scenarios */}
        <div className="simhub-section">
          <div className="simhub-section-header">
            <div>
              <h2 className="heading-md">Instant Practice Scenarios</h2>
              <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
                Hop into a realistic negotiation simulation in 1 click — no setup needed
              </p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/negotiate/new')}>
              <Plus size={14} />
              Create Custom
            </button>
          </div>

          <div className="simhub-presets-grid">
            {QUICK_SCENARIOS.map(sc => {
              const Icon = sc.icon
              return (
                <div key={sc.key} className="simhub-preset-card">
                  <div className="simhub-preset-header">
                    <div className="simhub-preset-icon" style={{ background: `${sc.color}15`, color: sc.color }}>
                      <Icon size={22} />
                    </div>
                    <span className="badge badge-outline" style={{ fontSize: 11 }}>{sc.difficulty}</span>
                  </div>

                  <h3 className="simhub-preset-title">{sc.title}</h3>
                  <p className="text-muted text-xs" style={{ marginBottom: 10 }}>Opponent: <strong>{sc.role}</strong></p>
                  <p className="simhub-preset-desc">{sc.context}</p>

                  <div className="simhub-preset-metrics">
                    <div className="simhub-preset-metric">
                      <span className="text-muted text-xs">Opening</span>
                      <span className="font-semibold">{formatCurrency(sc.currentOffer)}</span>
                    </div>
                    <div className="simhub-preset-metric">
                      <span className="text-muted text-xs">Target</span>
                      <span className="font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(sc.desiredOffer)}</span>
                    </div>
                    <div className="simhub-preset-metric">
                      <span className="text-muted text-xs">Walk Away</span>
                      <span className="font-semibold text-danger">{formatCurrency(sc.walkAway)}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-accent"
                    style={{ width: '100%', marginTop: 18 }}
                    onClick={() => startQuickScenario(sc)}
                  >
                    Start Roleplay <ArrowRight size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
