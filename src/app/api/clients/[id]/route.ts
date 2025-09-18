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
  company: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  domain: z.string().optional().nullable(),
  status: z.enum(['active', 'prospective', 'at_risk', 'completed', 'inactive']),
  relationship_health: z.number().min(1).max(5),
  current_project: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json()
    const clientData = validateRequest(clientSchema, body)
    // clientId already extracted above

    const supabase = getSupabaseServer()

    // Verify client ownership
    const { data: existingClient, error: fetchError } = await (supabase as any)
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingClient) {
      throw createAPIError('Client not found or access denied', 404, 'NOT_FOUND')
    }

    // Clean up empty strings
    const cleanedData = {
      ...clientData,
      email: clientData.email || null,
      company: clientData.company || null,
      domain: clientData.domain || null,
      current_project: clientData.current_project || null,
      notes: clientData.notes || null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await (supabase as any)
      .from('clients')
      .update(cleanedData)
      .eq('id', clientId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw createAPIError(`Failed to update client: ${error.message}`, 500, 'DATABASE_ERROR')
    }

    return NextResponse.json({ client: data })
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  try {
    const user = await getAuthenticatedUser()
    // clientId already extracted above

    const supabase = getSupabaseServer()

    const { error } = await (supabase as any)
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', user.id)

    if (error) {
      throw createAPIError(`Failed to delete client: ${error.message}`, 500, 'DATABASE_ERROR')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAPIError(error)
  }
}