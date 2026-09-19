import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  DollarSign, Home, Briefcase, ShoppingBag, RefreshCw,
  Building2, HelpCircle, ArrowRight, ArrowLeft, Zap, Check
} from 'lucide-react'
import { useNegotiations } from '../contexts/NegotiationContext'
import { analyzeNegotiation } from '../services/aiService'
import { DEMO_SCENARIOS } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'
import './NewNegotiation.css'

const TYPES = [
  { id: 'salary', icon: DollarSign, label: 'Salary', color: '#22C55E', desc: 'Job offer or raise negotiation' },
  { id: 'rent', icon: Home, label: 'Rent', color: '#3B82F6', desc: 'Apartment or office rent' },
  { id: 'freelance', icon: Briefcase, label: 'Freelancing', color: '#F59E0B', desc: 'Project pricing negotiation' },
  { id: 'purchase', icon: ShoppingBag, label: 'Purchase', color: '#EC4899', desc: 'Product or asset purchase' },
  { id: 'subscription', icon: RefreshCw, label: 'Subscription', color: '#8B5CF6', desc: 'SaaS or service renewal' },
  { id: 'business', icon: Building2, label: 'Business Deal', color: '#EF4444', desc: 'B2B or partnership deal' },
  { id: 'other', icon: HelpCircle, label: 'Other', color: '#6B7280', desc: 'Any other negotiation' },
]

const STEPS = ['Type', 'Situation', 'BATNA', 'Strengths', 'Analyze']

interface FormData {
  type: string
  title: string
  description: string
  currentOffer: string
  desiredOffer: string
  walkAway: string
  minAcceptable: string
  maxDesired: string
  deadline: string
  otherParty: string
  relationship: string
  context: string
  batna: string
  strengths: string
}

const INITIAL_FORM: FormData = {
  type: '', title: '', description: '', currentOffer: '', desiredOffer: '',
  walkAway: '', minAcceptable: '', maxDesired: '', deadline: '',
  otherParty: '', relationship: 'new', context: '', batna: '', strengths: '',
}

const LOADING_STEPS = [
  'Analyzing your bargaining position...',
  'Finding your strongest leverage...',
  'Building your negotiation strategy...',
  'Preparing opponent simulation...',
  'Strategy ready!',
]

export default function NewNegotiation() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [analyzing, setAnalyzing] = useState(false)
  const [loadStep, setLoadStep] = useState(0)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addNegotiation, updateNegotiation } = useNegotiations()

  // Pre-select type from URL param
  useEffect(() => {
    const type = searchParams.get('type')
    if (type) {
      setForm(f => ({ ...f, type }))
      setStep(1)
    }
  }, [searchParams])

  const update = (key: keyof FormData, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
  }

  const loadDemo = (type: string) => {
    const demo = DEMO_SCENARIOS[type]
    if (!demo) return
    setForm({
      type,
      title: demo.title,
      description: demo.context,
      currentOffer: String(demo.currentOffer),
      desiredOffer: String(demo.desiredOffer),
      walkAway: String(demo.walkAway),
      minAcceptable: String(demo.minAcceptable),
      maxDesired: String(demo.maxDesired),
      deadline: demo.deadline,
      otherParty: demo.otherParty,
      relationship: demo.relationship,
      context: demo.context,
      batna: String(demo.batna),
      strengths: demo.strengths,
    })
  }

  const canNext = () => {
    if (step === 0) return !!form.type
    if (step === 1) return !!(form.title && form.currentOffer && form.desiredOffer && form.walkAway)
    if (step === 2) return !!form.batna
    if (step === 3) return !!form.strengths
    return true
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setLoadStep(0)
    setError('')

    // Animate loading steps
    const interval = setInterval(() => {
      setLoadStep(prev => {
        if (prev < LOADING_STEPS.length - 2) return prev + 1
        return prev
      })
    }, 900)

    try {
      // Add negotiation to store
      const neg = addNegotiation({
        type: form.type,
        title: form.title,
        currentOffer: parseFloat(form.currentOffer),
        desiredOffer: parseFloat(form.desiredOffer),
        walkAway: parseFloat(form.walkAway),
        minAcceptable: parseFloat(form.minAcceptable || form.walkAway),
        maxDesired: parseFloat(form.maxDesired || form.desiredOffer),
        batna: form.batna,
        context: form.context || form.description,
        strengths: form.strengths,
        deadline: form.deadline,
        otherParty: form.otherParty,
        relationship: form.relationship,
        status: 'draft',
        messages: [],
      })

      // Call AI analysis
      const analysis = await analyzeNegotiation({
        title: form.title,
        type: form.type,
        currentOffer: parseFloat(form.currentOffer),
        desiredOffer: parseFloat(form.desiredOffer),
        walkAway: parseFloat(form.walkAway),
        batna: form.batna,
        context: form.context || form.description,
        strengths: form.strengths,
        deadline: form.deadline,
        otherParty: form.otherParty,
        relationship: form.relationship,
      })

      setLoadStep(LOADING_STEPS.length - 1)
      clearInterval(interval)

      // Update with analysis
      updateNegotiation(neg.id, { analysis, status: 'analyzed' })

      setTimeout(() => navigate(`/negotiate/${neg.id}`), 600)
    } catch (err: any) {
      clearInterval(interval)
      setError('Analysis failed. Please try again.')
      setAnalyzing(false)
    }
  }

  if (analyzing) {
    return (
      <AppLayout>
        <div className="analyzing-screen">
          <div className="analyzing-card">
            <div className="analyzing-icon">
              <Zap size={32} />
            </div>
            <h2>Analyzing your position</h2>
            <div className="analyzing-steps">
              {LOADING_STEPS.map((s, i) => (
                <div key={i} className={`load-step ${i < loadStep ? 'done' : i === loadStep ? 'active' : 'pending'}`}>
                  <div className="load-step-dot">
                    {i < loadStep ? <Check size={12} /> : <span />}
                  </div>
                  <span>{s}</span>
                </div>
              ))}
            </div>
            {error && <div className="auth-error">{error}</div>}
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="new-neg">
        {/* Progress */}
        <div className="new-neg-progress">
          {STEPS.map((s, i) => (
            <div key={i} className={`prog-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
              <div className="prog-dot">
                {i < step ? <Check size={12} /> : <span>{i + 1}</span>}
              </div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className="new-neg-content">
          {/* STEP 0: Choose Type */}
          {step === 0 && (
            <div>
              <h1 className="new-neg-title">What are you negotiating?</h1>
              <p className="text-secondary" style={{ marginTop: 8, marginBottom: 32 }}>
                Choose the type that best matches your situation.
              </p>
              <div className="type-grid">
                {TYPES.map(t => (
                  <button
                    key={t.id}
                    className={`type-card ${form.type === t.id ? 'type-card-selected' : ''}`}
                    onClick={() => { update('type', t.id); loadDemo(t.id) }}
                  >
                    <div className="type-icon" style={{ background: `${t.color}1A`, color: t.color }}>
                      <t.icon size={24} />
                    </div>
                    <h3 className="type-label">{t.label}</h3>
                    <p className="type-desc">{t.desc}</p>
                    {form.type === t.id && <div className="type-check"><Check size={14} /></div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Situation */}
          {step === 1 && (
            <div>
              <h1 className="new-neg-title">Describe your situation</h1>
              <p className="text-secondary" style={{ marginTop: 8, marginBottom: 32 }}>
                The more detail you provide, the more accurate your strategy.
              </p>
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="form-label">Negotiation Title *</label>
                  <input className="form-input" placeholder="e.g., Google Software Engineer Offer" value={form.title} onChange={e => update('title', e.target.value)} />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Context / Description</label>
                  <textarea className="form-textarea" placeholder="Describe the situation, your background, any relevant details..." value={form.description} onChange={e => update('description', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Their Current Offer *</label>
                  <input className="form-input" type="number" placeholder="800000" value={form.currentOffer} onChange={e => update('currentOffer', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Desired Offer *</label>
                  <input className="form-input" type="number" placeholder="1000000" value={form.desiredOffer} onChange={e => update('desiredOffer', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Walk-away Point *</label>
                  <input className="form-input" type="number" placeholder="900000" value={form.walkAway} onChange={e => update('walkAway', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input className="form-input" placeholder="e.g., 2 weeks" value={form.deadline} onChange={e => update('deadline', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Other Party</label>
                  <input className="form-input" placeholder="e.g., HR Manager" value={form.otherParty} onChange={e => update('otherParty', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Relationship</label>
                  <select className="form-select" value={form.relationship} onChange={e => update('relationship', e.target.value)}>
                    <option value="new">New relationship</option>
                    <option value="ongoing">Ongoing relationship</option>
                    <option value="longterm">Long-term relationship</option>
                    <option value="adversarial">Adversarial</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BATNA */}
          {step === 2 && (
            <div>
              <h1 className="new-neg-title">What's your best alternative?</h1>
              <div className="batna-explainer">
                <div className="be-icon"><Zap size={18} /></div>
                <div>
                  <strong>BATNA</strong> — Best Alternative To a Negotiated Agreement
                  <p className="text-secondary body-sm">Your BATNA is what you'll do if this negotiation fails. A strong BATNA gives you real leverage.</p>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 24 }}>
                <label className="form-label">Your BATNA *</label>
                <textarea className="form-textarea" style={{ minHeight: 140 }}
                  placeholder="e.g., I have another offer from XYZ company at ₹9.2 LPA. I can also stay at my current job."
                  value={form.batna} onChange={e => update('batna', e.target.value)} />
              </div>
              <p className="body-sm text-muted" style={{ marginTop: 12 }}>
                💡 Tip: A specific, verifiable alternative (like another offer) is much stronger than a vague one.
              </p>
            </div>
          )}

          {/* STEP 3: Strengths */}
          {step === 3 && (
            <div>
              <h1 className="new-neg-title">What are your strengths?</h1>
              <p className="text-secondary" style={{ marginTop: 8, marginBottom: 24 }}>
                List anything that improves your bargaining position.
              </p>
              <div className="strength-chips">
                {['Experience', 'Skills', 'Market demand', 'Competing offer', 'Time flexibility', 'Cash ready', 'Loyal customer', 'Performance record'].map(s => (
                  <button key={s} className={`chip ${form.strengths.includes(s) ? 'chip-active' : ''}`}
                    onClick={() => {
                      const current = form.strengths
                      update('strengths', current.includes(s)
                        ? current.replace(s, '').replace(', ,', ',').trim().replace(/^,|,$/g, '')
                        : current ? `${current}, ${s}` : s)
                    }}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Your Strengths *</label>
                <textarea className="form-textarea" placeholder="Describe your experience, unique skills, alternatives, market data, or any other leverage you have..."
                  value={form.strengths} onChange={e => update('strengths', e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 4: Generate */}
          {step === 4 && (
            <div className="step4-container">
              <div className="step4-summary">
                <h1 className="new-neg-title">Ready to analyze!</h1>
                <p className="text-secondary" style={{ marginTop: 8 }}>Review your details and generate your strategy.</p>

                <div className="summary-cards" style={{ marginTop: 28 }}>
                  <div className="sum-item">
                    <span className="sum-label">Type</span>
                    <span className="sum-val">{form.type}</span>
                  </div>
                  <div className="sum-item">
                    <span className="sum-label">Title</span>
                    <span className="sum-val">{form.title}</span>
                  </div>
                  <div className="sum-item">
                    <span className="sum-label">Current Offer</span>
                    <span className="sum-val">₹{parseFloat(form.currentOffer).toLocaleString()}</span>
                  </div>
                  <div className="sum-item">
                    <span className="sum-label">Target</span>
                    <span className="sum-val" style={{ color: 'var(--accent)' }}>₹{parseFloat(form.desiredOffer).toLocaleString()}</span>
                  </div>
                  <div className="sum-item">
                    <span className="sum-label">Walk-away</span>
                    <span className="sum-val">₹{parseFloat(form.walkAway).toLocaleString()}</span>
                  </div>
                  <div className="sum-item">
                    <span className="sum-label">BATNA</span>
                    <span className="sum-val">{form.batna.slice(0, 50)}...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="new-neg-nav">
            {step > 0 && (
              <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 4 ? (
              <button className="btn btn-accent" onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn btn-accent btn-lg" onClick={handleAnalyze} disabled={!canNext()}>
                <Zap size={18} /> Analyze My Negotiation
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
