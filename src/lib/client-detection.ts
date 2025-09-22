import { getSupabaseServer } from '@/lib/supabase-server'
import { getAnthropic } from '@/lib/anthropic'
import { sanitizeForAI } from '@/lib/validation'
import { logger } from '@/lib/logger'
import type { EmailRecord, ClientRecord, SupabaseListResponse } from '@/types/database'

interface ClientDetectionResult {
  client_id: string | null
  confidence: number
  reasoning: string
}

// Patterns for detecting automated emails
const AUTOMATED_EMAIL_PATTERNS = [
  /no-?reply/i,
  /noreply/i,
  /notifications?@/i,
  /alerts?@/i,
  /do-?not-?reply/i,
  /automated?@/i,
  /system@/i,
  /admin@/i,
  /support@.*\.(atlassian|jira|confluence|slack|github|gitlab)/i,
  /.*@.*\.(calendar|cal)\.google\.com/i,
  /@calendly\./i,
  /@zoom\.us/i,
  /@.*\.zoom\.us/i,
  /calendar-notification/i,
  /meeting-reminder/i
]

const AUTOMATED_SUBJECT_PATTERNS = [
  /^(re: )?(fwd: )?(calendar|meeting|event|appointment)/i,
  /reminder/i,
  /notification/i,
  /automated/i,
  /out of office/i,
  /delivery (status|report)/i,
  /unsubscribe/i,
  /newsletter/i
]

/**
 * Detects if an email is automated/system-generated
 */
export function isAutomatedEmail(email: { from_email: string; subject?: string; body?: string }): boolean {
  // Check sender email patterns
  const isAutomatedSender = AUTOMATED_EMAIL_PATTERNS.some(pattern => 
    pattern.test(email.from_email)
  )
  
  // Check subject patterns
  const isAutomatedSubject = AUTOMATED_SUBJECT_PATTERNS.some(pattern => 
    pattern.test(email.subject || '')
  )
  
  // Check for common automated content patterns
  const hasAutomatedContent = email.body && (
    email.body.includes('This is an automated message') ||
    email.body.includes('Do not reply to this email') ||
    email.body.includes('Please do not reply') ||
    email.body.includes('unsubscribe') ||
    email.body.toLowerCase().includes('automatically generated')
  )
  
  return isAutomatedSender || isAutomatedSubject || !!hasAutomatedContent
}

/**
 * Detects which client an email relates to using multiple strategies
 */
export async function detectEmailClient(
  email: { from_email: string; to_email: string; subject?: string; body: string; id?: string }, 
  userId: string
): Promise<ClientDetectionResult> {
  try {
    const supabase = getSupabaseServer()
    
    // Get all clients for the user
    const { data: clients, error }: SupabaseListResponse<ClientRecord> = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
    
    if (error || !clients || clients.length === 0) {
      return { client_id: null, confidence: 0, reasoning: 'No clients found' }
    }
    
    // Strategy 1: Direct email match
    const directMatch = findDirectEmailMatch(email, clients)
    if (directMatch) {
      return directMatch
    }
    
    // Strategy 2: Domain match
    const domainMatch = findDomainMatch(email, clients)
    if (domainMatch) {
      return domainMatch
    }
    
    // Strategy 3: AI-based content analysis
    const aiMatch = await performAIClientDetection(email, clients)
    if (aiMatch) {
      return aiMatch
    }
    
    return { client_id: null, confidence: 0, reasoning: 'No client match found' }
    
  } catch (error) {
    logger.error('Error in client detection', { error, emailId: email.id })
    return { client_id: null, confidence: 0, reasoning: 'Detection error' }
  }
}

/**
 * Strategy 1: Find clients by exact email address match
 */
function findDirectEmailMatch(
  email: { from_email: string; to_email: string }, 
  clients: ClientRecord[]
): ClientDetectionResult | null {
  for (const client of clients) {
    if (client.email) {
      // Check if email is from or to this client
      if (email.from_email.toLowerCase() === client.email.toLowerCase() ||
          email.to_email.toLowerCase() === client.email.toLowerCase()) {
        return {
          client_id: client.id!,
          confidence: 0.95,
          reasoning: `Direct email match: ${client.email}`
        }
      }
    }
  }
  return null
}

/**
 * Strategy 2: Find clients by domain match
 */
function findDomainMatch(
  email: { from_email: string; to_email: string }, 
  clients: ClientRecord[]
): ClientDetectionResult | null {
  const getEmailDomain = (emailAddr: string) => {
    const match = emailAddr.match(/@(.+)$/)
    return match ? match[1].toLowerCase() : null
  }
  
  const fromDomain = getEmailDomain(email.from_email)
  const toDomain = getEmailDomain(email.to_email)
  
  for (const client of clients) {
    if (client.domain) {
      const clientDomain = client.domain.toLowerCase()
      
      if ((fromDomain && fromDomain === clientDomain) ||
          (toDomain && toDomain === clientDomain)) {
        return {
          client_id: client.id!,
          confidence: 0.85,
          reasoning: `Domain match: ${clientDomain}`
        }
      }
    }
    
    // Also check if client email domain matches
    if (client.email) {
      const clientEmailDomain = getEmailDomain(client.email)
      if (clientEmailDomain && 
          ((fromDomain && fromDomain === clientEmailDomain) ||
           (toDomain && toDomain === clientEmailDomain))) {
        return {
          client_id: client.id!,
          confidence: 0.80,
          reasoning: `Client email domain match: ${clientEmailDomain}`
        }
      }
    }
  }
  
  return null
}

/**
 * Strategy 3: AI-based client detection using email content
 */
async function performAIClientDetection(
  email: { from_email: string; to_email: string; subject?: string; body: string }, 
  clients: ClientRecord[]
): Promise<ClientDetectionResult | null> {
  try {
    const anthropic = getAnthropic()
    
    // Prepare client information for AI
    const clientsInfo = clients.map(client => ({
      id: client.id,
      name: client.name,
      company: client.company || 'Unknown',
      email: client.email || 'Not provided',
      domain: client.domain || 'Not provided',
      project: client.current_project || 'Not specified'
    }))
    
    const prompt = `You are an AI that helps identify which client an email relates to. Analyze the email content and determine which client it's most likely about.

EMAIL TO ANALYZE:
From: ${sanitizeForAI(email.from_email)}
To: ${sanitizeForAI(email.to_email)}
Subject: ${sanitizeForAI(email.subject || '')}
Body: ${sanitizeForAI(email.body).substring(0, 1000)}

AVAILABLE CLIENTS:
${clientsInfo.map((client, index) => 
  `${index + 1}. ${client.name} (${client.company})
     Email: ${client.email}
     Domain: ${client.domain}
     Current Project: ${client.project}`
).join('\n\n')}

Analyze the email and determine which client it relates to based on:
- Email addresses and domains
- Names mentioned in the content
- Company names referenced
- Project details discussed
- Context clues in the conversation

Respond with a JSON object:
{
  "client_id": "client_id_here_or_null",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of why this client was selected"
}

Only return high-confidence matches (>0.6). If uncertain, return null for client_id.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })
    
    const content = message.content[0]
    if (content.type === 'text') {
      try {
        const jsonStart = content.text.indexOf('{')
        const jsonEnd = content.text.lastIndexOf('}') + 1
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonString = content.text.slice(jsonStart, jsonEnd)
          const result = JSON.parse(jsonString)
          
          // Validate the result
          if (result.client_id && result.confidence > 0.6) {
            // Verify the client_id exists in our list
            const clientExists = clients.some(c => c.id === result.client_id)
            if (clientExists) {
              return {
                client_id: result.client_id,
                confidence: Math.max(0.6, Math.min(0.85, result.confidence)), // Cap AI confidence
                reasoning: `AI analysis: ${result.reasoning}`
              }
            }
          }
        }
      } catch (parseError) {
        logger.warn('Failed to parse AI client detection response', { parseError })
      }
    }
    
    return null
    
  } catch (error) {
    logger.error('AI client detection failed', { error })
    return null
  }
}

/**
 * Batch process emails to detect clients and update database
 */
export async function batchUpdateEmailClients(userId: string, emailIds?: string[]): Promise<number> {
  try {
    const supabase = getSupabaseServer()
    
    // Get emails that need client detection
    let query = supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .is('client_id', null)
    
    if (emailIds) {
      query = query.in('id', emailIds)
    }
    
    const { data: emails, error }: SupabaseListResponse<EmailRecord> = await query.limit(50)
    
    if (error || !emails) {
      logger.error('Failed to fetch emails for client detection', { error })
      return 0
    }
    
    let updatedCount = 0
    
    for (const email of emails) {
      // Detect if email is automated
      const automated = isAutomatedEmail(email)
      
      // Detect client
      const detection = await detectEmailClient(email, userId)
      
      // Update email record
      const { error: updateError } = await (supabase as any)
        .from('emails')
        .update({
          client_id: detection.client_id,
          is_automated: automated
        })
        .eq('id', email.id!)
      
      if (!updateError) {
        updatedCount++
        logger.info('Updated email client detection', {
          emailId: email.id,
          clientId: detection.client_id,
          confidence: detection.confidence,
          reasoning: detection.reasoning,
          isAutomated: automated
        })
      } else {
        logger.warn('Failed to update email client detection', {
          emailId: email.id,
          error: updateError
        })
      }
    }
    
    return updatedCount
    
  } catch (error) {
    logger.error('Batch client detection failed', { error })
    return 0
  }
}