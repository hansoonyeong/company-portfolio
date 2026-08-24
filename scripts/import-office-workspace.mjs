/**
 * Safe one-time import of real Korean workspace content into Office JSON.
 * - Never touches DOS Taekwondo
 * - Never deletes existing records
 * - Skips duplicate memory/tasks (same projectId + title)
 * - Updates project description/goal only when still matching known seed defaults
 *
 * Usage: node scripts/import-office-workspace.mjs
 */
import * as office from '../server/office/service.js'
import { DOS_ID, SEED_DEFAULTS, PROJECTS, MEMORY, TASKS } from './office-workspace-payload.mjs'

const report = {
  existingProjects: [],
  createdProjects: [],
  memoryAdded: {},
  tasksAdded: {},
  skippedDuplicates: [],
  preservedConflicts: [],
  waitingTasks: [],
  notAsMemory: [
    '최종 공급사 MOQ / 도매·소매가',
    '확정된 펫트릿 제조사',
    '최종 예식·식사 시간 및 정원',
    'Hangeul Snack 최종 선적일',
    '확정 론칭 예산',
    'Kimchi House 현재 차수 상품 가격',
  ],
}

function norm(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
}

async function main() {
  const projects = await office.getProjects()
  const memory = await office.getMemory()
  const tasks = await office.getTasks()

  const dos = projects.find((p) => p.id === DOS_ID || p.name === 'DOS Taekwondo')
  if (dos) report.existingProjects.push(`${dos.name} (미수정 보존)`)

  for (const desired of PROJECTS) {
    const existing = projects.find((p) => p.id === desired.id || p.name === desired.name)
    if (!existing) {
      const created = await office.createProject({
        name: desired.name,
        description: desired.description,
        status: desired.status,
        currentGoal: desired.currentGoal,
      })
      report.createdProjects.push(created.name)
      desired._resolvedId = created.id
      continue
    }
    if (!report.existingProjects.includes(existing.name) && existing.id !== DOS_ID) {
      report.existingProjects.push(existing.name)
    }
    desired._resolvedId = existing.id

    if (existing.id === DOS_ID) continue

    const seed = SEED_DEFAULTS[existing.id]
    const patch = {}
    if (seed) {
      if (existing.description === seed.description) patch.description = desired.description
      else if (existing.description !== desired.description) {
        report.preservedConflicts.push(
          `프로젝트 ${existing.name} description (기존 사용자/시드 값 보존)`,
        )
      }
      if (existing.currentGoal === seed.currentGoal) patch.currentGoal = desired.currentGoal
      else if (existing.currentGoal !== desired.currentGoal) {
        report.preservedConflicts.push(`프로젝트 ${existing.name} currentGoal (기존 값 보존)`)
      }
    } else {
      if (!existing.description) patch.description = desired.description
      if (!existing.currentGoal) patch.currentGoal = desired.currentGoal
    }
    if (desired.status && existing.status !== desired.status) {
      if (existing.status === 'planning' || existing.status === 'active') {
        patch.status = desired.status
      }
    }
    if (Object.keys(patch).length) {
      await office.updateProject(existing.id, patch)
    }
  }

  const idByKey = {}
  for (const desired of PROJECTS) {
    idByKey[desired.id] = desired._resolvedId || desired.id
  }

  for (const [projKey, items] of Object.entries(MEMORY)) {
    const projectId = idByKey[projKey]
    report.memoryAdded[projKey] = 0
    for (const item of items) {
      const dup = memory.find(
        (m) => m.projectId === projectId && norm(m.title) === norm(item.title),
      )
      if (dup) {
        report.skippedDuplicates.push(`Memory: ${item.title} (${projKey})`)
        continue
      }
      await office.createMemory({ projectId, ...item })
      report.memoryAdded[projKey] += 1
    }
  }

  let taskList = await office.getTasks()

  for (const [projKey, items] of Object.entries(TASKS)) {
    const projectId = idByKey[projKey]
    report.tasksAdded[projKey] = 0
    for (const item of items) {
      const dup = taskList.find(
        (t) => t.projectId === projectId && norm(t.title) === norm(item.title),
      )
      if (dup) {
        report.skippedDuplicates.push(`Task: ${item.title} (${projKey})`)
        continue
      }

      const created = await office.createTask({
        projectId,
        assignedAgentId: item.assignedAgentId,
        title: item.title,
        description: item.description,
        priority: item.priority,
        mode: 'queue',
        status: 'todo',
      })

      const patch = {
        status: item.status,
        force: true,
      }
      if (item.waitingFor) patch.waitingFor = item.waitingFor
      if (item.status === 'in_progress') {
        patch.startedAt = new Date().toISOString()
      }

      await office.updateTask(created.id, patch)
      if (item.status === 'waiting') {
        report.waitingTasks.push(`${item.title} — ${item.waitingFor}`)
      }
      report.tasksAdded[projKey] += 1
      taskList = await office.getTasks()
    }
  }

  const finalProjects = await office.getProjects()
  const finalMemory = await office.getMemory()
  const finalTasks = await office.getTasks()
  const names = finalProjects.map((p) => p.name)
  const required = ['soono', 'Kimchi House AU', 'Hangeul Snack', 'Dog Treats', 'Wedding']
  const missing = required.filter((n) => !names.includes(n))
  const dosUntouched = finalProjects.find((p) => p.id === DOS_ID)

  console.log(
    JSON.stringify(
      {
        report,
        missing,
        dosUntouched: dosUntouched?.name,
        counts: {
          projects: finalProjects.length,
          memory: finalMemory.length,
          tasks: finalTasks.length,
          waiting: finalTasks.filter((t) => t.status === 'waiting').length,
        },
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
