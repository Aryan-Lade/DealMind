import { MOCK_ANALYSIS, MOCK_OPPONENT_RESPONSES, COACHING_RESPONSES, type NegotiationAnalysis } from '../../src/data/mockData'

export function getGeminiKey(): string {
  return localStorage.getItem('dealmind_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || ''
}

export function getApiUrl(): string {
  return localStorage.getItem('dealmind_api_url') || import.meta.env.VITE_API_URL || ''
}

// Check if we should use real API or mock
function shouldUseMock(): boolean {
  return !getApiUrl() && !getGeminiKey()
}

// Simulate a realistic loading delay
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export interface AnalysisRequest {
  title: string
  type: string
  currentOffer: number
  desiredOffer: number
  walkAway: number
  batna: string
  context: string
  strengths: string
  deadline: string
  otherParty: string
  relationship: string
}

export interface GeminiCallOptions {
  maxOutputTokens?: number
  temperature?: number
  responseMimeType?: string
  timeoutMs?: number
}

export interface SimulatorTurnResult {
  opponentResponse: string
  coaching: {
    assessment: 'good' | 'improve' | 'warning'
    feedback: string
    suggestion: string
  }
}

// Healthy, ultra-low latency models verified to work on current API quotas
const CANDIDATE_GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
  'gemini-3-flash-preview',
]

// In-memory blacklist for 429/503 errors (3 minute cooldown)
const modelBlacklist = new Map<string, number>()
let lastWorkingModel: string = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('dealmind_active_model')) || 'gemini-3.1-flash-lite'

function getHealthyModels(): string[] {
  const now = Date.now()
  for (const [m, expire] of modelBlacklist.entries()) {
    if (now > expire) modelBlacklist.delete(m)
  }

  const healthy = CANDIDATE_GEMINI_MODELS.filter(m => !modelBlacklist.has(m))
  const pool = healthy.length > 0 ? healthy : CANDIDATE_GEMINI_MODELS

  // Put last working model first if healthy
  return [lastWorkingModel, ...pool.filter(m => m !== lastWorkingModel)]
}

export async function callGeminiDirect(
  prompt: string,
  optionsOrModelIndex?: GeminiCallOptions | number,
  responseMimeType?: string
): Promise<string> {
  const key = getGeminiKey()
  if (!key) throw new Error('Gemini API key is not configured')

  const opts: GeminiCallOptions = typeof optionsOrModelIndex === 'object' && optionsOrModelIndex !== null
    ? optionsOrModelIndex
    : { responseMimeType: responseMimeType || (typeof optionsOrModelIndex === 'string' ? optionsOrModelIndex : undefined) }

  const models = getHealthyModels()
  let lastErr: any = null

  for (const model of models) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs || 6500)

      const generationConfig: any = {
        temperature: opts.temperature ?? 0.7,
        topP: 0.8,
        maxOutputTokens: opts.maxOutputTokens || 350,
      }
      if (opts.responseMimeType) {
        generationConfig.responseMimeType = opts.responseMimeType
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig,
          }),
          signal: controller.signal,
        }
      )
      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 429 || response.status === 503) {
          modelBlacklist.set(model, Date.now() + 3 * 60 * 1000)
        }
        console.warn(`Gemini model ${model} returned status ${response.status}. Trying next candidate...`)
        continue
      }

      const data = await response.json()
      const parts = data.candidates?.[0]?.content?.parts || []
      const text = parts.map((p: any) => p.text || '').join('').trim()

      if (text) {
        lastWorkingModel = model
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('dealmind_active_model', model)
          }
        } catch {}
        return text
      }
    } catch (err: any) {
      lastErr = err
      if (err.name === 'AbortError') {
        modelBlacklist.set(model, Date.now() + 2 * 60 * 1000)
        console.warn(`Gemini call on ${model} timed out. Trying next candidate...`)
      } else {
        console.warn(`Gemini call on ${model} failed: ${err.message}. Trying next candidate...`)
      }
    }
  }

  throw lastErr || new Error('All Gemini models exhausted or unavailable')
}

function parseJsonFromText(text: string): any {
  // Extract JSON from markdown code blocks or raw text
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim())
  }
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(text.slice(firstBrace, lastBrace + 1))
  }
  return JSON.parse(text.trim())
}

export async function analyzeNegotiation(req: AnalysisRequest): Promise<NegotiationAnalysis> {
  if (shouldUseMock()) {
    // Fast mock response
    await delay(1000)

    // Customize mock based on request
    const ratio = req.desiredOffer / req.currentOffer
    const leverageScore = Math.min(95, Math.round(60 + (ratio - 1) * 30 + (req.batna ? 15 : 0)))

    return {
      ...MOCK_ANALYSIS,
      negotiation_type: req.type,
      opening_offer: Math.round(req.desiredOffer * 1.08),
      target_offer: req.desiredOffer,
      walk_away: req.walkAway,
      batna: parseFloat(req.batna) || req.walkAway * 1.02,
      leverage_score: leverageScore,
      recommended_counter_offer: req.desiredOffer,
    }
  }

  // Try backend API first
  const apiUrl = getApiUrl()
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/api/negotiations/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      if (res.ok) return await res.json()
    } catch {
      console.warn('Backend unavailable, falling back to Gemini direct')
    }
  }

  // Direct Gemini call with full protection
  const prompt = `You are an expert negotiation strategist. Analyze the following negotiation scenario and return a JSON response.

Negotiation Details:
- Type: ${req.type}
- Title: ${req.title}
- Current Offer: ${req.currentOffer}
- Desired Offer: ${req.desiredOffer}
- Walk-away Point: ${req.walkAway}
- BATNA: ${req.batna}
- Context: ${req.context}
- Strengths: ${req.strengths}
- Other Party: ${req.otherParty}
- Relationship: ${req.relationship}
- Deadline: ${req.deadline}

Return ONLY a valid JSON object matching this schema:
{
  "negotiation_type": "${req.type}",
  "opening_offer": <number: recommended opening offer>,
  "target_offer": <number: desired offer>,
  "walk_away": <number: walk-away point>,
  "batna": <number: numeric valuation of BATNA>,
  "leverage_score": <number 0-100>,
  "acceptance_probability": <number 0-1>,
  "strengths": [<array of 3-4 strength strings>],
  "weaknesses": [<array of 2-3 weakness strings>],
  "best_arguments": [
    {"text": "<argument>", "strength": "strong|medium|weak", "reason": "<why it works>"}
  ],
  "arguments_to_avoid": [
    {"text": "<argument>", "reason": "<why to avoid>"}
  ],
  "strategy": "<2-3 sentence negotiation strategy>",
  "recommended_counter_offer": <number>,
  "leverage_breakdown": [
    {"factor": "<factor name>", "score": <0-100>}
  ],
  "negotiation_summary": "<3-4 sentence summary of position and recommended approach>"
}`

  try {
    const text = await callGeminiDirect(prompt, {
      maxOutputTokens: 1800,
      responseMimeType: 'application/json',
      timeoutMs: 8500
    })
    const parsed = parseJsonFromText(text)
    if (parsed && typeof parsed.leverage_score === 'number') {
      return parsed
    }
    throw new Error('Incomplete JSON parsed from Gemini')
  } catch (err) {
    console.warn('Gemini direct analysis fallback:', err)
    const ratio = req.desiredOffer / (req.currentOffer || 1)
    const leverageScore = Math.min(95, Math.round(65 + Math.abs(ratio - 1) * 20 + (req.batna ? 12 : 0)))
    return {
      ...MOCK_ANALYSIS,
      negotiation_type: req.type,
      opening_offer: Math.round(req.desiredOffer * 0.96),
      target_offer: req.desiredOffer,
      walk_away: req.walkAway,
      batna: parseFloat(req.batna) || req.walkAway * 1.02,
      leverage_score: leverageScore,
      recommended_counter_offer: req.desiredOffer,
      strategy: `Open with an anchor around ₹${Math.round(req.desiredOffer * 0.96).toLocaleString()} to establish negotiation room. Use your BATNA as a firm boundary and protect your target of ₹${req.desiredOffer.toLocaleString()}.`,
      negotiation_summary: `Your negotiation position is supported by your BATNA. Focus on non-monetary value additions to bridge the gap from ₹${req.currentOffer.toLocaleString()} to your target.`
    }
  }
}

/**
 * Unified turn generator: fetches both opponent's counter and coach evaluation
 * in a single ultra-fast network trip.
 */
export async function getSimulatorTurn(
  context: string,
  userMessage: string,
  conversationHistory: string,
  opponentStyle: string,
  negotiationData: any
): Promise<SimulatorTurnResult> {
  if (shouldUseMock()) {
    await delay(350)
    const responses = MOCK_OPPONENT_RESPONSES[opponentStyle] || MOCK_OPPONENT_RESPONSES.professional
    const oppResponse = responses[Math.floor(Math.random() * responses.length)]
    
    let assessment: 'good' | 'improve' | 'warning' = 'improve'
    let feedback = 'Keep focusing on your target value and leverage.'
    let suggestion = `Protect your target of ₹${(negotiationData.target_offer || negotiationData.desiredOffer || 0).toLocaleString()} and use trade-offs.`
    
    const msg = userMessage.toLowerCase()
    if (msg.includes('offer') || msg.includes('lpa') || msg.includes('salary') || msg.includes('₹') || /\d+/.test(msg)) {
      assessment = 'good'
      feedback = 'You stated a specific anchor or numerical position.'
      suggestion = 'If they push back on this figure, ask what concessions would bridge the gap.'
    } else if (msg.includes('okay') || msg.includes('fine') || msg.includes('agree') || msg.includes('accept')) {
      assessment = 'warning'
      feedback = 'Careful not to concede without extracting reciprocal value.'
      suggestion = 'Pair any concession with a counter-ask (e.g. tenure, payment schedule, or perks).'
    }

    return {
      opponentResponse: oppResponse,
      coaching: { assessment, feedback, suggestion }
    }
  }

  if (getGeminiKey()) {
    const prompt = `You are DealMind's negotiation simulation engine.
Scenario context: ${context}
Negotiation type: ${negotiationData.type || 'general'}
Current negotiation state: ${JSON.stringify(negotiationData)}
Opponent style: ${opponentStyle} (friendly / professional / firm / aggressive)

Recent conversation history:
${conversationHistory}

User just said: "${userMessage}"

Generate BOTH the opponent's immediate reply and the real-time AI coach feedback.
Respond ONLY with a valid JSON object matching this schema:
{
  "opponent_response": "<in character as ${opponentStyle} opponent, under 3 sentences, realistic counter-offer or firm stance>",
  "assessment": "good|improve|warning",
  "feedback": "<1 concise sentence assessing the user's tactical move>",
  "suggestion": "<1-2 concise actionable sentences advising user on what to do next>"
}`

    try {
      const text = await callGeminiDirect(prompt, {
        maxOutputTokens: 320,
        responseMimeType: 'application/json',
        timeoutMs: 6000,
      })
      const parsed = parseJsonFromText(text)
      if (parsed && parsed.opponent_response) {
        return {
          opponentResponse: parsed.opponent_response,
          coaching: {
            assessment: (['good', 'improve', 'warning'].includes(parsed.assessment) ? parsed.assessment : 'improve') as any,
            feedback: parsed.feedback || 'Evaluate their counter-offer carefully.',
            suggestion: parsed.suggestion || 'Frame your next reply around your target value.'
          }
        }
      }
    } catch (err) {
      console.warn('Fast unified turn failed, using instant smart fallback:', err)
    }
  }

  // Instant graceful fallback
  const responses = MOCK_OPPONENT_RESPONSES[opponentStyle] || MOCK_OPPONENT_RESPONSES.professional
  const oppResponse = responses[Math.floor(Math.random() * responses.length)]
  const coach = COACHING_RESPONSES[Math.floor(Math.random() * COACHING_RESPONSES.length)]
  return {
    opponentResponse: oppResponse,
    coaching: {
      assessment: coach.assessment,
      feedback: coach.feedback,
      suggestion: coach.suggestion
    }
  }
}

export async function getOpponentResponse(
  context: string,
  userMessage: string,
  conversationHistory: string,
  opponentStyle: string,
  negotiationData: any
): Promise<string> {
  if (shouldUseMock()) {
    await delay(350)
    const responses = MOCK_OPPONENT_RESPONSES[opponentStyle] || MOCK_OPPONENT_RESPONSES.professional
    const idx = Math.floor(Math.random() * responses.length)
    return responses[idx]
  }

  if (getGeminiKey()) {
    const prompt = `You are simulating a ${opponentStyle} negotiating opponent in a ${negotiationData.type} negotiation.

Context: ${context}
Current offer from their side: ${negotiationData.currentOffer}
Their opening: ${negotiationData.currentOffer}
Conversation so far:
${conversationHistory}

User just said: "${userMessage || 'Let us begin the discussion.'}"

Respond as the opponent would. Be ${opponentStyle}. Keep response under 3 sentences. Make a specific counter-offer if appropriate. Be realistic.`

    try {
      return await callGeminiDirect(prompt, { maxOutputTokens: 250, timeoutMs: 5500 })
    } catch {
      const responses = MOCK_OPPONENT_RESPONSES[opponentStyle] || MOCK_OPPONENT_RESPONSES.professional
      return responses[Math.floor(Math.random() * responses.length)]
    }
  }

  const responses = MOCK_OPPONENT_RESPONSES[opponentStyle] || MOCK_OPPONENT_RESPONSES.professional
  return responses[Math.floor(Math.random() * responses.length)]
}

export async function getCoachingAdvice(
  userMessage: string,
  opponentMessage: string,
  negotiationData: any
): Promise<{ assessment: 'good' | 'improve' | 'warning'; feedback: string; suggestion: string }> {
  if (shouldUseMock()) {
    await delay(250)
    const msg = userMessage.toLowerCase()
    if (msg.includes('offer') || msg.includes('lpa') || msg.includes('salary') || msg.includes('₹') || /\d+/.test(msg)) {
      return {
        assessment: 'good',
        feedback: 'You clearly stated your position with a specific number.',
        suggestion: `Your target is ₹${(negotiationData.target_offer / 100000).toFixed(1)} LPA. If they push back, ask what it would take to reach your number.`,
      }
    }
    if (msg.includes('okay') || msg.includes('fine') || msg.includes('accept')) {
      return {
        assessment: 'warning',
        feedback: 'Be careful — you may be conceding too quickly.',
        suggestion: 'Before accepting, request something additional like a joining bonus or earlier performance review.',
      }
    }
    const coaching = COACHING_RESPONSES[Math.floor(Math.random() * COACHING_RESPONSES.length)]
    return {
      assessment: coaching.assessment,
      feedback: coaching.feedback,
      suggestion: coaching.suggestion,
    }
  }

  if (getGeminiKey()) {
    const prompt = `You are a real-time negotiation coach. The user just said: "${userMessage}". The opponent responded: "${opponentMessage}".
    
Negotiation context: ${JSON.stringify(negotiationData)}

Briefly assess the user's message and provide coaching. Return ONLY JSON:
{
  "assessment": "good|improve|warning",
  "feedback": "<1 sentence feedback on what user did>",
  "suggestion": "<1-2 sentence actionable suggestion for next move>"
}`
    try {
      const text = await callGeminiDirect(prompt, { maxOutputTokens: 200, responseMimeType: 'application/json', timeoutMs: 5000 })
      return parseJsonFromText(text)
    } catch {
      return { assessment: 'improve', feedback: 'Keep focusing on your target.', suggestion: 'Reference your BATNA to strengthen your position.' }
    }
  }

  return {
    assessment: 'improve',
    feedback: 'Keep your target in mind.',
    suggestion: `Push toward ₹${(negotiationData.target_offer / 100000).toFixed(1)} LPA — you have room to negotiate.`,
  }
}

export async function getFinalAnalysis(
  negotiationData: any,
  messages: any[],
  finalOffer: number,
  outcome: string
): Promise<any> {
  await delay(1500)

  const initialOffer = negotiationData.currentOffer
  const target = negotiationData.target_offer || negotiationData.desiredOffer
  const improvement = finalOffer - initialOffer
  const targetAchievement = Math.min(100, Math.round(((finalOffer - initialOffer) / (target - initialOffer)) * 100))
  const concessions = messages.filter(m => m.role === 'user').length

  const score = Math.min(100, Math.max(0,
    targetAchievement * 0.4 +
    (concessions < 3 ? 30 : concessions < 5 ? 20 : 10) +
    (outcome === 'accepted' ? 30 : outcome === 'walked' ? 20 : 10)
  ))

  return {
    initial_offer: initialOffer,
    final_offer: finalOffer,
    improvement,
    target,
    target_achievement: targetAchievement,
    score: Math.round(score),
    outcome,
    total_rounds: Math.ceil(messages.length / 2),
    key_strengths: [
      'Maintained a clear opening anchor',
      'Referenced BATNA effectively',
      'Stayed professional throughout',
    ],
    areas_to_improve: [
      'Consider delaying first concession longer',
      'Could have bundled non-monetary benefits',
      'More specific value articulation would help',
    ],
    grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D',
  }
}
