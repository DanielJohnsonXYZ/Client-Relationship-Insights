import { z } from 'zod'

// Zod schema for validating LLM-generated insights
export const insightSchema = z.object({
  category: z.enum(['Risk', 'Upsell', 'Alignment', 'Note']),
  summary: z.string().min(10).max(500, 'Summary must be between 10 and 500 characters'),
  evidence: z.string().min(5).max(1000, 'Evidence must be between 5 and 1000 characters'),
  suggested_action: z.string().min(5).max(500, 'Suggested action must be between 5 and 500 characters'),
  confidence: z.number().min(0).max(1, 'Confidence must be between 0 and 1')
})

export type ValidatedInsight = z.infer<typeof insightSchema>

export function validateInsight(rawInsight: any): ValidatedInsight | null {
  try {
    // Normalize confidence if it's a string
    if (typeof rawInsight.confidence === 'string') {
      rawInsight.confidence = parseFloat(rawInsight.confidence)
    }
    
    // Truncate fields that are too long
    if (rawInsight.summary && rawInsight.summary.length > 500) {
      rawInsight.summary = rawInsight.summary.substring(0, 497) + '...'
    }
    
    if (rawInsight.evidence && rawInsight.evidence.length > 1000) {
      rawInsight.evidence = rawInsight.evidence.substring(0, 997) + '...'
    }
    
    if (rawInsight.suggested_action && rawInsight.suggested_action.length > 500) {
      rawInsight.suggested_action = rawInsight.suggested_action.substring(0, 497) + '...'
    }
    
    return insightSchema.parse(rawInsight)
  } catch (error) {
    console.error('Invalid insight from LLM:', error, rawInsight)
    return null
  }
}

export function validateInsights(rawInsights: any[]): ValidatedInsight[] {
  const validInsights: ValidatedInsight[] = []
  
  for (const rawInsight of rawInsights) {
    const validated = validateInsight(rawInsight)
    if (validated) {
      validInsights.push(validated)
    }
  }
  
  return validInsights
}