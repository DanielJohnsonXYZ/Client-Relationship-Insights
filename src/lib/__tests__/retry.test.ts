import { retry, createRetryable } from '../retry'

describe('retry', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return result on first successful attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success')
    const result = await retry(fn, { maxAttempts: 3 })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable errors', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce('success')

    const promise = retry(fn, { maxAttempts: 3, initialDelayMs: 100 })

    // Fast-forward time
    await jest.runAllTimersAsync()

    const result = await promise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should not retry on non-retryable errors', async () => {
    const error = new Error('invalid input')
    const fn = jest.fn().mockRejectedValue(error)

    await expect(
      retry(fn, {
        maxAttempts: 3,
        retryableErrors: [/timeout/i],
      })
    ).rejects.toThrow('invalid input')

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should throw after max attempts', async () => {
    const error = new Error('503 service unavailable')
    const fn = jest.fn().mockRejectedValue(error)

    const promise = retry(fn, { maxAttempts: 3, initialDelayMs: 100 })

    await jest.runAllTimersAsync()

    await expect(promise).rejects.toThrow('503 service unavailable')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should use exponential backoff', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce('success')

    const onRetry = jest.fn()
    const promise = retry(fn, {
      maxAttempts: 3,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
      onRetry,
    })

    await jest.runAllTimersAsync()
    await promise

    expect(onRetry).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should call onRetry callback', async () => {
    const error = new Error('rate limit')
    const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('success')

    const onRetry = jest.fn()
    const promise = retry(fn, { maxAttempts: 3, onRetry, initialDelayMs: 100 })

    await jest.runAllTimersAsync()
    await promise

    expect(onRetry).toHaveBeenCalledWith(error, 1)
  })

  it('should cap delay at maxDelayMs', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce('success')

    const promise = retry(fn, {
      maxAttempts: 3,
      initialDelayMs: 10000,
      maxDelayMs: 5000,
    })

    await jest.runAllTimersAsync()
    await promise

    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('createRetryable', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should create a retryable function with preset options', async () => {
    const retryableFn = createRetryable({ maxAttempts: 5, initialDelayMs: 100 })
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce('success')

    const promise = retryableFn(fn)
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
