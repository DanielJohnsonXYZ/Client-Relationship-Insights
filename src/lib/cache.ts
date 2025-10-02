import { logger } from './logger'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

/**
 * In-memory cache with TTL support
 * For production with multiple servers, consider using Redis
 */
class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>>
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.cache = new Map()
    this.startCleanup()
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    logger.debug('Cache hit', { key })
    return entry.value
  }

  /**
   * Set a value in cache with TTL in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000

    this.cache.set(key, {
      value,
      expiresAt,
    })

    logger.debug('Cache set', { key, ttlSeconds })
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      logger.debug('Cache delete', { key })
    }
    return deleted
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    logger.info('Cache cleared', { entriesRemoved: size })
  }

  /**
   * Delete all keys matching a pattern
   */
  deletePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    let deletedCount = 0

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    logger.debug('Cache pattern delete', { pattern: pattern.toString(), deletedCount })
    return deletedCount
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now()
    let removedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        removedCount++
      }
    }

    if (removedCount > 0) {
      logger.info('Cache cleanup completed', { removedCount, remainingSize: this.cache.size })
    }
  }

  /**
   * Stop cleanup interval (useful for testing)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Singleton instance
const cache = new MemoryCache()

/**
 * Memoize an async function with caching
 */
export function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: {
    keyFn: (...args: Args) => string
    ttlSeconds?: number
  }
): (...args: Args) => Promise<Result> {
  return async (...args: Args): Promise<Result> => {
    const key = options.keyFn(...args)
    const cached = cache.get<Result>(key)

    if (cached !== null) {
      return cached
    }

    const result = await fn(...args)
    cache.set(key, result, options.ttlSeconds)

    return result
  }
}

/**
 * Cache key builders for common patterns
 */
export const cacheKeys = {
  userEmails: (userId: string) => `emails:user:${userId}`,
  userInsights: (userId: string) => `insights:user:${userId}`,
  clientData: (clientId: string) => `client:${clientId}`,
  emailThread: (threadId: string) => `thread:${threadId}`,
  userSession: (userId: string) => `session:${userId}`,
}

export { cache }
