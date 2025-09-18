import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { generateInsights } from '@/lib/ai'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError, ExternalServiceError } from '@/lib/errors'

interface Email {
  id: string
  thread_id: string
  subject: string
  from_email: string
  to_email: string
  body: string
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    const { data: emails, error: emailsError } = await supabaseServer
      .from('emails')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(50)

    if (emailsError) {
      console.error('Error fetching emails:', emailsError)
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
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

    for (const [threadId, threadEmails] of threadGroups) {
      if (threadEmails.length < 2) continue

      const emailContext = threadEmails.map((email: Email) => ({
        subject: email.subject,
        from_email: email.from_email,
        to_email: email.to_email,
        body: email.body,
        timestamp: email.timestamp
      }))

      let insights
      try {
        insights = await generateInsights(emailContext)
      } catch (error) {
        throw new ExternalServiceError('Claude AI', 'Failed to generate insights')
      }

      for (const insight of insights) {
        const mostRecentEmail = threadEmails[0]
        
        const { error: insertError } = await supabaseServer
          .from('insights')
          .insert({
            email_id: mostRecentEmail.id,
            category: insight.category,
            summary: insight.summary,
            evidence: insight.evidence,
            suggested_action: insight.suggested_action,
            confidence: insight.confidence
          })

        if (insertError) {
          console.error('Error inserting insight:', insertError)
        } else {
          totalInsights++
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${totalInsights} insights from ${threadGroups.size} email threads`,
      insights: totalInsights
    })

  } catch (error) {
    const { statusCode, userMessage } = handleAPIError(error)
    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    )
  }
}