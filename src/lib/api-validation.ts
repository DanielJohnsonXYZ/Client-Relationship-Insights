import { z } from 'zod'
import { logger } from './logger'

/**
 * Anthropic API response validation schemas
 */
export const anthropicMessageSchema = z.object({
  id: z.string(),
  type: z.literal('message'),
  role: z.literal('assistant'),
  content: z.array(
    z.object({
      type: z.string(),
      text: z.string().optional(),
    })
  ),
  model: z.string(),
  stop_reason: z.string().nullable(),
  stop_sequence: z.string().nullable(),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
  }),
})

export type AnthropicMessage = z.infer<typeof anthropicMessageSchema>

/**
 * Gmail API response validation schemas
 */
export const gmailMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  payload: z
    .object({
      headers: z.array(
        z.object({
          name: z.string(),
          value: z.string(),
        })
      ),
      body: z
        .object({
          data: z.string().optional(),
        })
        .optional(),
      parts: z.array(z.any()).optional(),
    })
    .optional(),
})

export type GmailMessage = z.infer<typeof gmailMessageSchema>

export const gmailListResponseSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string(),
        threadId: z.string().optional(),
      })
    )
    .optional(),
  resultSizeEstimate: z.number().optional(),
})

export type GmailListResponse = z.infer<typeof gmailListResponseSchema>

/**
 * Supabase error schema
 */
export const supabaseErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.string().optional(),
  hint: z.string().optional(),
})

/**
 * Validate and parse external API responses with error handling
 */
export function validateExternalResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  source: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(`Invalid response from ${source}`, error, {
        errors: error.errors,
        receivedData: JSON.stringify(data).substring(0, 500),
      })

      throw new Error(
        `Invalid response from ${source}: ${error.errors.map(e => e.message).join(', ')}`
      )
    }

    throw error
  }
}

/**
 * Safe parser that returns success/error result instead of throwing
 */
export function safeParseExternalResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  source: string
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  logger.warn(`Failed to parse response from ${source}`, {
    errors: result.error.errors,
    receivedData: JSON.stringify(data).substring(0, 500),
  })

  return {
    success: false,
    error: result.error.errors.map(e => e.message).join(', '),
  }
}

/**
 * Validate Anthropic API response
 */
export function validateAnthropicResponse(data: unknown): AnthropicMessage {
  return validateExternalResponse(anthropicMessageSchema, data, 'Anthropic API')
}

/**
 * Validate Gmail API message
 */
export function validateGmailMessage(data: unknown): GmailMessage {
  return validateExternalResponse(gmailMessageSchema, data, 'Gmail API')
}

/**
 * Validate Gmail API list response
 */
export function validateGmailListResponse(data: unknown): GmailListResponse {
  return validateExternalResponse(gmailListResponseSchema, data, 'Gmail API')
}

/**
 * Type guard for Supabase errors
 */
export function isSupabaseError(error: unknown): error is { message: string; code?: string } {
  if (!error || typeof error !== 'object') return false

  const result = supabaseErrorSchema.safeParse(error)
  return result.success
}
