import { runHealthChecks, pingDatabase } from '../health'
import { getSupabaseServer } from '../supabase-server'

// Mock the Supabase client
jest.mock('../supabase-server')

// Mock logger to prevent console output during tests
jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('health checks', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NEXTAUTH_SECRET = 'test-secret'
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
  })

  describe('runHealthChecks', () => {
    it('should return healthy status when all checks pass', async () => {
      // Mock successful database query
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // "Not found" is acceptable
        }),
      }

      ;(getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase)

      const result = await runHealthChecks()

      expect(result.status).toBe('healthy')
      expect(result.checks.database.status).toBe('up')
      expect(result.checks.environment.status).toBe('configured')
      expect(result.checks.database.latency).toBeGreaterThanOrEqual(0)
      expect(result.timestamp).toBeDefined()
    })

    it('should return unhealthy when database is down', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection refused', code: 'CONNECTION_ERROR' },
        }),
      }

      ;(getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase)

      const result = await runHealthChecks()

      expect(result.status).toBe('unhealthy')
      expect(result.checks.database.status).toBe('down')
      expect(result.checks.database.error).toBe('Connection refused')
    })

    it('should return unhealthy when environment variables are missing', async () => {
      // Remove required environment variable
      delete process.env.ANTHROPIC_API_KEY

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }

      ;(getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase)

      const result = await runHealthChecks()

      expect(result.status).toBe('unhealthy')
      expect(result.checks.environment.status).toBe('missing')
      expect(result.checks.environment.missing).toContain('ANTHROPIC_API_KEY')
    })

    it('should handle database query errors gracefully', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Database error')),
      }

      ;(getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase)

      const result = await runHealthChecks()

      expect(result.status).toBe('unhealthy')
      expect(result.checks.database.status).toBe('down')
      expect(result.checks.database.error).toBe('Database error')
    })

    it('should identify multiple missing environment variables', async () => {
      delete process.env.ANTHROPIC_API_KEY
      delete process.env.GOOGLE_CLIENT_ID
      delete process.env.NEXTAUTH_SECRET

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }

      ;(getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase)

      const result = await runHealthChecks()

      expect(result.checks.environment.missing).toHaveLength(3)
      expect(result.checks.environment.missing).toEqual(
        expect.arrayContaining(['ANTHROPIC_API_KEY', 'GOOGLE_CLIENT_ID', 'NEXTAUTH_SECRET'])
      )
    })
  })

  describe('pingDatabase', () => {
    it('should return true when database is accessible', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }

      ;(getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase)

      const result = await pingDatabase()

      expect(result).toBe(true)
    })

    it('should return true when query succeeds', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-id' },
          error: null,
        }),
      }

      ;(getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase)

      const result = await pingDatabase()

      expect(result).toBe(true)
    })

    it('should return false when database has error', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection error', code: 'ERROR' },
        }),
      }

      ;(getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase)

      const result = await pingDatabase()

      expect(result).toBe(false)
    })

    it('should return false when query throws exception', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Network error')),
      }

      ;(getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase)

      const result = await pingDatabase()

      expect(result).toBe(false)
    })
  })
})
