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

async function callGeminiDirect(prompt: string): Promise<string> {
  const key = getGeminiKey()
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    }
  )
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

function parseJsonFromText(text: string): any {
  // Extract JSON from markdown code blocks or raw text
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim()
  return JSON.parse(jsonStr)
}

export async function analyzeNegotiation(req: AnalysisRequest): Promise<NegotiationAnalysis> {
  if (shouldUseMock()) {
    // Simulate AI thinking time with progressive steps
    await delay(3500)

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

  // Direct Gemini call
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

Return ONLY a valid JSON object (no markdown) with this exact structure:
{
  "negotiation_type": "${req.type}",
  "opening_offer": <number: 5-10% above desired>,
  "target_offer": <number: desired offer>,
  "walk_away": <number: walk-away point>,
  "batna": <number: BATNA value if provided, else walk_away * 1.02>,
  "leverage_score": <number 0-100>,
  "acceptance_probability": <number 0-1>,
  "strengths": [<array of 3-4 strength strings>],
  "weaknesses": [<array of 2-3 weakness strings>],
  "best_arguments": [
    {"text": "<argument>", "strength": "strong|medium|weak", "reason": "<why it works>"},
    ...
  ],
  "arguments_to_avoid": [
    {"text": "<argument>", "reason": "<why to avoid>"},
    ...
  ],
  "strategy": "<2-3 sentence negotiation strategy>",
  "recommended_counter_offer": <number>,
  "leverage_breakdown": [
    {"factor": "<factor name>", "score": <0-100>},
    ...
  ],
  "negotiation_summary": "<3-4 sentence summary of position and recommended approach>"
}

Important: Only include AI estimates based on user-provided information. Do not invent factual market data.`

  const text = await callGeminiDirect(prompt)
  try {
    return parseJsonFromText(text)
  } catch {
    // Fallback to mock if parsing fails
    return { ...MOCK_ANALYSIS, negotiation_type: req.type, target_offer: req.desiredOffer, walk_away: req.walkAway }
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
    await delay(1200)
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

User just said: "${userMessage}"

Respond as the opponent would. Be ${opponentStyle}. Keep response under 3 sentences. Make a specific counter-offer if appropriate. Be realistic.`

    try {
      return await callGeminiDirect(prompt)
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
    await delay(800)
    const msg = userMessage.toLowerCase()
    if (msg.includes('offer') || msg.includes('lpa') || msg.includes('salary')) {
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
      const text = await callGeminiDirect(prompt)
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
