import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Brain, Send, Check, AlertTriangle, Zap, Flag, TrendingUp, ArrowRight } from 'lucide-react'
import { useNegotiations } from '../contexts/NegotiationContext'
import { getOpponentResponse, getCoachingAdvice, getFinalAnalysis } from '../services/aiService'
import { formatCurrency } from '../data/mockData'
import AppLayout from '../layouts/AppLayout'
import './Simulator.css'

type OpponentStyle = 'friendly' | 'professional' | 'firm' | 'aggressive'

interface Message {
  id: string
  role: 'user' | 'opponent' | 'coach' | 'system'
  content: string
  coaching?: {
    assessment: 'good' | 'improve' | 'warning'
    feedback: string
    suggestion: string
  }
  timestamp: Date
}

interface Concession {
  role: 'user' | 'opponent'
  offer: number
  round: number
}

export default function Simulator() {
  const { id } = useParams<{ id: string }>()
  const { getById, updateNegotiation } = useNegotiations()
  const navigate = useNavigate()
  const neg = id ? getById(id) : null

  const [phase, setPhase] = useState<'setup' | 'active' | 'finished'>('setup')
  const [opponentStyle, setOpponentStyle] = useState<OpponentStyle>('professional')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [concessions, setConcessions] = useState<Concession[]>([])
  const [currentUserOffer, setCurrentUserOffer] = useState(0)
  const [currentOppOffer, setCurrentOppOffer] = useState(0)
  const [suggestion, setSuggestion] = useState('')
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [finalResult, setFinalResult] = useState<any>(null)
  const [finalOffer, setFinalOffer] = useState('')
  const [usingSuggestion, setUsingSuggestion] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const analysis = neg?.analysis

  const [initialCheckDone, setInitialCheckDone] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialCheckDone(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (initialCheckDone && !neg) navigate('/dashboard')
  }, [initialCheckDone, neg, navigate])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (neg && analysis) {
      setCurrentUserOffer(analysis.opening_offer || neg.desiredOffer)
      setCurrentOppOffer(neg.currentOffer)
    }
  }, [neg, analysis])

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const m: Message = { ...msg, id: Date.now().toString(), timestamp: new Date() }
    setMessages(prev => [...prev, m])
    return m
  }

  const handleStart = async () => {
    setPhase('active')
    setLoading(true)

    // Opening message from opponent
    const opening = await getOpponentResponse(
      neg?.context || '',
      '',
      '',
      opponentStyle,
      { ...analysis, currentOffer: neg?.currentOffer, type: neg?.type }
    )

    addMessage({ role: 'system', content: `Simulation started. You are negotiating: ${neg?.title}` })
    addMessage({ role: 'opponent', content: opening })

    setConcessions([{ role: 'opponent', offer: neg?.currentOffer || 0, round: 0 }])
    setCurrentOppOffer(neg?.currentOffer || 0)
    setLoading(false)
  }

  const handleSend = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    setShowSuggestion(false)
    setSuggestion('')

    const userMsg = addMessage({ role: 'user', content: msg })

    // Parse offer from message
    const offerMatch = msg.match(/₹?([\d,.]+)\s*(lpa|l|lac|lakh|k)?/i)
    if (offerMatch) {
      const rawNum = parseFloat(offerMatch[1].replace(/,/g, ''))
      const unit = offerMatch[2]?.toLowerCase() || ''
      const offer = unit.includes('l') || unit.includes('lac') ? rawNum * 100000
        : unit.includes('k') ? rawNum * 1000 : rawNum
      if (offer > 100) {
        setCurrentUserOffer(offer)
        setConcessions(prev => [...prev, { role: 'user', offer, round: Math.ceil(prev.length / 2) }])
      }
    }

    setLoading(true)

    // Build conversation history
    const history = messages.map(m => `${m.role}: ${m.content}`).join('\n')

    // Get opponent response
    const oppResponse = await getOpponentResponse(
      neg?.context || '',
      msg,
      history,
      opponentStyle,
      { ...analysis, currentOffer: currentOppOffer, type: neg?.type }
    )

    // Parse opponent's offer
    const oppMatch = oppResponse.match(/₹?([\d,.]+)\s*(lpa|l|lac|lakh|k)?/i)
    if (oppMatch) {
      const rawNum = parseFloat(oppMatch[1].replace(/,/g, ''))
      const unit = oppMatch[2]?.toLowerCase() || ''
      const offer = unit.includes('l') || unit.includes('lac') ? rawNum * 100000
        : unit.includes('k') ? rawNum * 1000 : rawNum
      if (offer > 100 && offer > currentOppOffer) {
        setCurrentOppOffer(offer)
        setConcessions(prev => [...prev, { role: 'opponent', offer, round: Math.ceil(prev.length / 2) }])
      }
    }

    // Get coaching
    const coaching = await getCoachingAdvice(msg, oppResponse, analysis)

    const oppMsg = { role: 'opponent' as const, content: oppResponse }
    const coachMsg = { role: 'coach' as const, content: '', coaching }
    addMessage(oppMsg)
    addMessage(coachMsg)

    // Save ongoing conversation
    const allMsgs = [...messages, userMsg, { ...oppMsg, id: Date.now().toString(), timestamp: new Date() }, { ...coachMsg, id: (Date.now() + 1).toString(), timestamp: new Date() }]
    updateNegotiation(id!, {
      status: 'simulating',
      messages: allMsgs.map(m => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : (m.timestamp || new Date().toISOString()),
      })),
    })

    // Generate suggestion
    const nextSuggestion = coaching.suggestion
    setSuggestion(nextSuggestion)
    setShowSuggestion(true)

    setLoading(false)
    inputRef.current?.focus()
  }

  const handleFinish = async (outcome: 'accepted' | 'rejected' | 'walked') => {
    setLoading(true)
    const final = parseFloat(finalOffer) || currentOppOffer
    const result = await getFinalAnalysis(
      { ...analysis, currentOffer: neg?.currentOffer, desiredOffer: neg?.desiredOffer, type: neg?.type },
      messages,
      final,
      outcome
    )
    setFinalResult({ ...result, outcome })
    updateNegotiation(id!, {
      status: 'completed',
      score: result.score,
      finalOffer: final,
      messages: messages.map(m => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : (m.timestamp || new Date().toISOString()),
      })),
    })
    setPhase('finished')
    setLoading(false)
  }

  const renderMessage = (msg: Message) => {
    if (msg.role === 'system') {
      return (
        <div key={msg.id} className="sim-system-msg">
          <span>{msg.content}</span>
        </div>
      )
    }

    if (msg.role === 'coach') {
      if (!msg.coaching) return null
      const c = msg.coaching
      return (
        <div key={msg.id} className={`sim-coach-msg ${c.assessment}`}>
          <div className="scm-header">
            <Brain size={14} />
            <strong>AI Coach</strong>
            <span className={`scm-badge ${c.assessment}`}>
              {c.assessment === 'good' ? '✓ Good' : c.assessment === 'warning' ? '⚠ Warning' : '⚡ Improve'}
            </span>
          </div>
          <p className="scm-feedback">{c.feedback}</p>
        </div>
      )
    }

    return (
      <div key={msg.id} className={`sim-msg-row ${msg.role}`}>
        {msg.role === 'opponent' && (
          <div className="sim-msg-avatar opp">O</div>
        )}
        <div className={`sim-bubble ${msg.role}`}>
          <p>{msg.content}</p>
          <span className="sim-time">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {msg.role === 'user' && (
          <div className="sim-msg-avatar user">U</div>
        )}
      </div>
    )
  }

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <AppLayout>
        <div className="sim-setup">
          <div className="sim-setup-card">
            <div className="sim-setup-header">
              <div className="analyzing-icon" style={{ width: 56, height: 56, margin: '0 auto 20px' }}>
                <Brain size={26} />
              </div>
              <h1>Configure Simulation</h1>
              <p className="text-secondary">{neg?.title}</p>
            </div>

            <div className="sim-setup-info">
              <div className="ssi-item">
                <span className="ssi-label">Your Opening</span>
                <span className="ssi-val text-accent">{formatCurrency(analysis?.opening_offer || 0)}</span>
              </div>
              <div className="ssi-item">
                <span className="ssi-label">Their Offer</span>
                <span className="ssi-val">{formatCurrency(neg?.currentOffer || 0)}</span>
              </div>
              <div className="ssi-item">
                <span className="ssi-label">Your Target</span>
                <span className="ssi-val">{formatCurrency(analysis?.target_offer || 0)}</span>
              </div>
              <div className="ssi-item">
                <span className="ssi-label">Walk-away</span>
                <span className="ssi-val">{formatCurrency(analysis?.walk_away || 0)}</span>
              </div>
            </div>

            <div style={{ margin: '24px 0' }}>
              <label className="form-label" style={{ marginBottom: 12, display: 'block' }}>Opponent Style</label>
              <div className="opp-styles">
                {(['friendly', 'professional', 'firm', 'aggressive'] as OpponentStyle[]).map(style => (
                  <button
                    key={style}
                    className={`opp-style-btn ${opponentStyle === style ? 'active' : ''}`}
                    onClick={() => setOpponentStyle(style)}
                  >
                    {style === 'friendly' ? '😊' : style === 'professional' ? '👔' : style === 'firm' ? '💼' : '😤'}
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="opp-style-desc">
              {opponentStyle === 'friendly' && '"I understand your perspective. Let\'s find a middle ground."'}
              {opponentStyle === 'professional' && '"Our offer reflects the market rate for this role."'}
              {opponentStyle === 'firm' && '"This is our final position. Limited flexibility available."'}
              {opponentStyle === 'aggressive' && '"That\'s well above what we pay for this level."'}
            </div>

            <button className="btn btn-accent btn-lg" style={{ width: '100%', marginTop: 24 }} onClick={handleStart}>
              <Zap size={18} />
              Start Simulation
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // FINISHED PHASE
  if (phase === 'finished' && finalResult) {
    return (
      <AppLayout>
        <div className="sim-result">
          <div className="result-card">
            <div className="result-header">
              <div className={`result-icon ${finalResult.outcome}`}>
                {finalResult.outcome === 'accepted' ? '🎉' : finalResult.outcome === 'walked' ? '🚶' : '❌'}
              </div>
              <h1>Negotiation Complete</h1>
              <p className="text-secondary">
                {finalResult.outcome === 'accepted' ? 'Deal accepted!' : finalResult.outcome === 'walked' ? 'You walked away.' : 'Deal rejected.'}
              </p>
            </div>

            <div className="result-metrics">
              <div className="res-metric">
                <span className="res-label">Initial Offer</span>
                <span className="res-val">{formatCurrency(finalResult.initial_offer)}</span>
              </div>
              <div className="res-metric">
                <span className="res-label">Final Offer</span>
                <span className="res-val" style={{ color: 'var(--accent)' }}>{formatCurrency(finalResult.final_offer)}</span>
              </div>
              <div className="res-metric">
                <span className="res-label">Improvement</span>
                <span className="res-val" style={{ color: 'var(--success)' }}>+{formatCurrency(finalResult.improvement)}</span>
              </div>
              <div className="res-metric">
                <span className="res-label">Target Achievement</span>
                <span className="res-val">{finalResult.target_achievement}%</span>
              </div>
            </div>

            <div className="result-score">
              <div className="rs-ring">
                <svg width={140} height={140}>
                  <circle cx={70} cy={70} r={60} fill="none" stroke="var(--bg-elevated)" strokeWidth={10} />
                  <circle cx={70} cy={70} r={60} fill="none" stroke="var(--accent)" strokeWidth={10}
                    strokeDasharray={`${(finalResult.score / 100) * 377} 377`} strokeLinecap="round"
                    transform="rotate(-90 70 70)" />
                </svg>
                <div className="rs-inner">
                  <span className="rs-score">{finalResult.score}</span>
                  <span className="rs-label">/ 100</span>
                </div>
              </div>
              <div className="rs-grade">Grade: {finalResult.grade}</div>
              <p className="body-sm text-muted">AI-generated simulation score</p>
            </div>

            <div className="result-feedback">
              <div>
                <h3 className="body-sm text-muted" style={{ marginBottom: 8 }}>💪 Key Strengths</h3>
                {finalResult.key_strengths?.map((s: string, i: number) => (
                  <div key={i} className="rf-item rf-good">✓ {s}</div>
                ))}
              </div>
              <div>
                <h3 className="body-sm text-muted" style={{ marginBottom: 8 }}>📈 Improve Next Time</h3>
                {finalResult.areas_to_improve?.map((s: string, i: number) => (
                  <div key={i} className="rf-item rf-improve">→ {s}</div>
                ))}
              </div>
            </div>

            <div className="result-actions">
              <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>Dashboard</button>
              <button className="btn btn-accent" onClick={() => navigate('/negotiate/new')}>
                New Negotiation <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // ACTIVE SIMULATION
  return (
    <AppLayout>
      <div className="simulator">
        {/* Sim Header */}
        <div className="sim-header">
          <div>
            <h1 className="sim-title">{neg?.title}</h1>
            <div className="sim-tags">
              <span className="badge badge-accent">Live Simulation</span>
              <span className="badge badge-neutral">{opponentStyle} opponent</span>
            </div>
          </div>
          <div className="sim-status">
            <div className="ss-item">
              <span>Your Offer</span>
              <strong style={{ color: 'var(--accent)' }}>{formatCurrency(currentUserOffer)}</strong>
            </div>
            <div className="ss-sep" />
            <div className="ss-item">
              <span>Their Offer</span>
              <strong>{formatCurrency(currentOppOffer)}</strong>
            </div>
            <div className="ss-sep" />
            <div className="ss-item">
              <span>Gap</span>
              <strong style={{ color: currentUserOffer - currentOppOffer < 100000 ? 'var(--success)' : 'var(--warning)' }}>
                {formatCurrency(Math.abs(currentUserOffer - currentOppOffer))}
              </strong>
            </div>
          </div>
        </div>

        <div className="sim-body">
          {/* Chat */}
          <div className="sim-chat-panel">
            <div className="sim-messages">
              {messages.map(renderMessage)}
              {loading && (
                <div className="sim-typing">
                  <div className="sim-msg-avatar opp">O</div>
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion banner */}
            {showSuggestion && suggestion && (
              <div className="sim-suggestion-bar">
                <Brain size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <p className="body-sm">{suggestion}</p>
                <button className="btn btn-accent btn-sm" onClick={() => { setInput(suggestion); setShowSuggestion(false) }}>
                  Use
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowSuggestion(false)}>✕</button>
              </div>
            )}

            {/* Input */}
            <div className="sim-input-area">
              <textarea
                ref={inputRef}
                className="sim-input"
                placeholder="Type your response..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                rows={3}
              />
              <div className="sim-input-actions">
                <div className="sim-finish-btns">
                  <button className="btn btn-sm btn-dark" onClick={() => {
                    const f = prompt('Enter final agreed offer (₹):')
                    if (f) { setFinalOffer(f); handleFinish('accepted') }
                  }}>
                    ✓ Deal Accepted
                  </button>
                  <button className="btn btn-sm btn-dark" onClick={() => handleFinish('walked')}>
                    🚶 Walk Away
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleFinish('rejected')}>
                    ✕ Rejected
                  </button>
                </div>
                <button className="btn btn-accent" onClick={() => handleSend()} disabled={!input.trim() || loading}>
                  <Send size={16} />
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Coach Panel */}
          <div className="sim-coach-side">
            <div className="scs-header">
              <Brain size={16} style={{ color: 'var(--accent)' }} />
              <strong>AI Coach</strong>
            </div>

            {/* Status */}
            <div className="scs-status">
              <h3 className="body-sm text-muted" style={{ marginBottom: 12 }}>Negotiation Status</h3>
              <div className="scs-status-item">
                <span className="body-sm">Your position</span>
                <strong className="text-accent">{formatCurrency(currentUserOffer)}</strong>
              </div>
              <div className="scs-status-item">
                <span className="body-sm">Their last offer</span>
                <strong>{formatCurrency(currentOppOffer)}</strong>
              </div>
              <div className="scs-status-item">
                <span className="body-sm">Target</span>
                <strong>{formatCurrency(analysis?.target_offer || 0)}</strong>
              </div>
              <div className="scs-status-item">
                <span className="body-sm">Walk-away</span>
                <strong style={{ color: 'var(--danger)' }}>{formatCurrency(analysis?.walk_away || 0)}</strong>
              </div>
            </div>

            {/* Concession timeline */}
            {concessions.length > 0 && (
              <div className="concession-timeline">
                <h3 className="body-sm text-muted" style={{ marginBottom: 12 }}>Concession Tracker</h3>
                <div className="ct-cols">
                  <div className="ct-col">
                    <p className="body-sm text-muted" style={{ marginBottom: 8 }}>Opponent</p>
                    {concessions.filter(c => c.role === 'opponent').map((c, i) => (
                      <div key={i} className="ct-item ct-opp">{formatCurrency(c.offer)}</div>
                    ))}
                  </div>
                  <div className="ct-col">
                    <p className="body-sm text-muted" style={{ marginBottom: 8 }}>You</p>
                    {concessions.filter(c => c.role === 'user').map((c, i) => (
                      <div key={i} className="ct-item ct-user">{formatCurrency(c.offer)}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick tips */}
            <div className="scs-tips">
              <h3 className="body-sm text-muted" style={{ marginBottom: 10 }}>Quick Tips</h3>
              <div className="tip-item">💡 Lead with your BATNA if they push back hard</div>
              <div className="tip-item">💡 Ask "what would it take to reach {formatCurrency(analysis?.target_offer || 0)}?"</div>
              <div className="tip-item">💡 Request benefits (bonus, review date) if salary is fixed</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
