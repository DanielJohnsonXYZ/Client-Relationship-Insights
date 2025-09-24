import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    
    // Test database connection
    const { data: _data, error } = await supabase
      .from('emails')
      .select('count')
      .limit(1)

    const dbStatus = error ? 'error' : 'healthy'
    const overallStatus = error ? 'error' : 'healthy'
    const statusCode = error ? 503 : 200
    
    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        api: 'healthy'
      },
      environment: process.env.NODE_ENV,
      ...(error && { error: 'Database connection failed' })
    }, { status: statusCode })
  } catch (_error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 500 })
  }
}