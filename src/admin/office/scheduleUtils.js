/** Date helpers for schedule / today (local calendar days). */

export function toDateKey(value) {
  if (!value) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey(now = new Date()) {
  return toDateKey(now)
}

export function addDaysKey(key, days) {
  const d = new Date(`${key}T12:00:00`)
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

export function parseKey(key) {
  if (!key) return null
  return new Date(`${key}T12:00:00`)
}

export function daysBetween(fromKey, toKey) {
  const a = parseKey(fromKey)
  const b = parseKey(toKey)
  if (!a || !b) return null
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

export function startOfWeekMonday(key = todayKey()) {
  const d = parseKey(key)
  const day = d.getDay() // 0 Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toDateKey(d)
}

export function weekKeys(anchor = todayKey()) {
  const start = startOfWeekMonday(anchor)
  return Array.from({ length: 7 }, (_, i) => addDaysKey(start, i))
}

export function formatKoreanDate(key, opts = {}) {
  const d = parseKey(key)
  if (!d) return '—'
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: opts.weekday ? 'long' : undefined,
  })
}

export function countdownLabel(targetKey, nowKey = todayKey()) {
  if (!targetKey) return null
  const n = daysBetween(nowKey, targetKey)
  if (n === null) return null
  if (n === 0) return 'D-Day'
  if (n > 0) return `D-${n}`
  return `D+${Math.abs(n)}`
}

export function daysWaitingLabel(waitingSince, now = new Date()) {
  if (!waitingSince) return null
  const start = toDateKey(waitingSince)
  const n = daysBetween(start, todayKey(now))
  if (n === null) return null
  if (n <= 0) return '오늘부터 대기'
  return `${n}일째 대기`
}

/**
 * Calculated urgency — does not overwrite manual priority.
 * Returns: urgent | high | normal
 */
export function calcUrgency(item, nowKey = todayKey()) {
  const date = toDateKey(item.date || item.endDate || item.dueDate)
  const follow = toDateKey(item.followUpDate)
  const status = item.status

  if (status === 'completed' || status === 'done' || status === 'cancelled') return 'normal'

  if (date && date < nowKey && status !== 'completed') return 'urgent'
  if (date === nowKey) return 'urgent'
  if (follow === nowKey) return 'urgent'

  if (date) {
    const d = daysBetween(nowKey, date)
    if (d !== null && d >= 0 && d <= 3) return 'high'
  }
  if (item.isMilestone && date) {
    const d = daysBetween(nowKey, date)
    if (d !== null && d >= 0 && d <= 7) return 'high'
  }
  if (item.blocking) return 'high'
  return 'normal'
}

export const SCHEDULE_TYPE_LABEL = {
  task: '업무',
  deadline: '마감',
  milestone: '마일스톤',
  follow_up: 'Follow-up',
  delivery: '배송',
  event: '행사',
  announcement: '안내',
  order_period: '주문 기간',
  shipping: '출고·선적',
  meeting: '미팅',
  production: '생산',
  other: '기타',
}

export const SCHEDULE_STATUS_LABEL = {
  upcoming: '예정',
  in_progress: '진행 중',
  waiting: '대기',
  completed: '완료',
  delayed: '지연',
  cancelled: '취소',
}

export function itemEffectiveDate(item) {
  return toDateKey(item.date || item.endDate || item.startDate || item.dueDate)
}
