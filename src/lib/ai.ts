import Anthropic from '@anthropic-ai/sdk'
import { sanitizeForAI } from './validation'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface EmailContext {
  subject: string
  from_email: string
  to_email: string
  body: string
  timestamp: string
}

export interface InsightResult {
  category: 'Risk' | 'Upsell' | 'Alignment' | 'Note'
  summary: string
  evidence: string
  suggested_action: string
  confidence: number
}

export async function generateInsights(emails: EmailContext[]): Promise<InsightResult[]> {
  // Validate and sanitize email context
  const sanitizedEmails = emails.slice(0, 10) // Limit to 10 emails per thread
  
  const emailContext = sanitizedEmails.map((email, index) => 
    `EMAIL ${index + 1}:
From: ${sanitizeForAI(email.from_email)}
To: ${sanitizeForAI(email.to_email)}
Subject: ${sanitizeForAI(email.subject)}
Date: ${email.timestamp}
Body: ${sanitizeForAI(email.body)}
---`
  ).join('\n\n')

  const prompt = `You are an AI assistant that analyzes client communications for freelancers and contractors. Analyze the following email thread and identify insights that fall into these categories:

1. **Risk** - Signs of client dissatisfaction, project delays, budget concerns, scope creep, or relationship issues
2. **Upsell** - Opportunities for additional services, expanded scope, or premium offerings
3. **Alignment** - Misunderstandings, unclear requirements, or communication gaps that need clarification
4. **Note** - Important information, deadlines, decisions, or key relationship updates

EMAIL THREAD:
${emailContext}

For each insight you identify, provide a JSON object with:
- category: One of "Risk", "Upsell", "Alignment", or "Note"
- summary: A concise 1-2 sentence summary of the insight
- evidence: A direct quote from the email that supports this insight
- suggested_action: A specific action the freelancer should take
- confidence: A number between 0 and 1 indicating your confidence in this insight

Return your response as a JSON array of insights. Only return insights that are clearly supported by the email content. Aim for 1-5 insights per thread.

Example format:
[
  {
    "category": "Risk",
    "summary": "Client expressing budget concerns about project scope",
    "evidence": "I'm worried the costs are getting too high for what we initially discussed",
    "suggested_action": "Schedule a call to discuss budget constraints and potential scope adjustments",
    "confidence": 0.85
  }
]`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = message.content[0]
    if (content.type === 'text') {
      const jsonStart = content.text.indexOf('[')
      const jsonEnd = content.text.lastIndexOf(']') + 1
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = content.text.slice(jsonStart, jsonEnd)
        const insights = JSON.parse(jsonString)
        return insights
      }
    }

    return []
  } catch (error) {
    console.error('Error generating insights:', error)
    return []
  }
}