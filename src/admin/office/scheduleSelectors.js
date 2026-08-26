import {
  addDaysKey,
  calcUrgency,
  daysBetween,
  itemEffectiveDate,
  startOfWeekMonday,
  todayKey,
  toDateKey,
  weekKeys,
} from './scheduleUtils'

const DONE = new Set(['done', 'completed', 'cancelled'])

export function projectName(projects, projectId) {
  return projects.find((p) => p.id === projectId)?.name || '—'
}

export function projectColor(projects, projectId) {
  return projects.find((p) => p.id === projectId)?.color || '#5c6b5a'
}

/** IDs of schedule items that block at least one incomplete downstream item */
export function blockerIds(schedule = []) {
  const set = new Set()
  for (const item of schedule) {
    if (DONE.has(item.status)) continue
    for (const dep of item.dependsOn || []) set.add(dep)
  }
  return set
}

/**
 * Unified work items from Tasks + Schedule.
 * Linked pairs collapse into one row (prefer schedule + task fields).
 */
export function buildWorkItems({ tasks = [], schedule = [], projects = [] }) {
  const blockers = blockerIds(schedule)
  const taskById = new Map(tasks.map((t) => [t.id, t]))
  const linkedTaskIds = new Set()
  const items = []

  for (const s of schedule) {
    const task = s.relatedTaskId ? taskById.get(s.relatedTaskId) : null
    if (task) linkedTaskIds.add(task.id)
    const status = mapStatus(s.status, task?.status)
    const date = itemEffectiveDate(s) || toDateKey(task?.dueDate)
    const item = {
      id: `sch-${s.id}`,
      source: 'schedule',
      scheduleId: s.id,
      taskId: task?.id || null,
      projectId: s.projectId || task?.projectId || null,
      title: s.title || task?.title || '',
      description: s.description || task?.description || '',
      date,
      endDate: toDateKey(s.endDate),
      followUpDate: toDateKey(s.followUpDate || task?.followUpDate),
      status,
      priority: s.priority || task?.priority || 'medium',
      type: s.type || 'task',
      waitingFor: s.waitingFor || task?.waitingFor || null,
      waitingSince: s.waitingSince || task?.waitingSince || null,
      isMilestone: Boolean(s.isMilestone),
      dependsOn: s.dependsOn || [],
      assignedAgentId: s.assignedAgentId || task?.assignedAgentId || null,
      notes: s.notes || '',
      roundId: s.roundId || null,
      roundName: s.roundName || null,
      category: s.category || null,
      completedAt: s.completedAt || task?.completedAt || null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      blocking: blockers.has(s.id),
      rawSchedule: s,
      rawTask: task || null,
    }
    item.urgency = calcUrgency(item)
    item.projectName = projectName(projects, item.projectId)
    item.projectColor = projectColor(projects, item.projectId)
    items.push(item)
  }

  for (const t of tasks) {
    if (linkedTaskIds.has(t.id)) continue
    if (t.scheduleId && schedule.some((s) => s.id === t.scheduleId)) continue
    const item = {
      id: `task-${t.id}`,
      source: 'task',
      scheduleId: t.scheduleId || null,
      taskId: t.id,
      projectId: t.projectId || null,
      title: t.title,
      description: t.description || '',
      date: toDateKey(t.dueDate),
      endDate: null,
      followUpDate: toDateKey(t.followUpDate),
      status: mapStatus(null, t.status),
      priority: t.priority || 'medium',
      type: 'task',
      waitingFor: t.waitingFor || null,
      waitingSince: t.waitingSince || null,
      isMilestone: false,
      dependsOn: [],
      assignedAgentId: t.assignedAgentId || null,
      notes: '',
      roundId: null,
      roundName: null,
      category: null,
      completedAt: t.completedAt || null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      blocking: false,
      rawSchedule: null,
      rawTask: t,
    }
    item.urgency = calcUrgency(item)
    item.projectName = projectName(projects, item.projectId)
    item.projectColor = projectColor(projects, item.projectId)
    items.push(item)
  }

  return items
}

function mapStatus(scheduleStatus, taskStatus) {
  if (scheduleStatus === 'completed' || taskStatus === 'done') return 'completed'
  if (scheduleStatus === 'cancelled') return 'cancelled'
  if (scheduleStatus === 'waiting' || taskStatus === 'waiting') return 'waiting'
  if (scheduleStatus === 'in_progress' || taskStatus === 'in_progress') return 'in_progress'
  if (scheduleStatus === 'delayed') return 'delayed'
  if (scheduleStatus) return scheduleStatus
  if (taskStatus === 'todo' || taskStatus === 'inbox') return 'upcoming'
  return 'upcoming'
}

export function isActive(item) {
  return !DONE.has(item.status)
}

export function partitionToday(items, nowKey = todayKey()) {
  const weekEnd = addDaysKey(nowKey, 7)
  const active = items.filter(isActive)

  const overdue = active.filter((i) => i.date && i.date < nowKey)
  const todayAction = active.filter((i) => {
    if (i.date === nowKey) return true
    if (i.followUpDate === nowKey) return true
    return false
  })
  const thisWeek = active.filter((i) => {
    if (!i.date) return false
    if (i.date <= nowKey) return false
    return i.date <= weekEnd
  })
  const waiting = active.filter((i) => i.status === 'waiting')
  const milestones = active
    .filter((i) => i.isMilestone && i.date && i.date >= nowKey)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .slice(0, 8)

  const firstCheck = pickFirstCheck(active, nowKey)

  return {
    overdue,
    todayAction,
    thisWeek,
    waiting,
    milestones,
    firstCheck,
    weekDeadlines: active.filter((i) => i.date && i.date >= nowKey && i.date <= weekEnd),
  }
}

function pickFirstCheck(active, nowKey) {
  const scored = []
  for (const item of active) {
    let rank = 99
    if (item.date && item.date < nowKey) rank = 1
    else if (item.date === nowKey) rank = 2
    else if (item.followUpDate === nowKey) rank = 3
    else if (item.blocking) rank = 4
    else if (item.isMilestone && item.date) {
      const d = daysBetween(nowKey, item.date)
      if (d !== null && d >= 0 && d <= 14) rank = 5
    }
    if (rank < 99) scored.push({ item, rank })
  }
  scored.sort((a, b) => a.rank - b.rank || (a.item.date || '').localeCompare(b.item.date || ''))
  return scored.slice(0, 5).map((s) => s.item)
}

export function buildAdminAlerts(items, schedule = [], nowKey = todayKey()) {
  const alerts = []
  const active = items.filter(isActive)
  const dueToday = active.filter((i) => i.date === nowKey).length
  const followToday = active.filter((i) => i.followUpDate === nowKey).length
  const overdue = active.filter((i) => i.date && i.date < nowKey).length

  if (dueToday) alerts.push({ id: 'due-today', text: `${dueToday}개 일정이 오늘 마감입니다.` })
  if (followToday) alerts.push({ id: 'follow', text: `${followToday}개 Follow-up이 필요합니다.` })
  if (overdue) alerts.push({ id: 'overdue', text: `${overdue}개 일정이 지연되었습니다.` })

  const byId = new Map(schedule.map((s) => [s.id, s]))
  for (const item of schedule) {
    if (DONE.has(item.status) || !item.isMilestone) continue
    for (const depId of item.dependsOn || []) {
      const dep = byId.get(depId)
      if (!dep || DONE.has(dep.status)) continue
      const depDate = itemEffectiveDate(dep)
      if (depDate && depDate < nowKey) {
        alerts.push({
          id: `delay-${item.id}-${depId}`,
          text: `${item.title} 선행 일정(${dep.title})이 지연되었습니다.`,
        })
      }
    }
  }

  return alerts.slice(0, 8)
}

/** Milestone health: normal | warning | risk */
export function milestoneHealth(item, schedule = [], nowKey = todayKey()) {
  if (!item?.isMilestone) return 'normal'
  const byId = new Map(schedule.map((s) => [s.id, s]))
  let worst = 'normal'
  for (const depId of item.dependsOn || []) {
    const dep = byId.get(depId)
    if (!dep || DONE.has(dep.status)) continue
    const depDate = itemEffectiveDate(dep)
    if (depDate && depDate < nowKey) {
      worst = 'risk'
      break
    }
    const mileDate = itemEffectiveDate(item)
    if (depDate && mileDate) {
      const gap = daysBetween(depDate, mileDate)
      if (gap !== null && gap <= 7) worst = worst === 'risk' ? 'risk' : 'warning'
    } else if (!depDate && mileDate) {
      const until = daysBetween(nowKey, mileDate)
      if (until !== null && until <= 14) worst = worst === 'risk' ? 'risk' : 'warning'
    }
  }
  return worst
}

export function dependencyWarnings(item, schedule = [], nowKey = todayKey()) {
  const byId = new Map(schedule.map((s) => [s.id, s]))
  const warnings = []
  for (const depId of item.dependsOn || []) {
    const dep = byId.get(depId)
    if (!dep || DONE.has(dep.status)) continue
    const depDate = itemEffectiveDate(dep)
    if (depDate && depDate < nowKey) {
      warnings.push({
        kind: 'impact',
        text: `⚠ ${item.title} 일정에 영향 가능`,
        depTitle: dep.title,
      })
      warnings.push({ kind: 'incomplete', text: '선행 일정 미완료', depTitle: dep.title })
    } else if (!DONE.has(dep.status)) {
      warnings.push({ kind: 'incomplete', text: '선행 일정 미완료', depTitle: dep.title })
    }
  }
  return warnings
}

export function groupListView(items, nowKey = todayKey()) {
  const active = items.filter(isActive)
  const thisWeekSet = new Set(weekKeys(nowKey))
  const startNextWeek = addDaysKey(startOfWeekMonday(nowKey), 7)
  const endNextWeek = addDaysKey(startNextWeek, 6)
  const monthPrefix = nowKey.slice(0, 7)

  const buckets = {
    today: [],
    thisWeek: [],
    nextWeek: [],
    thisMonth: [],
    later: [],
    undated: [],
  }

  for (const item of active) {
    const d = item.date
    if (!d) {
      buckets.undated.push(item)
      continue
    }
    if (d <= nowKey) {
      buckets.today.push(item)
      continue
    }
    if (thisWeekSet.has(d)) {
      buckets.thisWeek.push(item)
      continue
    }
    if (d >= startNextWeek && d <= endNextWeek) {
      buckets.nextWeek.push(item)
      continue
    }
    if (d.startsWith(monthPrefix)) {
      buckets.thisMonth.push(item)
      continue
    }
    buckets.later.push(item)
  }

  return buckets
}

export function waitingGroups(items, nowKey = todayKey()) {
  const waiting = items.filter((i) => isActive(i) && i.status === 'waiting')
  return {
    todayFollowUp: waiting.filter((i) => i.followUpDate && i.followUpDate <= nowKey),
    upcomingFollowUp: waiting.filter((i) => i.followUpDate && i.followUpDate > nowKey),
    noFollowUp: waiting.filter((i) => !i.followUpDate),
  }
}
