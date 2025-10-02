import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { createMessageWithRetry } from '@/lib/anthropic'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError, createAPIError } from '@/lib/api-errors'
import { sanitizeForAI } from '@/lib/validation'
import { validateRequest, generateInsightsSchema } from '@/lib/request-validation'
import { validateInsights } from '@/lib/insight-validation'
import type { EmailRecord, InsightRecord, ClientRecord, SupabaseResponse, SupabaseListResponse } from '@/types/database'
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
  client_name?: string
  client_company?: string
  current_project?: string
}>): Promise<{ insights: InsightResult[], rawOutput: string }> {
  // Limit emails for processing
  const sanitizedEmails = emails.slice(0, 10)
  
  // Group emails by client and create context
  const clientGroups = new Map<string, any[]>()
  sanitizedEmails.forEach(email => {
    const clientKey = email.client_name || 'Unknown Client'
    if (!clientGroups.has(clientKey)) {
      clientGroups.set(clientKey, [])
    }
    clientGroups.get(clientKey)!.push(email)
  })

  const emailContext = Array.from(clientGroups.entries()).map(([clientName, clientEmails]) => {
    const clientInfo = clientEmails[0]
    const clientHeader = clientInfo.client_name ? 
      `CLIENT: ${clientInfo.client_name}${clientInfo.client_company ? ` (${clientInfo.client_company})` : ''}${clientInfo.current_project ? ` - Project: ${clientInfo.current_project}` : ''}` : 
      'UNIDENTIFIED CLIENT'
    
    const emailsForClient = clientEmails.map((email, index) => 
      `EMAIL ${index + 1}:
From: ${sanitizeForAI(email.from_email)}
To: ${sanitizeForAI(email.to_email)}
Subject: ${sanitizeForAI(email.subject)}
Date: ${email.timestamp}
Body: ${sanitizeForAI(email.body)}
---`
    ).join('\n\n')
    
    return `${clientHeader}\n${emailsForClient}`
  }).join('\n\n=== NEW CLIENT ===\n\n')

  const prompt = `You are an AI assistant that analyzes client relationship communications for freelancers and consultants. Your goal is to extract meaningful, actionable insights about client relationships, project status, and business opportunities.

Analyze the following email communications and provide insights that help understand:
- Client satisfaction and relationship health
- Project progress, blockers, and risks
- Business opportunities (upsells, renewals, referrals)
- Important deadlines, decisions, and action items
- Communication patterns and relationship dynamics
- Any other relevant business insights

EMAIL COMMUNICATIONS:
${emailContext}

BE FLEXIBLE AND INSIGHTFUL: Don't just look for predefined categories. Identify whatever seems important or noteworthy about these client relationships. Focus on actionable insights that would help a business owner manage their client relationships better.

For each insight you identify, provide a JSON object with:
- category: Must be exactly one of: "Risk", "Upsell", "Alignment", or "Note"
- summary: A clear, actionable summary of the insight
- evidence: A direct quote or reference from the email that supports this insight
- suggested_action: A specific, practical action the user should take
- confidence: A number between 0 and 1 indicating your confidence in this insight

Return your response as a JSON array of insights. Focus on quality over quantity - provide insights that are genuinely valuable and actionable.

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

  // Log AI input for debugging
  logger.info('🤖 AI Input', { 
    promptLength: prompt.length,
    emailContextLength: emailContext.length,
    clientCount: clientGroups.size,
    totalEmails: emails.length,
    prompt: process.env.NODE_ENV === 'development' ? prompt : '[REDACTED IN PRODUCTION]'
  })

  try {
    const message = await createMessageWithRetry({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = message.content[0]
    if (content.type === 'text') {
      const rawOutput = content.text
      
      // Log AI output for debugging
      logger.info('🤖 AI Output', { 
        rawOutputLength: rawOutput.length,
        rawOutput: process.env.NODE_ENV === 'development' ? rawOutput : '[REDACTED IN PRODUCTION]'
      })
      
      const jsonStart = content.text.indexOf('[')
      const jsonEnd = content.text.lastIndexOf(']') + 1
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          const jsonString = content.text.slice(jsonStart, jsonEnd)
          const rawInsights = JSON.parse(jsonString)
          
          // Validate and sanitize insights using Zod schema
          const validatedInsights = validateInsights(Array.isArray(rawInsights) ? rawInsights : [rawInsights])
          
          logger.info('🤖 AI Insights Parsed and Validated', { 
            rawInsightCount: Array.isArray(rawInsights) ? rawInsights.length : 1,
            validInsightCount: validatedInsights.length,
            categories: validatedInsights.map(i => i.category),
            validatedInsights: process.env.NODE_ENV === 'development' ? validatedInsights : '[REDACTED IN PRODUCTION]'
          })
          
          if (validatedInsights.length === 0) {
            logger.warn('No valid insights after validation', { rawInsights })
          }
          
          return { insights: validatedInsights, rawOutput }
        } catch (parseError) {
          logger.warn('Failed to parse JSON from AI response, storing raw output', { parseError, jsonString: content.text.slice(jsonStart, jsonEnd) })
          return { insights: [], rawOutput }
        }
      }
      
      logger.warn('No JSON found in AI response', { rawOutput })
      return { insights: [], rawOutput }
    }

    logger.warn('No text content received from AI', { contentType: content.type })
    return { insights: [], rawOutput: 'No text content received from AI' }
  } catch (error) {
    logger.error('Failed to generate insights with AI', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    // Validate request body
    const body = await request.json().catch(() => ({}))
    const { forceRegenerate: _forceRegenerate } = validateRequest(generateInsightsSchema, body)
    
    const supabase = getSupabaseServer()

    // Fetch emails - removed is_automated filter since column doesn't exist yet
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
        success: false,
        message: 'No emails found to analyze',
        recommendations: [
          '📧 Sync your emails first by going to the dashboard and clicking "Sync Gmail"',
          '⏰ Make sure you have recent client communications (emails from the past 30 days work best)',
          '🔑 Check that your Gmail permissions are properly configured',
          '📱 If you communicate with clients on other platforms (Slack, WhatsApp), consider adding those as well',
          '💡 For best results, we recommend having at least 5-10 recent client emails to analyze'
        ],
        next_steps: [
          {
            action: 'sync_emails',
            label: 'Sync Gmail',
            url: '/dashboard',
            description: 'Import your recent emails for analysis'
          },
          {
            action: 'check_integrations',
            label: 'Add More Platforms',
            url: '/integrations',
            description: 'Connect additional communication platforms'
          }
        ]
      }, { status: 404 })
    }

    logger.info('Analyzing emails for insights', { emailCount: emails.length })

    // Check if we have sufficient emails for meaningful analysis
    if (emails.length < 3) {
      logger.warn('Limited emails for analysis - results may be less comprehensive', { count: emails.length })
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
      // Process all emails, including single emails that can contain valuable insights

      // Get client information if available
      const firstEmail = threadEmails[0]
      let clientName: string | undefined
      let clientCompany: string | undefined
      let currentProject: string | undefined
      
      if (firstEmail.client_id) {
        const { data: client } = await (supabase as any)
          .from('clients')
          .select('name, company, current_project')
          .eq('id', firstEmail.client_id)
          .single()
        
        if (client) {
          clientName = client.name
          clientCompany = client.company
          currentProject = client.current_project
        }
      }

      const emailContext = threadEmails.map((email: EmailRecord) => ({
        subject: email.subject,
        from_email: email.from_email,
        to_email: email.to_email,
        body: email.body,
        timestamp: email.timestamp,
        client_name: clientName,
        client_company: clientCompany,
        current_project: currentProject
      }))

      let result: { insights: InsightResult[], rawOutput: string }
      try {
        result = await generateInsights(emailContext)
      } catch (_error) {
        throw createAPIError('Failed to generate insights with AI', 503, 'AI_ERROR')
      }

      const { insights, rawOutput } = result
      const mostRecentEmail = threadEmails[0]

      // If we have structured insights, store them individually with upsert to prevent duplicates
      if (insights.length > 0) {
        for (const insight of insights) {
          // First, check if insight already exists for this email and category
          const { data: existingInsights } = await (supabase as any)
            .from('insights')
            .select('id')
            .eq('email_id', mostRecentEmail.id!)
            .eq('category', insight.category)
            .limit(1)

          if (existingInsights && existingInsights.length > 0) {
            // Update existing insight (don't overwrite created_at)
            const { error: updateError } = await (supabase as any)
              .from('insights')
              .update({
                client_id: mostRecentEmail.client_id || null,
                summary: insight.summary,
                evidence: insight.evidence,
                suggested_action: insight.suggested_action,
                confidence: insight.confidence,
                raw_output: rawOutput
              })
              .eq('id', existingInsights[0].id)

            if (updateError) {
              logger.warn('Failed to update existing insight', { error: updateError, email_id: mostRecentEmail.id })
            } else {
              totalInsights++
            }
          } else {
            // Insert new insight
            const { error: insertError } = await (supabase as any)
              .from('insights')
              .insert({
                email_id: mostRecentEmail.id!,
                client_id: mostRecentEmail.client_id || null,
                category: insight.category,
                summary: insight.summary,
                evidence: insight.evidence,
                suggested_action: insight.suggested_action,
                confidence: insight.confidence,
                raw_output: rawOutput
              })

            if (insertError) {
              logger.warn('Failed to insert insight', { error: insertError, email_id: mostRecentEmail.id })
            } else {
              totalInsights++
            }
          }
        }
      } else {
        // If no structured insights but we have raw output, store just the raw output
        // Check if any insight exists for this email first
        const { data: existingInsights } = await (supabase as any)
          .from('insights')
          .select('id')
          .eq('email_id', mostRecentEmail.id!)
          .limit(1)

        if (existingInsights && existingInsights.length > 0) {
          // Update existing insight with new raw output
          const { error: updateError } = await (supabase as any)
            .from('insights')
            .update({
              raw_output: rawOutput,
              created_at: new Date().toISOString()
            })
            .eq('id', existingInsights[0].id)

          if (updateError) {
            logger.warn('Failed to update raw insight', { error: updateError, email_id: mostRecentEmail.id })
          } else {
            totalInsights++
          }
        } else {
          // Insert new raw insight
          const { error: insertError } = await (supabase as any)
            .from('insights')
            .insert({
              email_id: mostRecentEmail.id!,
              raw_output: rawOutput
            })

          if (insertError) {
            logger.warn('Failed to insert raw insight', { error: insertError, email_id: mostRecentEmail.id })
          } else {
            totalInsights++
          }
        }
      }
    }

    // Provide recommendations if insights are limited
    const response: any = { 
      success: true, 
      message: `Generated ${totalInsights} new insights`,
      insights_count: totalInsights,
      emails_analyzed: emails.length
    }

    if (totalInsights === 0) {
      response.recommendations = [
        '📧 Try syncing more recent emails - communication patterns may be harder to detect in older emails',
        '🎯 Look for emails with clients asking questions, providing feedback, or discussing projects',
        '📝 Check if your emails contain substantive conversations rather than just confirmations',
        '🔄 Consider syncing emails from the past 2-4 weeks when client interactions are most active',
        '📱 Add other communication platforms where you have client conversations'
      ]
      response.next_steps = [
        {
          action: 'sync_more_emails',
          label: 'Sync More Recent Emails',
          description: 'Try extending the sync period to capture more client conversations'
        },
        {
          action: 'check_email_types',
          label: 'Review Email Types',
          description: 'Ensure you are analyzing emails with substantial client interactions'
        }
      ]
    } else if (totalInsights < 3) {
      response.suggestions = [
        '✨ For richer insights, try syncing emails from multiple time periods',
        '🎯 Focus on emails with detailed client feedback and project discussions',
        '📊 More diverse client communications will provide better business intelligence'
      ]
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleAPIError(error)
  }
}