import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    
    // Test database connection
    const { data, error } = await supabase
      .from('emails')
      .select('count')
      .limit(1)

    const dbStatus = error ? 'error' : 'healthy'
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        api: 'healthy'
      },
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 500 })
  }
}