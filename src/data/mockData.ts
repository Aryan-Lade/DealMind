// Mock AI responses for Demo Mode and fallback
export interface NegotiationAnalysis {
  negotiation_type: string
  opening_offer: number
  target_offer: number
  walk_away: number
  batna: number
  leverage_score: number
  acceptance_probability: number
  strengths: string[]
  weaknesses: string[]
  best_arguments: { text: string; strength: 'strong' | 'medium' | 'weak'; reason: string }[]
  arguments_to_avoid: { text: string; reason: string }[]
  strategy: string
  recommended_counter_offer: number
  leverage_breakdown: { factor: string; score: number }[]
  negotiation_summary: string
}

export interface SimulatorMessage {
  role: 'user' | 'opponent' | 'coach'
  content: string
  coaching?: {
    assessment: 'good' | 'improve' | 'warning'
    feedback: string
    suggestion: string
  }
  timestamp: Date
}

export const DEMO_SCENARIOS: Record<string, any> = {
  salary: {
    title: 'Google Software Engineer Salary',
    type: 'salary',
    currentOffer: 800000,
    desiredOffer: 1000000,
    walkAway: 900000,
    minAcceptable: 900000,
    maxDesired: 1200000,
    batna: '920000',
    context: 'I have a competing offer from another top tech company at ₹9.2 LPA. I have 3 years of experience and strong referrals.',
    strengths: 'Competing offer, strong portfolio, in-demand skills',
    deadline: '2 weeks',
    otherParty: 'HR Manager',
    relationship: 'new',
  },
  rent: {
    title: 'Apartment Rent Negotiation',
    type: 'rent',
    currentOffer: 35000,
    desiredOffer: 28000,
    walkAway: 32000,
    minAcceptable: 28000,
    maxDesired: 28000,
    batna: 'Found another apartment at ₹29,000 in a similar location',
    context: 'I am a long-term tenant (3 years) with excellent payment history. The landlord increased rent by 20%.',
    strengths: 'Long tenure, no missed payments, market alternatives',
    deadline: '1 month',
    otherParty: 'Landlord',
    relationship: 'ongoing',
  },
  freelance: {
    title: 'Freelance Project Pricing',
    type: 'freelance',
    currentOffer: 50000,
    desiredOffer: 80000,
    walkAway: 65000,
    minAcceptable: 65000,
    maxDesired: 100000,
    batna: 'Another client offering ₹70,000 for a similar project',
    context: 'The client wants a complete e-commerce website with custom features. I have delivered 3 similar projects.',
    strengths: 'Proven track record, unique expertise, timeline advantage',
    deadline: '3 days',
    otherParty: 'Startup Founder',
    relationship: 'new',
  },
  purchase: {
    title: 'Used Car Purchase',
    type: 'purchase',
    currentOffer: 650000,
    desiredOffer: 580000,
    walkAway: 610000,
    minAcceptable: 560000,
    maxDesired: 580000,
    batna: 'Found a similar car at ₹5.9 lakhs at another dealer',
    context: 'The car has minor scratches and needs service. I have cash ready to pay immediately.',
    strengths: 'Cash payment, competing quote, car has defects',
    deadline: 'Flexible',
    otherParty: 'Car Dealer',
    relationship: 'new',
  },
  subscription: {
    title: 'SaaS Subscription Renewal',
    type: 'subscription',
    currentOffer: 15000,
    desiredOffer: 9000,
    walkAway: 12000,
    minAcceptable: 9000,
    maxDesired: 9000,
    batna: 'Competitor offers similar features at ₹8,500/year',
    context: 'I have been a customer for 2 years. Usage dropped this year and I found a cheaper alternative.',
    strengths: 'Loyalty, competitor pricing, reduced usage',
    deadline: '5 days (renewal deadline)',
    otherParty: 'Customer Success Manager',
    relationship: 'ongoing',
  },
}

export const MOCK_ANALYSIS: NegotiationAnalysis = {
  negotiation_type: 'salary',
  opening_offer: 1050000,
  target_offer: 1000000,
  walk_away: 900000,
  batna: 920000,
  leverage_score: 82,
  acceptance_probability: 0.68,
  strengths: [
    'Competing offer from another top-tier company',
    'Strong technical skills in high demand',
    'Excellent performance history and references',
    'Specific domain expertise that is hard to replace',
  ],
  weaknesses: [
    'You may appear too eager if you respond immediately',
    'Limited seniority at current company',
    'Their offer is above market median for your city',
  ],
  best_arguments: [
    {
      text: 'I have a competing offer from a top-tier company at ₹9.2 LPA, and I\'d prefer to join your company if we can align on compensation.',
      strength: 'strong',
      reason: 'Creates urgency and validates your market value with concrete data.',
    },
    {
      text: 'Based on current market data for my role and experience level, ₹10 LPA aligns with the 75th percentile compensation.',
      strength: 'strong',
      reason: 'Uses objective market data to anchor negotiation on fact, not feeling.',
    },
    {
      text: 'My work on the distributed systems project reduced infrastructure costs by 23%. I can deliver similar impact here.',
      strength: 'medium',
      reason: 'Demonstrates concrete ROI beyond just skill possession.',
    },
  ],
  arguments_to_avoid: [
    {
      text: '₹8 LPA is simply not enough for my lifestyle.',
      reason: 'Personal financial needs are irrelevant to the employer — they care about your market value.',
    },
    {
      text: 'I really want to work here, so I\'ll accept whatever you offer.',
      reason: 'Destroys your leverage by signaling desperation and eliminating their incentive to negotiate.',
    },
  ],
  strategy: 'Open with ₹10.5 LPA to give yourself negotiating room to land at your target of ₹10 LPA. Lead with your competing offer as social proof of market value. If they resist, negotiate for a joining bonus or accelerated performance review at 6 months. Your walk-away is ₹9 LPA — your BATNA at ₹9.2 LPA is stronger, so never go below it.',
  recommended_counter_offer: 1000000,
  leverage_breakdown: [
    { factor: 'Market alternatives', score: 90 },
    { factor: 'Skills & expertise', score: 85 },
    { factor: 'Performance track record', score: 78 },
    { factor: 'Relationship strength', score: 60 },
    { factor: 'Time pressure', score: 70 },
    { factor: 'Company need for role', score: 88 },
  ],
  negotiation_summary: 'Your position is strong. You have a legitimate competing offer that validates your worth above their opening bid. Use anchoring to establish ₹10.5 LPA as the starting point, then negotiate down to your target of ₹10 LPA. Your BATNA (₹9.2 LPA) is above your walk-away, giving you true negotiating freedom.',
}

export const MOCK_OPPONENT_RESPONSES: Record<string, string[]> = {
  friendly: [
    "Thanks for sharing that! Let me see what I can do. Our budget is a bit tight, but I appreciate your transparency.",
    "That's a fair point. We value candidates like you. Let me speak with the team and come back to you.",
    "I understand your perspective. We're at ₹8.5 LPA right now — could we explore additional benefits?",
    "You make a strong case. I'll advocate for you internally. Can you give us until tomorrow?",
  ],
  professional: [
    "We appreciate the offer and understand your position. Our current budget for this role is ₹8.5 LPA.",
    "The compensation structure you've mentioned is above our standard range for this level.",
    "We're prepared to offer ₹8.75 LPA with a 6-month performance review.",
    "That's outside our current budget. However, we can discuss a signing bonus to bridge the gap.",
  ],
  firm: [
    "₹8.5 LPA is already at the top of our approved range for this position.",
    "We've assessed your profile and our offer is aligned with that assessment.",
    "We cannot go above ₹8.75 LPA. This is our final offer.",
    "Our compensation bands are set by HR policy. There's limited flexibility at this level.",
  ],
  aggressive: [
    "That's significantly above what we'd pay for someone at your experience level.",
    "We have other strong candidates we can move forward with if this doesn't work.",
    "₹10 LPA is unrealistic for this role. We're being very competitive at ₹8.5.",
    "I'd suggest reconsidering — candidates with your background typically start lower here.",
  ],
}

export const COACHING_RESPONSES = [
  {
    trigger: 'anchor',
    assessment: 'good' as const,
    feedback: 'Strong opening anchor. You set a high reference point.',
    suggestion: 'Now let them respond — silence is powerful after a first offer.',
  },
  {
    trigger: 'batna',
    assessment: 'good' as const,
    feedback: 'Excellent use of BATNA. You\'ve established a credible alternative.',
    suggestion: 'Follow up by asking what they can do to make their offer more competitive.',
  },
  {
    trigger: 'concede',
    assessment: 'improve' as const,
    feedback: 'You\'re conceding without requesting anything in return.',
    suggestion: 'Try: "I can move to ₹9.75 LPA if we can include a joining bonus of ₹50,000."',
  },
  {
    trigger: 'emotion',
    assessment: 'warning' as const,
    feedback: 'Emotional language weakens your position.',
    suggestion: 'Refocus on data: market rates, competing offers, and specific value you bring.',
  },
]

export function formatCurrency(amount: number, currency = '₹'): string {
  if (amount >= 10000000) return `${currency}${(amount / 10000000).toFixed(1)} Cr`
  if (amount >= 100000) return `${currency}${(amount / 100000).toFixed(1)} L`
  if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(0)}K`
  return `${currency}${amount.toLocaleString()}`
}

export function calculateScore(data: {
  targetAchieved: number
  concessions: number
  openingAnchor: number
  hasBatna: boolean
}): number {
  let score = 0
  score += Math.min(data.targetAchieved * 40, 40) // max 40
  score += Math.max(0, 20 - data.concessions * 4) // max 20
  score += data.hasBatna ? 20 : 5
  score += data.openingAnchor > 0 ? 20 : 0
  return Math.min(Math.round(score), 100)
}
