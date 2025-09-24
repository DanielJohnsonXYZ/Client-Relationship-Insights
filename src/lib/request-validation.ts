import { z } from 'zod'
import { createAPIError } from './api-errors'

export const syncEmailsSchema = z.object({
  days: z.number().min(1).max(30).optional().default(7)
})

export const generateInsightsSchema = z.object({
  forceRegenerate: z.boolean().optional().default(false)
})

export const feedbackSchema = z.object({
  insightId: z.string().uuid(),
  feedback: z.enum(['positive', 'negative'])
})

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = `Validation failed: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      throw createAPIError(message, 400, 'VALIDATION_ERROR')
    }
    throw createAPIError('Invalid request data', 400, 'INVALID_REQUEST')
  }
}