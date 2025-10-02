import { logger } from './logger'

export interface RetryOptions {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  retryableErrors?: Array<string | RegExp>
  onRetry?: (error: Error, attempt: number) => void
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'retryableErrors'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
}

/**
 * Determines if an error should be retried based on the error message
 */
function isRetryableError(error: Error, retryableErrors?: Array<string | RegExp>): boolean {
  if (!retryableErrors || retryableErrors.length === 0) {
    // Default retryable errors
    const defaultRetryable = [
      /timeout/i,
      /ETIMEDOUT/i,
      /ECONNRESET/i,
      /ENOTFOUND/i,
      /rate limit/i,
      /429/,
      /503/,
      /504/,
      /network/i,
      /socket hang up/i,
    ]
    return defaultRetryable.some(pattern =>
      pattern.test(error.message) || pattern.test(error.name)
    )
  }

  return retryableErrors.some(pattern => {
    if (typeof pattern === 'string') {
      return error.message.includes(pattern) || error.name.includes(pattern)
    }
    return pattern.test(error.message) || pattern.test(error.name)
  })
}

/**
 * Calculates the delay for the next retry attempt using exponential backoff with jitter
 */
function calculateDelay(attempt: number, options: Required<Omit<RetryOptions, 'onRetry' | 'retryableErrors'>>): number {
  const exponentialDelay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1)
  const cappedDelay = Math.min(exponentialDelay, options.maxDelayMs)

  // Add jitter (random variance) to prevent thundering herd
  const jitter = Math.random() * cappedDelay * 0.1

  return Math.floor(cappedDelay + jitter)
}

/**
 * Delays execution for the specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retries an async function with exponential backoff
 *
 * @example
 * const result = await retry(
 *   () => fetchDataFromAPI(),
 *   { maxAttempts: 5, initialDelayMs: 1000 }
 * )
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if we should retry this error
      if (!isRetryableError(lastError, options.retryableErrors)) {
        logger.warn('Non-retryable error encountered', {
          error: lastError.message,
          attempt,
        })
        throw lastError
      }

      // If this was the last attempt, throw the error
      if (attempt === opts.maxAttempts) {
        logger.error('Max retry attempts reached', lastError, {
          maxAttempts: opts.maxAttempts,
        })
        throw lastError
      }

      // Calculate delay and wait before retrying
      const delayMs = calculateDelay(attempt, opts)

      logger.warn('Retrying after error', {
        error: lastError.message,
        attempt,
        nextAttempt: attempt + 1,
        maxAttempts: opts.maxAttempts,
        delayMs,
      })

      // Call the onRetry callback if provided
      if (options.onRetry) {
        options.onRetry(lastError, attempt)
      }

      await delay(delayMs)
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed with unknown error')
}

/**
 * Creates a retry wrapper function with preset options
 *
 * @example
 * const retryableFetch = createRetryable({ maxAttempts: 5 })
 * const result = await retryableFetch(() => fetch('https://api.example.com'))
 */
export function createRetryable(options: RetryOptions = {}) {
  return <T>(fn: () => Promise<T>): Promise<T> => retry(fn, options)
}
