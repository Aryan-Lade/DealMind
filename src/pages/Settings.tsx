import { useState, useEffect } from 'react'
import {
  Key, Server, Sliders, Shield, Download, Trash2, CheckCircle2,
  AlertCircle, Eye, EyeOff, Sparkles, RefreshCw, Save
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../contexts/AuthContext'
import { useNegotiations } from '../contexts/NegotiationContext'
import { DEMO_SCENARIOS, MOCK_ANALYSIS } from '../data/mockData'
import './Settings.css'

export default function Settings() {
  const { user } = useAuth()
  const { negotiations, addNegotiation } = useNegotiations()

  const [geminiKey, setGeminiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [apiUrl, setApiUrl] = useState('')
  const [opponentStyle, setOpponentStyle] = useState('professional')
  const [coachingStyle, setCoachingStyle] = useState('balanced')
  const [currency, setCurrency] = useState('₹')
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [saveToast, setSaveToast] = useState(false)

  useEffect(() => {
    const storedKey = localStorage.getItem('dealmind_gemini_key') || ''
    const storedUrl = localStorage.getItem('dealmind_api_url') || ''
    const storedOpponent = localStorage.getItem('dealmind_pref_opponent') || 'professional'
    const storedCoach = localStorage.getItem('dealmind_pref_coach') || 'balanced'
    const storedCurr = localStorage.getItem('dealmind_currency') || '₹'

    setGeminiKey(storedKey)
    setApiUrl(storedUrl)
    setOpponentStyle(storedOpponent)
    setCoachingStyle(storedCoach)
    setCurrency(storedCurr)
  }, [])

  const handleSave = () => {
    if (geminiKey.trim()) {
      localStorage.setItem('dealmind_gemini_key', geminiKey.trim())
    } else {
      localStorage.removeItem('dealmind_gemini_key')
    }

    if (apiUrl.trim()) {
      localStorage.setItem('dealmind_api_url', apiUrl.trim())
    } else {
      localStorage.removeItem('dealmind_api_url')
    }

    localStorage.setItem('dealmind_pref_opponent', opponentStyle)
    localStorage.setItem('dealmind_pref_coach', coachingStyle)
    localStorage.setItem('dealmind_currency', currency)

    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 3000)
  }

  const handleTestKey = async () => {
    const key = geminiKey.trim() || localStorage.getItem('dealmind_gemini_key') || ''
    if (!key) {
      setTestStatus('error')
      setTestMessage('Please enter an API key first')
      return
    }

    setTestStatus('testing')
    setTestMessage('Testing connection with Gemini 2.0 Flash...')

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with the single word: Connected' }] }],
          }),
        }
      )

      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      setTestStatus('success')
      setTestMessage(`Gemini verified! AI Response: "${text.trim()}"`)
    } catch (err: any) {
      setTestStatus('error')
      setTestMessage(err.message || 'Verification failed. Check your API key.')
    }
  }

  const handleSeedDemos = () => {
    const scenarios = Object.values(DEMO_SCENARIOS)
    scenarios.forEach((scenario: any) => {
      addNegotiation({
        ...scenario,
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
    })
    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 3000)
  }

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(negotiations, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `dealmind-negotiations-${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all locally saved negotiations? This cannot be undone.')) {
      localStorage.removeItem('dealmind_negotiations')
      window.location.reload()
    }
  }

  return (
    <AppLayout>
      <div className="settings-page">
        {saveToast && (
          <div className="settings-toast">
            <CheckCircle2 size={18} color="var(--accent)" />
            Settings saved successfully!
          </div>
        )}

        <div className="settings-header">
          <div>
            <h1 className="heading-lg">Settings & Configuration</h1>
            <p className="text-secondary" style={{ marginTop: 6 }}>
              Customize your AI model, negotiation simulator, and workspace preferences.
            </p>
          </div>
          <button className="btn btn-accent" onClick={handleSave}>
            <Save size={16} />
            Save Preferences
          </button>
        </div>

        <div className="settings-grid">
          {/* Section 1: AI Provider */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ background: 'rgba(204, 255, 0, 0.1)', color: 'var(--accent)' }}>
                <Key size={20} />
              </div>
              <div>
                <h2 className="settings-card-title">Google Gemini AI</h2>
                <p className="text-secondary text-sm">Provide your own key for live AI coaching & strategy generation</p>
              </div>
            </div>

            <div className="settings-body">
              <div className="form-group">
                <label className="form-label">Gemini API Key</label>
                <div className="input-wrapper">
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="form-input input-with-right-icon"
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={e => setGeminiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    className="input-right-icon"
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-muted text-xs" style={{ display: 'block', marginTop: 6 }}>
                  Get your free Gemini API key from{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                  >
                    Google AI Studio
                  </a>. If left blank, DealMind runs in high-fidelity Demo Mode.
                </span>
              </div>

              <div className="settings-action-row">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleTestKey}
                  disabled={testStatus === 'testing'}
                >
                  <RefreshCw size={14} className={testStatus === 'testing' ? 'spin' : ''} />
                  {testStatus === 'testing' ? 'Testing Connection...' : 'Test API Key'}
                </button>

                {testStatus === 'success' && (
                  <span className="badge badge-accent" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={13} /> {testMessage}
                  </span>
                )}

                {testStatus === 'error' && (
                  <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={13} /> {testMessage}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginTop: 20 }}>
                <label className="form-label">Backend API URL (Optional)</label>
                <div className="input-wrapper">
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://api.yourdomain.com (Leave empty for direct Gemini)"
                    value={apiUrl}
                    onChange={e => setApiUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Simulator & Persona */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                <Sliders size={20} />
              </div>
              <div>
                <h2 className="settings-card-title">Simulator & Coach Persona</h2>
                <p className="text-secondary text-sm">Configure how the opponent and AI coach behave</p>
              </div>
            </div>

            <div className="settings-body">
              <div className="form-group">
                <label className="form-label">Default Opponent Temperament</label>
                <select
                  className="form-select"
                  value={opponentStyle}
                  onChange={e => setOpponentStyle(e.target.value)}
                >
                  <option value="professional">Professional (Data-driven, polite, firm on targets)</option>
                  <option value="friendly">Collaborative (Win-win oriented, open to creative perks)</option>
                  <option value="firm">Tough Negotiator (High standards, quick counter-proposals)</option>
                  <option value="aggressive">Aggressive (Hardball tactics, tight deadlines)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Coaching Guidance Level</label>
                <select
                  className="form-select"
                  value={coachingStyle}
                  onChange={e => setCoachingStyle(e.target.value)}
                >
                  <option value="balanced">Balanced (Real-time hints, BATNA prompts, offer analysis)</option>
                  <option value="aggressive">Challenger (Critiques every early concession harshly)</option>
                  <option value="encouraging">Supportive (High confidence reinforcement, subtle tips)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Preferred Currency Symbol</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['₹', '$', '€', '£', '¥'].map(curr => (
                    <button
                      key={curr}
                      type="button"
                      className={`btn btn-sm ${currency === curr ? 'btn-accent' : 'btn-outline'}`}
                      style={{ minWidth: 44 }}
                      onClick={() => setCurrency(curr)}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: User Profile & Security */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#A855F7' }}>
                <Shield size={20} />
              </div>
              <div>
                <h2 className="settings-card-title">Account & Security</h2>
                <p className="text-secondary text-sm">Your active session and privacy settings</p>
              </div>
            </div>

            <div className="settings-body">
              <div className="settings-info-row">
                <span className="text-secondary">Current User:</span>
                <span style={{ fontWeight: 600 }}>{user?.displayName || 'Demo Negotiator'}</span>
              </div>
              <div className="settings-info-row">
                <span className="text-secondary">Email:</span>
                <span style={{ fontWeight: 600 }}>{user?.email || 'demo@dealmind.ai'}</span>
              </div>
              <div className="settings-info-row">
                <span className="text-secondary">Privacy Mode:</span>
                <span className="badge badge-accent">100% Client-side Local Storage</span>
              </div>
            </div>
          </div>

          {/* Section 4: Data Management */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                <Download size={20} />
              </div>
              <div>
                <h2 className="settings-card-title">Data Management</h2>
                <p className="text-secondary text-sm">Export, reload templates, or reset your local workspace</p>
              </div>
            </div>

            <div className="settings-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleSeedDemos}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                  Populate Demo Scenarios (Salary, Rent, Freelance)
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleExportData}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Download size={16} />
                  Export All Negotiations to JSON
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleClearData}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Trash2 size={16} />
                  Clear All Local Workspace Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
