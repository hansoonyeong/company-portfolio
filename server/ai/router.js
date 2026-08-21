import { chatCompletion } from './openaiClient.js'
import { AI_CONFIG } from './config.js'

const RULES = [
  {
    agentId: 'copywriter',
    confidence: 0.95,
    keywords: ['캡션', '카피', '문구', '공지', 'announcement', 'caption', 'email', '이메일', 'write a', '써줘', '작성'],
    reason: '카피/문구 요청',
  },
  {
    agentId: 'marketing',
    confidence: 0.93,
    keywords: ['인스타', 'instagram', '캠페인', '콘텐츠 아이디어', '마케팅', '프로모션', '런칭', 'sns', '콘텐츠'],
    reason: '마케팅/캠페인 요청',
  },
  {
    agentId: 'research',
    confidence: 0.92,
    keywords: ['리서치', '조사', '경쟁', '시장', '가격 비교', 'research', 'competitor', '분석'],
    reason: '리서치/분석 요청',
  },
  {
    agentId: 'web-developer',
    confidence: 0.94,
    keywords: ['버그', '코드', '웹사이트', '개발', 'cursor', 'api', '프론트', '백엔드', 'fix', 'implement'],
    reason: '웹/기술 요청',
  },
  {
    agentId: 'sales-cs',
    confidence: 0.9,
    keywords: ['견적', '고객', '문의', '팔로업', '세일즈', 'quote', 'proposal', '응대'],
    reason: '세일즈/CS 요청',
  },
  {
    agentId: 'design-director',
    confidence: 0.9,
    keywords: ['디자인', '비주얼', '레이아웃', '포스터', '브리프', '브랜드', 'design'],
    reason: '디자인 디렉션 요청',
  },
  {
    agentId: 'operations',
    confidence: 0.88,
    keywords: ['운영', '공급', '물류', '주문', '체크리스트', '프로세스', 'supplier', 'ops'],
    reason: '운영 요청',
  },
  {
    agentId: 'chief-of-staff',
    confidence: 0.86,
    keywords: ['우선순위', '오늘', '계획', '조율', '의사결정', 'next action', 'priority', '정리'],
    reason: '기획/조율 요청',
  },
]

export function routeLocally(message) {
  const text = String(message || '').toLowerCase()
  let best = { agentId: 'chief-of-staff', confidence: 0.4, reason: '기본 라우팅(총괄)' }

  for (const rule of RULES) {
    const hit = rule.keywords.some((k) => text.includes(String(k).toLowerCase()))
    if (hit && rule.confidence > best.confidence) {
      best = { agentId: rule.agentId, confidence: rule.confidence, reason: rule.reason }
    }
  }
  return best
}

export async function routeAgent(message, { allowLlm = true } = {}) {
  const local = routeLocally(message)
  if (local.confidence >= 0.75 || !allowLlm) return { ...local, source: 'local' }

  try {
    const { content } = await chatCompletion({
      system:
        'You route work to one AI employee id. Reply JSON only: {"agentId":"...","confidence":0-1,"reason":"..."}. Valid ids: chief-of-staff, marketing, copywriter, design-director, research, sales-cs, web-developer, operations.',
      user: message,
      temperature: 0,
    })
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) return { ...local, source: 'local-fallback' }
    const parsed = JSON.parse(match[0])
    if (!parsed.agentId) return { ...local, source: 'local-fallback' }
    return {
      agentId: parsed.agentId,
      confidence: Number(parsed.confidence) || 0.7,
      reason: parsed.reason || 'LLM router',
      source: 'llm',
      model: AI_CONFIG.routerModel,
    }
  } catch {
    return { ...local, source: 'local-fallback' }
  }
}
