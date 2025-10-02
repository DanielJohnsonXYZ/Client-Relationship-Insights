import { getSupabaseServer } from './supabase-server'
import { logger } from './logger'

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy'
  checks: {
    database: {
      status: 'up' | 'down'
      latency?: number
      error?: string
    }
    environment: {
      status: 'configured' | 'missing'
      missing?: string[]
    }
  }
  timestamp: string
}

/**
 * Check database connectivity and performance
 */
async function checkDatabase(): Promise<HealthCheckResult['checks']['database']> {
  try {
    const startTime = Date.now()
    const supabase = getSupabaseServer()

    // Simple query to check database connection
    const { error } = await supabase.from('emails').select('id').limit(1).single()

    const latency = Date.now() - startTime

    // It's OK if there are no emails, we just want to verify the connection
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is acceptable
      logger.error('Database health check failed', error)
      return {
        status: 'down',
        error: error.message,
      }
    }

    logger.debug('Database health check passed', { latency })
    return {
      status: 'up',
      latency,
    }
  } catch (error) {
    logger.error('Database health check error', error)
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check that all required environment variables are configured
 */
function checkEnvironment(): HealthCheckResult['checks']['environment'] {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'ANTHROPIC_API_KEY',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    logger.warn('Missing environment variables', { missing })
    return {
      status: 'missing',
      missing,
    }
  }

  return {
    status: 'configured',
  }
}

/**
 * Run all health checks
 */
export async function runHealthChecks(): Promise<HealthCheckResult> {
  const [database, environment] = await Promise.all([checkDatabase(), Promise.resolve(checkEnvironment())])

  const overallStatus =
    database.status === 'up' && environment.status === 'configured' ? 'healthy' : 'unhealthy'

  const result: HealthCheckResult = {
    status: overallStatus,
    checks: {
      database,
      environment,
    },
    timestamp: new Date().toISOString(),
  }

  logger.info('Health check completed', {
    status: result.status,
    databaseStatus: database.status,
    environmentStatus: environment.status,
  })

  return result
}

/**
 * Lightweight database ping (no logging)
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    const supabase = getSupabaseServer()
    const { error } = await supabase.from('emails').select('id').limit(1).single()

    // PGRST116 is "not found" which is acceptable
    return !error || error.code === 'PGRST116'
  } catch {
    return false
  }
}
