import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError, createAPIError } from '@/lib/api-errors'
import { validateRequest } from '@/lib/request-validation'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  domain: z.string().optional(),
  status: z.enum(['active', 'prospective', 'at_risk', 'completed', 'inactive']),
  relationship_health: z.number().min(1).max(5),
  current_project: z.string().optional(),
  notes: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = getSupabaseServer()

    const { data: clients, error } = await (supabase as any)
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw createAPIError(`Failed to fetch clients: ${error.message}`, 500, 'DATABASE_ERROR')
    }

    return NextResponse.json({ clients: clients || [] })
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json()
    const clientData = validateRequest(clientSchema, body)

    const supabase = getSupabaseServer()

    // Clean up empty strings
    const cleanedData = {
      ...clientData,
      email: clientData.email || null,
      company: clientData.company || null,
      domain: clientData.domain || null,
      current_project: clientData.current_project || null,
      notes: clientData.notes || null
    }

    const { data, error } = await (supabase as any)
      .from('clients')
      .insert({
        user_id: user.id,
        ...cleanedData
      })
      .select()
      .single()

    if (error) {
      throw createAPIError(`Failed to create client: ${error.message}`, 500, 'DATABASE_ERROR')
    }

    return NextResponse.json({ client: data })
  } catch (error) {
    return handleAPIError(error)
  }
}