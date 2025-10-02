import Anthropic from '@anthropic-ai/sdk'
import { getAnthropicKey } from './env'
import { retry } from './retry'
import { logger } from './logger'
import type { MessageCreateParams, Message } from '@anthropic-ai/sdk/resources/messages'

/**
 * Get Anthropic client instance
 * Only call this inside API handlers, not at module import time
 */
export function getAnthropic() {
  const apiKey = getAnthropicKey()
  return new Anthropic({ apiKey })
}

/**
 * Create a message with automatic retry logic for transient failures
 */
export async function createMessageWithRetry(
  params: MessageCreateParams
): Promise<Message> {
  const anthropic = getAnthropic()

  return retry(
    async () => {
      const response = await anthropic.messages.create(params)
      // Ensure we return a Message, not a Stream
      return response as Message
    },
    {
      maxAttempts: 3,
      initialDelayMs: 1000,
      retryableErrors: [
        /rate limit/i,
        /429/,
        /503/,
        /504/,
        /timeout/i,
        /overloaded/i,
        /ECONNRESET/i,
      ],
      onRetry: (error, attempt) => {
        logger.warn('Retrying Anthropic API call', {
          error: error.message,
          attempt,
          model: params.model,
        })
      },
    }
  )
}