import { NextRequest, NextResponse } from 'next/server'
import { runHealthChecks } from '@/lib/health'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const healthResult = await runHealthChecks()
    const statusCode = healthResult.status === 'healthy' ? 200 : 503

    return NextResponse.json(
      {
        ...healthResult,
        environment: process.env.NODE_ENV,
      },
      { status: statusCode }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        checks: {
          database: {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          environment: {
            status: 'missing',
          },
        },
      },
      { status: 500 }
    )
  }
}