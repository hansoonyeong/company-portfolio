export const AI_CONFIG = {
  model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  maxOutputTokens: 2500,
  temperature: 0.7,
  routerModel: process.env.OPENAI_ROUTER_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini',
}

export function isOpenAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

export function getOpenAiStatus() {
  return {
    configured: isOpenAiConfigured(),
    model: AI_CONFIG.model,
  }
}
