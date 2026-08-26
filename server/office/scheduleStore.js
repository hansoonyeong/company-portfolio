import crypto from 'crypto'
import { readJson, updateJson } from './jsonStore.js'

const FILE = 'office-schedule.json'
const now = () => new Date().toISOString()
const id = () => crypto.randomUUID()

/** Accept "HH:MM" or "H:MM"; empty → null */
function normalizeTime(value) {
  if (value === undefined) return null
  if (value === null || value === '') return null
  const raw = String(value).trim()
  const m = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function seedSchedule() {
  return []
}

async function list() {
  const data = await readJson(FILE, seedSchedule)
  return Array.isArray(data) ? data : []
}

async function mutate(mutator) {
  return updateJson(FILE, seedSchedule, async (items) => {
    const listItems = Array.isArray(items) ? items : []
    return mutator(listItems)
  })
}

function normalizeItem(body, existing = null) {
  const t = now()
  const status = body.status || existing?.status || 'upcoming'
  let waitingSince = existing?.waitingSince || null
  if (status === 'waiting' && !waitingSince) {
    waitingSince = body.waitingSince || t
  }
  if (status !== 'waiting' && body.status !== undefined) {
    waitingSince = body.waitingSince !== undefined ? body.waitingSince : null
  }
  if (body.waitingSince !== undefined) waitingSince = body.waitingSince

  return {
    id: existing?.id || id(),
    projectId: body.projectId !== undefined ? body.projectId : existing?.projectId || null,
    title: body.title !== undefined ? String(body.title).trim() : existing?.title || '',
    description:
      body.description !== undefined ? String(body.description).trim() : existing?.description || '',
    type: body.type || existing?.type || 'task',
    date: body.date !== undefined ? body.date || null : existing?.date || null,
    time: normalizeTime(
      body.time !== undefined ? body.time : existing?.time,
    ),
    startDate: body.startDate !== undefined ? body.startDate || null : existing?.startDate || null,
    endDate: body.endDate !== undefined ? body.endDate || null : existing?.endDate || null,
    endTime: normalizeTime(
      body.endTime !== undefined ? body.endTime : existing?.endTime,
    ),
    status,
    priority: body.priority || existing?.priority || 'medium',
    assignedAgentId:
      body.assignedAgentId !== undefined
        ? body.assignedAgentId || null
        : existing?.assignedAgentId || null,
    relatedTaskId:
      body.relatedTaskId !== undefined
        ? body.relatedTaskId || null
        : existing?.relatedTaskId || null,
    dependsOn: Array.isArray(body.dependsOn)
      ? body.dependsOn
      : existing?.dependsOn || [],
    waitingFor:
      body.waitingFor !== undefined
        ? body.waitingFor
          ? String(body.waitingFor).trim()
          : null
        : existing?.waitingFor || null,
    waitingSince,
    followUpDate:
      body.followUpDate !== undefined
        ? body.followUpDate || null
        : existing?.followUpDate || null,
    reminderDate:
      body.reminderDate !== undefined
        ? body.reminderDate || null
        : existing?.reminderDate || null,
    isMilestone: body.isMilestone !== undefined ? Boolean(body.isMilestone) : existing?.isMilestone || false,
    category: body.category !== undefined ? body.category : existing?.category || null,
    notes: body.notes !== undefined ? String(body.notes || '') : existing?.notes || '',
    roundId: body.roundId !== undefined ? body.roundId || null : existing?.roundId || null,
    roundName: body.roundName !== undefined ? body.roundName || null : existing?.roundName || null,
    sortOrder: body.sortOrder !== undefined ? body.sortOrder : existing?.sortOrder ?? 0,
    externalProvider: existing?.externalProvider || null,
    externalEventId: existing?.externalEventId || null,
    createdAt: existing?.createdAt || t,
    updatedAt: t,
    completedAt:
      status === 'completed'
        ? existing?.completedAt || body.completedAt || t
        : status !== 'completed'
          ? null
          : existing?.completedAt || null,
  }
}

export async function getScheduleItems() {
  return list()
}

export async function getScheduleItem(itemId) {
  const items = await list()
  const found = items.find((i) => i.id === itemId)
  if (!found) throw Object.assign(new Error('일정을 찾을 수 없습니다.'), { status: 404 })
  return found
}

export async function createScheduleItem(body) {
  const item = normalizeItem(body)
  if (!item.title) throw Object.assign(new Error('제목이 필요합니다.'), { status: 400 })
  await mutate((items) => [item, ...items])
  return item
}

export async function updateScheduleItem(itemId, body) {
  let updated = null
  await mutate((items) =>
    items.map((item) => {
      if (item.id !== itemId) return item
      updated = normalizeItem(body, item)
      return updated
    }),
  )
  if (!updated) throw Object.assign(new Error('일정을 찾을 수 없습니다.'), { status: 404 })
  return updated
}

export async function deleteScheduleItem(itemId) {
  let removed = false
  await mutate((items) =>
    items.filter((item) => {
      if (item.id !== itemId) return true
      removed = true
      return false
    }),
  )
  if (!removed) throw Object.assign(new Error('일정을 찾을 수 없습니다.'), { status: 404 })
  return { ok: true }
}

export async function createManyScheduleItems(bodies) {
  const created = []
  await mutate((items) => {
    const next = [...items]
    for (const body of bodies) {
      const item = normalizeItem(body)
      if (!item.title) continue
      next.unshift(item)
      created.push(item)
    }
    return next
  })
  return created
}

/** Sync schedule date when linked task dueDate changes */
export async function syncScheduleFromTask(task) {
  if (!task?.id) return
  await mutate((items) =>
    items.map((item) => {
      if (item.relatedTaskId !== task.id) return item
      return {
        ...item,
        date: task.dueDate || item.date,
        status:
          task.status === 'done'
            ? 'completed'
            : task.status === 'waiting'
              ? 'waiting'
              : task.status === 'in_progress'
                ? 'in_progress'
                : item.status,
        waitingFor: task.waitingFor !== undefined ? task.waitingFor : item.waitingFor,
        followUpDate: task.followUpDate !== undefined ? task.followUpDate : item.followUpDate,
        waitingSince:
          task.status === 'waiting'
            ? item.waitingSince || now()
            : task.status !== 'waiting'
              ? null
              : item.waitingSince,
        assignedAgentId: task.assignedAgentId || item.assignedAgentId,
        projectId: task.projectId || item.projectId,
        updatedAt: now(),
        completedAt: task.status === 'done' ? task.completedAt || now() : null,
      }
    }),
  )
}

export async function ensureHangeulSnackTimeline(projectId = 'proj-hangeul') {
  const items = await list()
  const existingTitles = new Set(
    items.filter((i) => i.projectId === projectId).map((i) => i.title.trim().toLowerCase()),
  )

  const undated = [
    '최소 혼합 주문금액 확인',
    '첫 주문 구성 확정',
    '현지 유통사 정보 확정',
    '영문 라벨 최종 확인',
    '라벨 제작',
    '라벨 부착',
    '출고 준비',
    '한국 출고',
    '해상운송',
    '호주 도착',
    '통관 및 물류',
    '시드니 판매처 확정',
    '행사 물품 준비',
    '홍보 콘텐츠 준비',
  ]

  const deps = {
    '첫 주문 구성 확정': ['최소 혼합 주문금액 확인'],
    '영문 라벨 최종 확인': ['현지 유통사 정보 확정'],
    '라벨 제작': ['영문 라벨 최종 확인'],
    '라벨 부착': ['라벨 제작'],
    '출고 준비': ['라벨 부착'],
    '한국 출고': ['출고 준비'],
    '해상운송': ['한국 출고'],
    '호주 도착': ['해상운송'],
  }

  const toCreate = []
  for (const title of undated) {
    if (existingTitles.has(title.toLowerCase())) continue
    toCreate.push({
      projectId,
      title,
      type: 'milestone',
      status: 'upcoming',
      priority: 'high',
      isMilestone: true,
      category: 'hangeul_pipeline',
      date: null,
      dependsOn: [],
    })
  }

  const launchTitle = '시드니 첫 공개 / 한국 관련 행사 론칭 목표'
  if (![...existingTitles].some((t) => t.includes('10월 31') || t.includes('론칭') || t.includes('첫 공개'))) {
    toCreate.push({
      projectId,
      title: launchTitle,
      type: 'event',
      status: 'upcoming',
      priority: 'urgent',
      isMilestone: true,
      category: 'hangeul_launch',
      date: '2026-10-31',
      dependsOn: [],
    })
  }

  const created = await createManyScheduleItems(toCreate)

  // Wire dependsOn using titles after all exist
  const all = await list()
  const byTitle = new Map(
    all.filter((i) => i.projectId === projectId).map((i) => [i.title, i.id]),
  )

  await mutate((items) =>
    items.map((item) => {
      if (item.projectId !== projectId) return item
      const need = deps[item.title]
      if (!need) return item
      const dependsOn = need.map((t) => byTitle.get(t)).filter(Boolean)
      if (!dependsOn.length) return item
      return { ...item, dependsOn, updatedAt: now() }
    }),
  )

  return created
}
