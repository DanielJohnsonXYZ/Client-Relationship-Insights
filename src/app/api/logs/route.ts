import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Mock log data - in a real application, you'd fetch from a logging service
const generateMockLogs = () => {
  const logLevels = ['info', 'warn', 'error', 'debug']
  const components = ['auth', 'gmail-sync', 'ai-processing', 'database', 'api']
  const messages = [
    'User authentication successful',
    'Email sync completed: 15 new emails processed',
    'AI insight generation started',
    'Database connection established',
    'Failed to process email thread',
    'Rate limit exceeded for API call',
    'Cache invalidated for user data',
    'Webhook received from integration',
    'Background job completed successfully',
    'Session expired, redirecting to login'
  ]

  const logs = []
  const now = new Date()

  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now.getTime() - (i * 2 * 60000 + Math.random() * 300000)) // Random times in last few hours
    logs.push({
      id: `log-${i}`,
      timestamp: timestamp.toISOString(),
      level: logLevels[Math.floor(Math.random() * logLevels.length)],
      component: components[Math.floor(Math.random() * components.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      metadata: Math.random() > 0.7 ? {
        userId: 'user-123',
        requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
        duration: Math.floor(Math.random() * 1000)
      } : undefined
    })
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const component = searchParams.get('component')
    const limit = parseInt(searchParams.get('limit') || '25')

    let logs = generateMockLogs()

    // Filter by level if specified
    if (level && level !== 'all') {
      logs = logs.filter(log => log.level === level)
    }

    // Filter by component if specified
    if (component && component !== 'all') {
      logs = logs.filter(log => log.component === component)
    }

    // Limit results
    logs = logs.slice(0, limit)

    return NextResponse.json({
      logs,
      total: logs.length,
      filters: {
        level: level || 'all',
        component: component || 'all',
        limit
      }
    })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}