import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Shield, Zap, Target, TrendingUp, MessageSquare,
  BarChart2, ChevronDown, Check, Plus, Minus, ExternalLink,
  Sparkles, Layers, Cpu, Award
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './Landing.css'

const MARQUEE_ITEMS = [
  'Tech Salary & Equity',
  'Commercial Real Estate',
  'High-Ticket Retainers',
  'Enterprise SaaS Procurement',
  'Founder Seed Rounds',
  'Executive Promotions',
  'Vendor Multi-Year Contracts',
  'Consulting SOWs',
]

const CAPABILITY_CAPSULES = [
  { name: 'BATNA Calculator', color: '#FF5722', bg: 'rgba(255, 87, 34, 0.1)', icon: '⚖️', delay: 0.1, y: 7 },
  { name: 'Counterparty Profiler', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: '👤', delay: 0.4, y: 9 },
  { name: 'Anchor Formulation', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: '⚓', delay: 0.2, y: 6 },
  { name: 'Real-Time Coach', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.1)', icon: '🧠', delay: 0.5, y: 8 },
  { name: 'Concession Tracker', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)', icon: '📉', delay: 0.3, y: 7 },
  { name: 'Tone & Leverage Matrix', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', icon: '📊', delay: 0.6, y: 10 },
]

const CASE_STUDIES = [
  {
    tag: 'Salary & Equity',
    title: 'Senior Software Engineer Package',
    description: 'Initial offer was ₹8 LPA. Using DealMind anchor framing and BATNA leverage, the candidate countered at ₹10.4 LPA and closed at ₹9.8 LPA + joining bonus.',
    metric: '+22.5% Uplift',
    counterparty: 'Tech Talent Acquisition',
    tags: ['Tech Career', 'Compensation', 'BATNA Framing'],
  },
  {
    tag: 'Lease & Property',
    title: 'Prime Apartment Rent Renewal',
    description: 'Landlord proposed a sudden 20% spike to ₹35,000. Leveraged 3-year spotless payment history and local vacancy data to lock renewal at ₹28,500.',
    metric: '₹78,000 Saved / Yr',
    counterparty: 'Property Owner',
    tags: ['Real Estate', 'Tenant Rights', 'Market Data'],
  },
  {
    tag: 'Client Retainer',
    title: 'High-Ticket Design & Dev Retainer',
    description: 'A venture-backed startup sought unlimited design work for ₹50,000/mo. DealMind structured tiered scope packages, securing an ₹80,000/mo contract.',
    metric: '+60% Deal Value',
    counterparty: 'Startup Founder',
    tags: ['Consulting', 'Scope Defense', 'Value Pricing'],
  },
  {
    tag: 'Enterprise SaaS',
    title: 'Multi-Seat Enterprise Software Contract',
    description: 'Negotiating annual licenses with procurement. Exchanged 2-year upfront commitment for 26% discount + dedicated support SLA.',
    metric: '26% Discount Secured',
    counterparty: 'VP of Procurement',
    tags: ['B2B SaaS', 'Procurement', 'Trade-offs'],
  },
]

const FAQS = [
  {
    q: 'How does DealMind predict counterparty responses?',
    a: 'DealMind uses game theory frameworks and Google Gemini 2.0 Flash to model the behavioral psychology of 4 counterparty personas: Professional (data-focused), Collaborative (win-win), Firm (anchor-defending), and Aggressive (deadline-pressuring).',
  },
  {
    q: 'Can I use DealMind without an API key?',
    a: 'Yes. DealMind includes a high-fidelity Demo Mode that simulates realistic AI opponent behaviors, coaching critiques, and scoring algorithms locally without any setup or API credentials.',
  },
  {
    q: 'Is my negotiation data and salary private?',
    a: '100% private. All your scenario context, numbers, and practice dialogues remain stored solely in your browser localStorage. No negotiation transcripts are ever sold or used for public model training.',
  },
  {
    q: 'What is BATNA and why does it matter?',
    a: 'BATNA stands for Best Alternative To a Negotiated Agreement. It is your ultimate source of leverage. DealMind forces you to calculate and articulate your BATNA so you never accept an offer worse than walking away.',
  },
  {
    q: 'How does the in-conversation AI coach work?',
    a: 'While you roleplay in the Simulator Arena, the AI Coach monitors every message you send, flagging premature concessions, suggesting tactical counters, and grading your adherence to target anchors.',
  },
]

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [pricingPeriod, setPricingPeriod] = useState<'free' | 'pro'>('free')

  const handleAction = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/register')
    }
  }

  // Motion variants
  const fadeIn = {
    hidden: { opacity: 0, y: 24 },
    visible: (custom: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: custom * 0.1, ease: [0.16, 1, 0.3, 1] }
    })
  }

  return (
    <div className="hanzo-landing">
      {/* Floating Capsule Header */}
      <motion.header
        className="hanzo-header"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="hanzo-header-inner">
          <Link to="/" className="hanzo-logo">
            <motion.span
              className="hanzo-logo-symbol"
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.4 }}
            >
              <Zap size={14} />
            </motion.span>
            <span className="hanzo-logo-text">DealMind</span>
            <span className="hanzo-version-pill">v2.0</span>
          </Link>

          <nav className="hanzo-nav">
            <a href="#capabilities">Capabilities</a>
            <a href="#process">Process</a>
            <a href="#cases">Case Studies</a>
            <a href="#pricing">Access</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="hanzo-header-actions">
            <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <motion.button
              className="btn btn-dark btn-sm"
              onClick={handleAction}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started <ArrowRight size={13} className="btn-arrow" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ============================================================
          HERO SECTION (WARM LIGHT CANVAS)
          ============================================================ */}
      <section className="hanzo-hero">
        <div className="hanzo-container">
          {/* Status Indicator Pill */}
          <motion.div
            className="status-capsule"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.04 }}
          >
            <span className="status-dot" />
            <span>AI Strategy Engine Active — Gemini 2.0 Connected</span>
          </motion.div>

          {/* Dual-Tone Display Headline with spring badges */}
          <motion.h1
            className="hanzo-hero-title heading-dual"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            Master High-Stakes
            <motion.span
              className="inline-badge badge-shield"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: -6 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
              whileHover={{ rotate: 0, scale: 1.15 }}
            >
              <Shield size={22} />
            </motion.span>
            <br />
            Negotiations,
            <motion.span
              className="inline-badge badge-target"
              initial={{ scale: 0, rotate: 30 }}
              animate={{ scale: 1, rotate: 6 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.6 }}
              whileHover={{ rotate: 0, scale: 1.15 }}
            >
              <Target size={22} />
            </motion.span>
            <span className="ghost-text"> Crafted by AI</span>
          </motion.h1>

          <motion.p
            className="hanzo-hero-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            Roleplay live against calibrated AI counterparties. Receive in-flight tactical coaching,
            mathematical anchor formulation, and concession defense before entering the real room.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            className="hanzo-hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.button
              className="btn btn-dark btn-lg"
              onClick={handleAction}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Start Free Simulation <ArrowRight size={16} className="btn-arrow" />
            </motion.button>
            <motion.a
              href="#process"
              className="btn btn-outline btn-lg"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Explore The Process
            </motion.a>
          </motion.div>

          {/* Social Proof Avatar Stack */}
          <motion.div
            className="hanzo-social-proof"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.75 }}
          >
            <div className="avatar-stack">
              <motion.span whileHover={{ y: -4 }} className="avatar-chip" style={{ background: '#FF5722' }}>AL</motion.span>
              <motion.span whileHover={{ y: -4 }} className="avatar-chip" style={{ background: '#10B981' }}>SK</motion.span>
              <motion.span whileHover={{ y: -4 }} className="avatar-chip" style={{ background: '#3B82F6' }}>RD</motion.span>
              <motion.span whileHover={{ y: -4 }} className="avatar-chip" style={{ background: '#F59E0B' }}>MJ</motion.span>
              <motion.span whileHover={{ y: -4 }} className="avatar-chip" style={{ background: '#8B5CF6' }}>TC</motion.span>
            </div>
            <p className="social-proof-text">
              <strong>Trusted by 2,400+ Negotiators</strong> across high-growth startups and global enterprises
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          INFINITE HORIZONTAL MARQUEE TICKER (HANZO SIGNATURE MOTION)
          ============================================================ */}
      <div className="hanzo-marquee-wrapper">
        <div className="hanzo-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <div key={idx} className="marquee-item">
              <span className="marquee-dot">◆</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================
          SHOWCASE VIEWPORT CONTAINER (DARK OBSIDIAN)
          ============================================================ */}
      <section className="hanzo-showcase-section">
        <div className="hanzo-container">
          <motion.div
            className="showcase-viewport"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="showcase-floating-badge"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles size={14} style={{ color: 'var(--accent)' }} />
              <span>Live Strategy Matrix Preview</span>
            </motion.div>

            {/* Showcase Mockup UI */}
            <div className="showcase-mockup">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <div className="mockup-title">Google Software Engineer — Offer Strategy Matrix</div>
                <div className="mockup-badge badge-emerald">Active Simulation</div>
              </div>

              <div className="mockup-body">
                <motion.div
                  className="mockup-metric-card"
                  whileHover={{ y: -4, borderColor: 'rgba(255, 87, 34, 0.4)' }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="metric-label">Opening Anchor</span>
                  <p className="metric-value text-mono">₹10,80,000</p>
                  <span className="metric-sub text-emerald">+8% over desired target</span>
                </motion.div>
                <motion.div
                  className="mockup-metric-card"
                  whileHover={{ y: -4, borderColor: 'rgba(255, 87, 34, 0.4)' }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="metric-label">Target Goal</span>
                  <p className="metric-value text-mono" style={{ color: '#FF5722' }}>₹10,00,000</p>
                  <span className="metric-sub">Sweet spot position</span>
                </motion.div>
                <motion.div
                  className="mockup-metric-card"
                  whileHover={{ y: -4, borderColor: 'rgba(255, 87, 34, 0.4)' }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="metric-label">Hard Walk-Away</span>
                  <p className="metric-value text-mono text-danger">₹9,00,000</p>
                  <span className="metric-sub">Protected by BATNA</span>
                </motion.div>
                <motion.div
                  className="mockup-metric-card"
                  whileHover={{ y: -4, borderColor: 'rgba(255, 87, 34, 0.4)' }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="metric-label">Bargaining Leverage</span>
                  <p className="metric-value text-mono">84 / 100</p>
                  <span className="metric-sub text-emerald">High Competitive Index</span>
                </motion.div>
              </div>

              {/* Chat snippet */}
              <div className="mockup-chat-preview">
                <motion.div
                  className="chat-msg opponent-msg"
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <span className="sender-tag">HR Director (Professional)</span>
                  <p>"We have reviewed your profile. Our standard band for this role is ₹8.0 LPA with performance equity."</p>
                </motion.div>
                <motion.div
                  className="chat-msg user-msg"
                  initial={{ opacity: 0, x: 15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <span className="sender-tag">You (Strategist)</span>
                  <p>"Thank you. Given my 3 years leading production architectures and a competing offer at ₹9.2 LPA, I am targeting ₹10.0 LPA."</p>
                </motion.div>
                <motion.div
                  className="coach-alert-pill"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <span className="coach-badge">AI COACH FEEDBACK</span>
                  <p>"Strong opening anchor. You grounded your number with market validation and a concrete competing offer."</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          FLOATING CAPABILITY CAPSULES SECTION
          ============================================================ */}
      <section id="capabilities" className="hanzo-section hanzo-capabilities-section">
        <div className="hanzo-container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="eyebrow-rule">— Strategic Capabilities —</div>
            <h2 className="section-title">
              Every negotiation won is a masterclass in preparation
            </h2>
            <p className="section-sub">
              DealMind replaces guesswork with mathematical modeling, psychological counterparty calibration,
              and real-time tactical reinforcement.
            </p>
          </motion.div>

          <div className="capabilities-capsule-cloud">
            {CAPABILITY_CAPSULES.map((cap, i) => (
              <motion.div
                key={i}
                className="floating-capsule"
                animate={{ y: [0, -cap.y, 0] }}
                transition={{
                  duration: 3.2 + cap.delay * 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: cap.delay
                }}
                whileHover={{
                  scale: 1.08,
                  y: -6,
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.12)',
                  borderColor: 'rgba(255, 87, 34, 0.3)'
                }}
                whileTap={{ scale: 0.96 }}
              >
                <span className="capsule-icon" style={{ background: cap.bg, color: cap.color }}>
                  {cap.icon}
                </span>
                <span>{cap.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          3D TILTED PROCESS CARDS DECK & ANIMATED SVG CURVE
          ============================================================ */}
      <section id="process" className="hanzo-section hanzo-process-section">
        <div className="hanzo-container">
          <motion.div
            className="text-center"
            style={{ marginBottom: 56 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="eyebrow-rule">— Our Process, Explained —</div>
            <h2 className="section-title">Three steps to absolute bargaining clarity</h2>
            <p className="section-sub">From entering your numbers to walking into the meeting with total control.</p>
          </motion.div>

          <div className="process-deck-container">
            {/* Animated SVG Connector Curve with electric dashed line */}
            <svg className="process-connector-curve" viewBox="0 0 1000 120" fill="none" preserveAspectRatio="none">
              <path
                className="animated-dash-path"
                d="M 50 60 C 250 10, 350 110, 500 60 C 650 10, 750 110, 950 60"
                stroke="#FF5722"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
              <circle cx="50" cy="60" r="6" fill="#FF5722" className="pulse-node" />
              <circle cx="500" cy="60" r="6" fill="#FF5722" className="pulse-node" />
              <circle cx="950" cy="60" r="6" fill="#FF5722" className="pulse-node" />
            </svg>

            <div className="process-cards-grid">
              {/* Card 1 */}
              <motion.div
                className="process-card tilt-card-1"
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                whileHover={{ rotate: 0, y: -10, scale: 1.02 }}
              >
                <span className="process-step-num">01</span>
                <h3 className="process-card-title">Input Your Stakes</h3>
                <p className="process-card-desc">
                  Enter your current offer, target ambition, hard walk-away number, and alternate options (BATNA).
                </p>
                <div className="process-card-pill">Bargaining Audit</div>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                className="process-card tilt-card-2"
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.25 }}
                whileHover={{ rotate: 0, y: -10, scale: 1.02 }}
              >
                <span className="process-step-num" style={{ color: '#FF5722' }}>02</span>
                <h3 className="process-card-title">Formulate The Strategy</h3>
                <p className="process-card-desc">
                  DealMind calculates your probability curves, opening anchor, talking points, and concession packages.
                </p>
                <div className="process-card-pill" style={{ borderColor: 'rgba(255, 87, 34, 0.3)', color: '#FF5722' }}>
                  Gemini 2.0 Model
                </div>
              </motion.div>

              {/* Card 3 */}
              <motion.div
                className="process-card tilt-card-3"
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ rotate: 0, y: -10, scale: 1.02 }}
              >
                <span className="process-step-num">03</span>
                <h3 className="process-card-title">Roleplay & Close</h3>
                <p className="process-card-desc">
                  Enter the simulator arena against realistic counterparties with live coaching before the real deal.
                </p>
                <div className="process-card-pill">Simulation Arena</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CURATED CASE STUDIES & SCENARIOS
          ============================================================ */}
      <section id="cases" className="hanzo-section hanzo-cases-section">
        <div className="hanzo-container">
          <div className="cases-header">
            <div>
              <div className="eyebrow-rule">— Proven High-Stakes Scenarios —</div>
              <h2 className="section-title">Tested in high-pressure arenas</h2>
            </div>
            <motion.button
              className="btn btn-dark"
              onClick={handleAction}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Explore Arena Presets <ArrowRight size={15} className="btn-arrow" />
            </motion.button>
          </div>

          <div className="cases-grid">
            {CASE_STUDIES.map((cs, idx) => (
              <motion.div
                key={idx}
                className="case-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                whileHover={{ y: -6, scale: 1.015 }}
              >
                <div className="case-card-top">
                  <span className="badge badge-accent">{cs.tag}</span>
                  <span className="case-metric-badge text-mono">{cs.metric}</span>
                </div>

                <h3 className="case-card-title">{cs.title}</h3>
                <p className="case-card-desc">{cs.description}</p>

                <div className="case-card-footer">
                  <span className="case-counterparty">Opponent: <strong>{cs.counterparty}</strong></span>
                  <div className="case-tags">
                    {cs.tags.map((t, i) => (
                      <span key={i} className="case-tag-chip">{t}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          ACCESS & PRICING (HANZO INTEGRATED CARD)
          ============================================================ */}
      <section id="pricing" className="hanzo-section hanzo-pricing-section">
        <div className="hanzo-container">
          <motion.div
            className="text-center"
            style={{ marginBottom: 44 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="eyebrow-rule">— Transparent Access —</div>
            <h2 className="section-title">Zero barriers to mastering your leverage</h2>
            <p className="section-sub">Practice locally in Demo Mode or bring your Google Gemini API key.</p>
          </motion.div>

          <div className="pricing-card-wrapper">
            <motion.div
              className="pricing-card"
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ boxShadow: '0 25px 60px rgba(0, 0, 0, 0.09)' }}
            >
              <div className="pricing-header">
                <div className="pricing-toggle">
                  <button
                    className={`toggle-btn ${pricingPeriod === 'free' ? 'active' : ''}`}
                    onClick={() => setPricingPeriod('free')}
                  >
                    Demo Edition
                  </button>
                  <button
                    className={`toggle-btn ${pricingPeriod === 'pro' ? 'active' : ''}`}
                    onClick={() => setPricingPeriod('pro')}
                  >
                    Gemini Live
                  </button>
                </div>
                <span className="badge badge-emerald">Open & Client-Side</span>
              </div>

              <div className="pricing-body">
                <div className="pricing-number-block">
                  <span className="currency-symbol">{pricingPeriod === 'free' ? '₹' : '$'}</span>
                  <span className="price-amount">0</span>
                  <span className="price-period">/ forever free</span>
                </div>
                <p className="pricing-tagline">
                  {pricingPeriod === 'free'
                    ? 'Instant practice arena with high-fidelity mock AI responses. No registration or API key required.'
                    : 'Connect your personal Google Gemini 2.0 Flash key directly for unlimited live dynamic AI strategy generation.'}
                </p>

                <div className="pricing-features-list">
                  <div className="feature-item">
                    <span className="feature-check"><Check size={14} /></span>
                    <span>Full BATNA & opening anchor mathematical models</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-check"><Check size={14} /></span>
                    <span>Interactive Roleplay Simulator Arena with 4 opponent temperaments</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-check"><Check size={14} /></span>
                    <span>Real-time in-flight executive AI coaching and concession alerts</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-check"><Check size={14} /></span>
                    <span>Historical negotiation analytics, score grading, and data export</span>
                  </div>
                </div>

                <motion.button
                  className="btn btn-accent btn-lg"
                  style={{ width: '100%', marginTop: 28 }}
                  onClick={handleAction}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Launch DealMind Now <ArrowRight size={16} className="btn-arrow" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FAQ & FOUNDER CONTACT SPLIT SECTION
          ============================================================ */}
      <section id="faq" className="hanzo-section hanzo-faq-section">
        <div className="hanzo-container">
          <div className="faq-split-layout">
            {/* Left Contact Card */}
            <motion.div
              className="faq-contact-card"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -4 }}
            >
              <div className="contact-avatar">👨‍💻</div>
              <h3 className="contact-title">Have a specific high-stakes deal?</h3>
              <p className="contact-desc">
                Need guidance on structuring a complex multi-stakeholder negotiation or customized corporate training?
              </p>
              <motion.button
                className="btn btn-dark"
                style={{ width: '100%', marginBottom: 14 }}
                onClick={handleAction}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Open Practice Arena →
              </motion.button>
              <a href="mailto:aryanlade55@gmail.com" className="contact-email-link">
                aryanlade55@gmail.com
              </a>
            </motion.div>

            {/* Right Accordion List with AnimatePresence */}
            <div className="faq-accordion-list">
              <div className="eyebrow-rule" style={{ marginBottom: 16 }}>— Common Questions —</div>
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className={`faq-item ${openFaq === idx ? 'open' : ''}`}
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <div className="faq-question">
                    <span>{faq.q}</span>
                    <motion.span
                      className="faq-toggle-icon"
                      animate={{ rotate: openFaq === idx ? 45 : 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Plus size={16} />
                    </motion.span>
                  </div>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        className="faq-answer"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p>{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          DARK FOOTER CANVAS (HANZO DEEP CHARCOAL WITH LIGHT RAY)
          ============================================================ */}
      <footer className="hanzo-footer">
        <div className="hanzo-footer-light-ray" />
        <div className="hanzo-container">
          <div className="footer-top">
            <motion.div
              className="footer-headline"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="footer-line-1">Let's</span>
              <span className="footer-line-2 text-serif">Negotiate.</span>
            </motion.div>

            <motion.button
              className="btn btn-accent btn-lg footer-cta"
              onClick={handleAction}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              Launch DealMind Free <ArrowRight size={16} className="btn-arrow" />
            </motion.button>
          </div>

          <div className="footer-bottom">
            <div className="footer-copy-capsule">
              <span>© {new Date().getFullYear()} DealMind Studio — Crafted by Aryan Lade</span>
            </div>

            <div className="footer-links">
              <a href="https://github.com/Aryan-Lade/DealMind-" target="_blank" rel="noreferrer">
                GitHub Repository <ExternalLink size={12} />
              </a>
              <Link to="/login">Sign In</Link>
              <Link to="/dashboard">Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
