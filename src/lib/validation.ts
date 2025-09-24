import { z } from 'zod'

// Email validation schema
export const emailSchema = z.object({
  gmail_id: z.string().min(1).max(255),
  thread_id: z.string().min(1).max(255),
  from_email: z.string().email().max(255),
  to_email: z.string().email().max(255),
  subject: z.string().max(500).optional(),
  body: z.string().max(50000),
  timestamp: z.string().datetime()
})

// Insight validation schema
export const insightSchema = z.object({
  category: z.enum(['Risk', 'Upsell', 'Alignment', 'Note']),
  summary: z.string().min(10).max(500),
  evidence: z.string().min(5).max(1000),
  suggested_action: z.string().min(10).max(500),
  confidence: z.number().min(0).max(1)
})

// Feedback validation schema
export const feedbackSchema = z.object({
  insightId: z.string().uuid(),
  feedback: z.enum(['positive', 'negative'])
})

// Validation functions
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export function validateFeedback(feedback: string): feedback is 'positive' | 'negative' {
  return ['positive', 'negative'].includes(feedback)
}

export function sanitizeEmailContent(content: string): string {
  if (!content) return ''
  
  // Remove potential XSS vectors
  const sanitized = content
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    
  // Limit length
  return sanitized.substring(0, 50000)
}

export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text) return ''
  
  return text
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, maxLength)
}

export function parseEmailFromHeader(headerValue: string): string {
  // Extract email from headers like "Name <email@domain.com>" or just "email@domain.com"
  const match = headerValue.match(/<([^>]+)>/) || headerValue.match(/([^\s<>]+@[^\s<>]+)/)
  return match ? match[1].trim() : headerValue.trim()
}

export function validateEmailAddress(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

export function validateGmailId(gmailId: string): boolean {
  // Gmail IDs are typically alphanumeric with some special characters
  const gmailIdRegex = /^[a-zA-Z0-9_-]+$/
  return gmailIdRegex.test(gmailId) && gmailId.length >= 1 && gmailId.length <= 255
}

// Rate limiting helpers
export function createRateLimitKey(userId: string, endpoint: string): string {
  return `rate_limit:${userId}:${endpoint}`
}

// Input sanitization for AI prompts
export function sanitizeForAI(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove HTML
    .replace(/\x00/g, '') // Remove null bytes
    .replace(/```/g, '') // Remove code blocks that could be prompt injections
    .replace(/\[INST\]/gi, '') // Remove instruction tokens
    .replace(/\[\/INST\]/gi, '') // Remove instruction end tokens
    .replace(/SYSTEM:/gi, '') // Remove system prompts
    .replace(/USER:/gi, '') // Remove user prompts
    .replace(/ASSISTANT:/gi, '') // Remove assistant prompts
    .replace(/Human:/gi, '') // Remove human prompts
    .replace(/AI:/gi, '') // Remove AI prompts
    .trim()
    .substring(0, 10000) // Limit AI input size
}