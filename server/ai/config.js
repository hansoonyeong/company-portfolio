export const AI_CONFIG = {
  model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  maxOutputTokens: 2500,
  temperature: 0.7,
  routerModel: process.env.OPENAI_ROUTER_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini',
}

export function isOpenAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

/**
 * Single source of truth for Office operating mode.
 * AI architecture stays intact; Manual Mode when no provider key exists.
 */
export function getProviderStatus() {
  if (isOpenAiConfigured()) {
    return {
      mode: 'ai',
      configured: true,
      provider: 'openai',
      model: AI_CONFIG.model,
    }
  }
  return {
    mode: 'manual',
    configured: false,
    provider: null,
    model: AI_CONFIG.model,
  }
}

/** @deprecated use getProviderStatus — kept for callers during Phase 3.5 */
export function getOpenAiStatus() {
  return getProviderStatus()
}
