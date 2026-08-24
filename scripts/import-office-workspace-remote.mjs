/**
 * Import the same Korean workspace payload into a remote Office API.
 *
 * Usage:
 *   ADMIN_PASSWORD=... OFFICE_API_BASE=https://soono.au node scripts/import-office-workspace-remote.mjs
 */
import { DOS_ID, SEED_DEFAULTS, PROJECTS, MEMORY, TASKS } from './office-workspace-payload.mjs'

const BASE = (process.env.OFFICE_API_BASE || 'https://soono.au').replace(/\/$/, '')
const PASSWORD = process.env.ADMIN_PASSWORD || ''

async function api(token, method, pathName, body) {
  const res = await fetch(`${BASE}/api/office${pathName}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText)
    err.status = res.status
    err.code = data?.code
    throw err
  }
  return data
}

async function main() {
  if (!PASSWORD) {
    throw new Error('ADMIN_PASSWORD env is required for remote import')
  }
  const login = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: PASSWORD }),
  })
  const loginJson = await login.json()
  if (!login.ok || !loginJson.token) {
    throw new Error(`Login failed: ${loginJson.error || login.status}`)
  }
  const token = loginJson.token

  const projects = await api(token, 'GET', '/projects')
  const memory = await api(token, 'GET', '/memory')
  let taskList = await api(token, 'GET', '/tasks')

  const report = {
    memoryAdded: {},
    tasksAdded: {},
    skippedDuplicates: [],
    preservedConflicts: [],
    waitingTasks: [],
    existingProjects: projects.map((p) => p.name),
    createdProjects: [],
  }

  const norm = (s) =>
    String(s || '')
      .trim()
      .toLowerCase()
  const idByKey = {}

  for (const desired of PROJECTS) {
    const existing = projects.find((p) => p.id === desired.id || p.name === desired.name)
    if (!existing) {
      const created = await api(token, 'POST', '/projects', {
        name: desired.name,
        description: desired.description,
        status: desired.status,
        currentGoal: desired.currentGoal,
      })
      idByKey[desired.id] = created.id
      report.createdProjects.push(created.name)
      continue
    }
    idByKey[desired.id] = existing.id
    if (existing.id === DOS_ID) continue

    const seed = SEED_DEFAULTS[existing.id]
    const patch = {}
    if (seed) {
      if (existing.description === seed.description) patch.description = desired.description
      else if (existing.description !== desired.description) {
        report.preservedConflicts.push(`프로젝트 ${existing.name} description 보존`)
      }
      if (existing.currentGoal === seed.currentGoal) patch.currentGoal = desired.currentGoal
      else if (existing.currentGoal !== desired.currentGoal) {
        report.preservedConflicts.push(`프로젝트 ${existing.name} currentGoal 보존`)
      }
    }
    if (desired.status && existing.status !== desired.status) patch.status = desired.status
    if (Object.keys(patch).length) {
      await api(token, 'PUT', `/projects/${existing.id}`, patch)
    }
  }

  for (const [projKey, items] of Object.entries(MEMORY)) {
    const projectId = idByKey[projKey]
    report.memoryAdded[projKey] = 0
    for (const item of items) {
      if (memory.some((m) => m.projectId === projectId && norm(m.title) === norm(item.title))) {
        report.skippedDuplicates.push(`Memory: ${item.title}`)
        continue
      }
      await api(token, 'POST', '/memory', { projectId, ...item })
      report.memoryAdded[projKey] += 1
    }
  }

  for (const [projKey, items] of Object.entries(TASKS)) {
    const projectId = idByKey[projKey]
    report.tasksAdded[projKey] = 0
    for (const item of items) {
      if (taskList.some((t) => t.projectId === projectId && norm(t.title) === norm(item.title))) {
        report.skippedDuplicates.push(`Task: ${item.title}`)
        continue
      }
      const created = await api(token, 'POST', '/tasks', {
        projectId,
        assignedAgentId: item.assignedAgentId,
        title: item.title,
        description: item.description,
        priority: item.priority,
        mode: 'queue',
        status: 'todo',
      })
      const patch = { status: item.status, force: true }
      if (item.waitingFor) patch.waitingFor = item.waitingFor
      if (item.status === 'in_progress') patch.startedAt = new Date().toISOString()
      await api(token, 'PUT', `/tasks/${created.id}`, patch)
      if (item.status === 'waiting') report.waitingTasks.push(`${item.title} — ${item.waitingFor}`)
      report.tasksAdded[projKey] += 1
      taskList = await api(token, 'GET', '/tasks')
    }
  }

  const bundle = await api(token, 'GET', '/bundle')
  console.log(
    JSON.stringify(
      {
        report,
        projects: bundle.projects.map((p) => p.name),
        memory: bundle.memory.length,
        tasks: bundle.tasks.length,
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
