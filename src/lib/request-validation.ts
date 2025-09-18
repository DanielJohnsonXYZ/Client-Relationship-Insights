import { z } from 'zod'

export const syncEmailsSchema = z.object({
  days: z.number().min(1).max(30).optional().default(7)
})

export const generateInsightsSchema = z.object({
  forceRegenerate: z.boolean().optional().default(false)
})

export const feedbackSchema = z.object({
  insightId: z.string().uuid(),
  rating: z.number().min(1).max(5)
})

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.issues.map(e => e.message).join(', ')}`)
    }
    throw new Error('Invalid request data')
  }
}