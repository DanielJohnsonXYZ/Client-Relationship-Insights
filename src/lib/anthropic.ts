import Anthropic from '@anthropic-ai/sdk'
import { getAnthropicKey } from './env'

/**
 * Get Anthropic client instance
 * Only call this inside API handlers, not at module import time
 */
export function getAnthropic() {
  const apiKey = getAnthropicKey()
  return new Anthropic({ apiKey })
}