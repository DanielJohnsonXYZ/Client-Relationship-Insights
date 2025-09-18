import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getAnthropic } from '@/lib/anthropic'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError, createAPIError } from '@/lib/api-errors'
import { sanitizeForAI } from '@/lib/validation'
import { validateRequest, generateInsightsSchema } from '@/lib/request-validation'
import type { EmailRecord, InsightRecord, SupabaseResponse, SupabaseListResponse } from '@/types/database'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface InsightResult {
  category: 'Risk' | 'Upsell' | 'Alignment' | 'Note'
  summary: string
  evidence: string
  suggested_action: string
  confidence: number
}

async function generateInsights(emails: Array<{
  subject: string
  from_email: string
  to_email: string
  body: string
  timestamp: string
}>): Promise<InsightResult[]> {
  const anthropic = getAnthropic()
  
  // Limit emails for processing
  const sanitizedEmails = emails.slice(0, 10)
  
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
    logger.error('Failed to generate insights with AI', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    // Validate request body
    const body = await request.json().catch(() => ({}))
    const { forceRegenerate: _forceRegenerate } = validateRequest(generateInsightsSchema, body)
    
    const supabase = getSupabaseServer()

    const { data: emails, error: emailsError }: SupabaseListResponse<EmailRecord> = await supabase
      .from('emails')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(50)

    if (emailsError) {
      const errorMessage = `Failed to fetch emails from database: ${emailsError.message || 'Unknown database error'}`
      const errorCode = emailsError.code || 'DATABASE_ERROR'
      throw createAPIError(errorMessage, 500, errorCode)
    }

    if (!emails || emails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No emails found to analyze' 
      })
    }

    const threadGroups = new Map()
    
    for (const email of emails) {
      if (!threadGroups.has(email.thread_id)) {
        threadGroups.set(email.thread_id, [])
      }
      threadGroups.get(email.thread_id).push(email)
    }

    let totalInsights = 0

    for (const [, threadEmails] of threadGroups) {
      if (threadEmails.length < 2) continue

      const emailContext = threadEmails.map((email: EmailRecord) => ({
        subject: email.subject,
        from_email: email.from_email,
        to_email: email.to_email,
        body: email.body,
        timestamp: email.timestamp
      }))

      let insights: InsightResult[]
      try {
        insights = await generateInsights(emailContext)
      } catch (_error) {
        throw createAPIError('Failed to generate insights with AI', 503, 'AI_ERROR')
      }

      for (const insight of insights) {
        const mostRecentEmail = threadEmails[0]
        
        const { error: insertError } = await (supabase as any)
          .from('insights')
          .insert({
            email_id: mostRecentEmail.id!,
            category: insight.category,
            summary: insight.summary,
            evidence: insight.evidence,
            suggested_action: insight.suggested_action,
            confidence: insight.confidence
          })

        if (insertError) {
          logger.warn('Failed to insert insight', { error: insertError, email_id: mostRecentEmail.id })
        } else {
          totalInsights++
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Generated ${totalInsights} new insights` 
    })
  } catch (error) {
    return handleAPIError(error)
  }
}