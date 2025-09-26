import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseServer } from '@/lib/supabase-server'
import { handleAPIError } from '@/lib/api-errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: List user's Gmail accounts
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseServer()

    const { data: accounts, error } = await (supabase as any)
      .from('gmail_accounts')
      .select(`
        id,
        gmail_address,
        account_label,
        is_active,
        created_at
      `)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch Gmail accounts: ${error.message}`)
    }

    return NextResponse.json({ accounts: accounts || [] })
  } catch (error) {
    return handleAPIError(error)
  }
}

// POST: Add a new Gmail account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gmail_address, account_label, access_token, refresh_token, expires_at } = await request.json()

    if (!gmail_address || !access_token) {
      return NextResponse.json({ error: 'Gmail address and access token required' }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    // Check if this Gmail account is already connected
    const { data: existing } = await (supabase as any)
      .from('gmail_accounts')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('gmail_address', gmail_address)
      .single()

    if (existing) {
      // Update existing account
      const { data: account, error } = await (supabase as any)
        .from('gmail_accounts')
        .update({
          access_token,
          refresh_token,
          expires_at,
          account_label: account_label || null,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update Gmail account: ${error.message}`)
      }

      return NextResponse.json({ 
        message: 'Gmail account updated successfully',
        account: {
          id: account.id,
          gmail_address: account.gmail_address,
          account_label: account.account_label
        }
      })
    } else {
      // Insert new account
      const { data: account, error } = await (supabase as any)
        .from('gmail_accounts')
        .insert({
          user_id: session.user.id,
          gmail_address,
          account_label: account_label || null,
          access_token,
          refresh_token,
          expires_at
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to add Gmail account: ${error.message}`)
      }

      return NextResponse.json({
        message: 'Gmail account added successfully',
        account: {
          id: account.id,
          gmail_address: account.gmail_address,
          account_label: account.account_label
        }
      })
    }
  } catch (error) {
    return handleAPIError(error)
  }
}