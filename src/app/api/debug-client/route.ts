import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Starting client creation debug...')
    
    // Test authentication
    let user
    try {
      user = await getAuthenticatedUser()
      console.log('✅ Authentication successful:', { id: user.id, email: user.email })
    } catch (authError) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json({ error: 'Authentication failed', details: authError }, { status: 401 })
    }

    // Test Supabase connection
    let supabase
    try {
      supabase = getSupabaseServer()
      console.log('✅ Supabase client created')
    } catch (supabaseError) {
      console.error('❌ Supabase connection failed:', supabaseError)
      return NextResponse.json({ error: 'Database connection failed', details: supabaseError }, { status: 500 })
    }

    // Test table access
    try {
      const { data: testQuery, error: testError } = await (supabase as any)
        .from('clients')
        .select('count')
        .limit(1)
        
      if (testError) {
        console.error('❌ Table access failed:', testError)
        return NextResponse.json({ error: 'Table access failed', details: testError }, { status: 500 })
      }
      
      console.log('✅ Clients table accessible')
    } catch (tableError) {
      console.error('❌ Table query failed:', tableError)
      return NextResponse.json({ error: 'Table query failed', details: tableError }, { status: 500 })
    }

    // Test simple insert
    try {
      const testClient = {
        user_id: user.id,
        name: 'Test Client',
        company: 'Test Company',
        status: 'active',
        relationship_health: 3
      }
      
      console.log('🧪 Attempting to insert test client:', testClient)
      
      const { data: insertResult, error: insertError } = await (supabase as any)
        .from('clients')
        .insert(testClient)
        .select()
        .single()

      if (insertError) {
        console.error('❌ Insert failed:', insertError)
        return NextResponse.json({ 
          error: 'Insert failed', 
          details: insertError,
          testData: testClient 
        }, { status: 500 })
      }

      console.log('✅ Test client created successfully:', insertResult)

      // Clean up test client
      await (supabase as any)
        .from('clients')
        .delete()
        .eq('id', insertResult.id)

      return NextResponse.json({ 
        success: true,
        message: 'All tests passed!',
        user: { id: user.id, email: user.email },
        testResult: insertResult
      })

    } catch (insertError) {
      console.error('❌ Insert attempt failed:', insertError)
      return NextResponse.json({ error: 'Insert attempt failed', details: insertError }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ General error:', error)
    return NextResponse.json({ error: 'General error', details: error }, { status: 500 })
  }
}