import OpenAI from 'openai'
import { AI_CONFIG, isOpenAiConfigured } from './config.js'

let client = null

export function getOpenAiClient() {
  if (!isOpenAiConfigured()) {
    const err = Object.assign(new Error('OpenAI가 아직 설정되지 않았습니다. OPENAI_API_KEY를 추가하세요.'), {
      status: 503,
      code: 'OPENAI_NOT_CONFIGURED',
    })
    throw err
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return client
}

export async function chatCompletion({ system, user, history = [], temperature = AI_CONFIG.temperature }) {
  const openai = getOpenAiClient()
  const messages = [
    { role: 'system', content: system },
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || ''),
    })),
    { role: 'user', content: user },
  ]

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90_000)

  try {
    const response = await openai.chat.completions.create(
      {
        model: AI_CONFIG.model,
        temperature,
        max_tokens: AI_CONFIG.maxOutputTokens,
        messages,
      },
      { signal: controller.signal },
    )

    const choice = response.choices?.[0]
    const content = choice?.message?.content?.trim() || ''
    const usage = response.usage
      ? {
          inputTokens: response.usage.prompt_tokens ?? null,
          outputTokens: response.usage.completion_tokens ?? null,
          totalTokens: response.usage.total_tokens ?? null,
        }
      : null

    return { content, usage, model: response.model || AI_CONFIG.model }
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw Object.assign(new Error('AI 요청 시간이 초과되었습니다.'), {
        status: 504,
        code: 'AI_TIMEOUT',
      })
    }
    const status = err?.status || err?.response?.status
    if (status === 429) {
      throw Object.assign(new Error('OpenAI 요청 한도에 도달했습니다. 잠시 후 다시 시도하세요.'), {
        status: 429,
        code: 'AI_RATE_LIMIT',
      })
    }
    throw Object.assign(new Error(err?.message || 'OpenAI 요청에 실패했습니다.'), {
      status: status || 502,
      code: 'AI_PROVIDER_ERROR',
    })
  } finally {
    clearTimeout(timeout)
  }
}
