import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError, createAPIError } from '@/lib/api-errors'
import { validateRequest } from '@/lib/request-validation'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const onboardingSchema = z.object({
  businessType: z.string().min(1),
  services: z.array(z.string()).min(1),
  clientTypes: z.array(z.string()).min(1),
  teamSize: z.string().min(1),
  primaryGoals: z.array(z.string()).min(1)
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json()
    const onboardingData = validateRequest(onboardingSchema, body)

    const supabase = getSupabaseServer()

    // Upsert user profile
    const { error } = await (supabase as any)
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        business_type: onboardingData.businessType,
        services: onboardingData.services,
        client_types: onboardingData.clientTypes,
        team_size: onboardingData.teamSize,
        primary_goals: onboardingData.primaryGoals,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) {
      throw createAPIError(`Failed to save onboarding data: ${error.message}`, 500, 'DATABASE_ERROR')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = getSupabaseServer()

    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw createAPIError(`Failed to fetch user profile: ${error.message}`, 500, 'DATABASE_ERROR')
    }

    return NextResponse.json({ profile: data || null })
  } catch (error) {
    return handleAPIError(error)
  }
}