import crypto from 'crypto'
import { readJson, updateJson } from './jsonStore.js'
import {
  seedActivity,
  seedAgents,
  seedConversations,
  seedMeetings,
  seedMemory,
  seedNotes,
  seedProjects,
  seedTasks,
} from './seed.js'

const FILES = {
  projects: 'office-projects.json',
  tasks: 'office-tasks.json',
  notes: 'office-notes.json',
  memory: 'office-memory.json',
  agents: 'office-agents.json',
  activity: 'office-activity.json',
  meetings: 'office-meetings.json',
  conversations: 'office-conversations.json',
}

const now = () => new Date().toISOString()
const id = () => crypto.randomUUID()

async function list(file, seed) {
  const data = await readJson(file, seed)
  return Array.isArray(data) ? data : seed()
}

async function mutate(file, seed, mutator) {
  return updateJson(file, seed, async (items) => {
    const listItems = Array.isArray(items) ? items : seed()
    return mutator(listItems)
  })
}

export async function logActivity(entry) {
  await mutate(FILES.activity, seedActivity, (items) => {
    const row = {
      id: id(),
      type: entry.type,
      projectId: entry.projectId || null,
      taskId: entry.taskId || null,
      agentId: entry.agentId || null,
      message: entry.message,
      createdAt: now(),
    }
    return [row, ...items].slice(0, 500)
  })
}

function applyAgentFromTask(agent, task) {
  if (!task || !agent) return agent
  const updated = { ...agent, updatedAt: now() }

  if (task.status === 'in_progress') {
    updated.state = 'working'
    updated.currentTaskId = task.id
    updated.currentProjectId = task.projectId
    updated.statusMessage = task.title
    updated.currentZone = agent.homeZone
  } else if (task.status === 'waiting') {
    updated.state = 'waiting'
    updated.currentTaskId = task.id
    updated.currentProjectId = task.projectId
    updated.statusMessage = '입력을 기다리는 중'
    updated.currentZone = agent.homeZone
  } else if (task.status === 'done') {
    updated.state = 'done'
    updated.currentTaskId = task.id
    updated.currentProjectId = task.projectId
    updated.statusMessage = '완료'
  } else if (task.status === 'todo' || task.status === 'inbox') {
    if (agent.currentTaskId === task.id) {
      updated.state = 'idle'
      updated.currentTaskId = null
      updated.currentProjectId = null
      updated.statusMessage = '대기 중'
      updated.currentZone = agent.homeZone
    }
  }
  return updated
}

async function syncAgentForTask(task, { forceIdle = false } = {}) {
  if (!task?.assignedAgentId) return null

  let resultAgent = null
  await mutate(FILES.agents, seedAgents, (agents) =>
    agents.map((agent) => {
      if (agent.id !== task.assignedAgentId) return agent
      if (forceIdle) {
        resultAgent = {
          ...agent,
          state: 'idle',
          currentTaskId: null,
          currentProjectId: null,
          statusMessage: '대기 중',
          currentZone: agent.homeZone,
          previousState: null,
          updatedAt: now(),
        }
        return resultAgent
      }
      resultAgent = applyAgentFromTask(agent, task)
      return resultAgent
    }),
  )
  return resultAgent
}

export async function getBusyConflict(agentId, excludeTaskId = null) {
  const agents = await list(FILES.agents, seedAgents)
  const agent = agents.find((a) => a.id === agentId)
  if (!agent) return null
  if (!agent.currentTaskId) return null
  if (excludeTaskId && agent.currentTaskId === excludeTaskId) return null
  if (!['working', 'thinking', 'waiting', 'meeting'].includes(agent.state)) return null
  const tasks = await list(FILES.tasks, seedTasks)
  const current = tasks.find((t) => t.id === agent.currentTaskId)
  return { agent, currentTask: current || null }
}

/* —— Projects —— */
export async function getProjects() {
  return list(FILES.projects, seedProjects)
}

export async function createProject(body) {
  const t = now()
  const project = {
    id: id(),
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    status: body.status || 'active',
    currentGoal: String(body.currentGoal || '').trim(),
    icon: body.icon || '◎',
    color: body.color || '#1a1a1a',
    archived: false,
    createdAt: t,
    updatedAt: t,
  }
  if (!project.name) throw Object.assign(new Error('프로젝트 이름이 필요합니다.'), { status: 400 })

  await mutate(FILES.projects, seedProjects, (items) => [project, ...items])
  await logActivity({
    type: 'project_created',
    projectId: project.id,
    message: `프로젝트 생성: ${project.name}`,
  })
  return project
}

export async function updateProject(projectId, body) {
  let updated = null
  await mutate(FILES.projects, seedProjects, (items) =>
    items.map((item) => {
      if (item.id !== projectId) return item
      updated = {
        ...item,
        name: body.name !== undefined ? String(body.name).trim() : item.name,
        description: body.description !== undefined ? String(body.description).trim() : item.description,
        status: body.status !== undefined ? body.status : item.status,
        currentGoal: body.currentGoal !== undefined ? String(body.currentGoal).trim() : item.currentGoal,
        icon: body.icon !== undefined ? body.icon : item.icon,
        color: body.color !== undefined ? body.color : item.color,
        archived: body.archived !== undefined ? Boolean(body.archived) : item.archived,
        updatedAt: now(),
      }
      return updated
    }),
  )
  if (!updated) throw Object.assign(new Error('프로젝트를 찾을 수 없습니다.'), { status: 404 })
  return updated
}

export async function deleteProject(projectId) {
  let removed = null
  await mutate(FILES.projects, seedProjects, (items) => {
    const next = items.filter((item) => {
      if (item.id !== projectId) return true
      removed = item
      return false
    })
    return next
  })
  if (!removed) throw Object.assign(new Error('프로젝트를 찾을 수 없습니다.'), { status: 404 })
  await logActivity({
    type: 'project_created',
    projectId,
    message: `프로젝트 삭제: ${removed.name}`,
  })
  return { ok: true }
}

/* —— Tasks —— */
export async function getTasks() {
  return list(FILES.tasks, seedTasks)
}

export async function createTask(body) {
  const mode = body.mode === 'queue' ? 'queue' : 'start'
  const assignedAgentId = body.assignedAgentId || null

  if (assignedAgentId && mode === 'start') {
    const conflict = await getBusyConflict(assignedAgentId)
    if (conflict && body.force !== true) {
      const err = Object.assign(new Error('에이전트가 다른 작업을 진행 중입니다.'), {
        status: 409,
        code: 'AGENT_BUSY',
        conflict,
      })
      throw err
    }
  }

  const t = now()
  const status =
    body.status ||
    (mode === 'queue' ? 'todo' : assignedAgentId ? 'in_progress' : 'inbox')
  const task = {
    id: id(),
    projectId: body.projectId || null,
    assignedAgentId,
    title: String(body.title || '').trim(),
    description: String(body.description || '').trim(),
    status,
    priority: body.priority || 'medium',
    dueDate: body.dueDate || null,
    result: '',
    resultFormat: 'text',
    aiGenerated: false,
    generatedByAgentId: null,
    startedAt: status === 'in_progress' ? t : null,
    completedAt: null,
    errorMessage: null,
    waitingFor: body.waitingFor ? String(body.waitingFor).trim() : null,
    waitingSince: status === 'waiting' ? body.waitingSince || t : null,
    followUpDate: body.followUpDate || null,
    scheduleId: body.scheduleId || null,
    usage: null,
    suggestedTasks: [],
    suggestedMemory: [],
    contextMeta: null,
    conversationId: body.conversationId || null,
    createdAt: t,
    updatedAt: t,
  }
  if (!task.title) throw Object.assign(new Error('작업 제목이 필요합니다.'), { status: 400 })

  await mutate(FILES.tasks, seedTasks, (items) => [task, ...items])
  await logActivity({
    type: 'task_created',
    projectId: task.projectId,
    taskId: task.id,
    agentId: task.assignedAgentId,
    message: `작업 생성: ${task.title}`,
  })

  if (task.assignedAgentId && task.status === 'in_progress') {
    await syncAgentForTask(task)
    await logActivity({
      type: 'task_started',
      projectId: task.projectId,
      taskId: task.id,
      agentId: task.assignedAgentId,
      message: `작업 시작: ${task.title}`,
    })
  } else if (task.assignedAgentId) {
    await logActivity({
      type: 'task_assigned',
      projectId: task.projectId,
      taskId: task.id,
      agentId: task.assignedAgentId,
      message: `작업 배정(대기열): ${task.title}`,
    })
  }

  return task
}

export async function updateTask(taskId, body) {
  let previous = null
  let updated = null

  await mutate(FILES.tasks, seedTasks, (items) =>
    items.map((item) => {
      if (item.id !== taskId) return item
      previous = item
      const nextStatus = body.status !== undefined ? body.status : item.status
      updated = {
        ...item,
        projectId: body.projectId !== undefined ? body.projectId : item.projectId,
        assignedAgentId:
          body.assignedAgentId !== undefined ? body.assignedAgentId : item.assignedAgentId,
        title: body.title !== undefined ? String(body.title).trim() : item.title,
        description:
          body.description !== undefined ? String(body.description).trim() : item.description,
        status: nextStatus,
        priority: body.priority !== undefined ? body.priority : item.priority,
        dueDate: body.dueDate !== undefined ? body.dueDate : item.dueDate,
        result: body.result !== undefined ? body.result : item.result,
        resultFormat: body.resultFormat !== undefined ? body.resultFormat : item.resultFormat,
        aiGenerated: body.aiGenerated !== undefined ? body.aiGenerated : item.aiGenerated,
        generatedByAgentId:
          body.generatedByAgentId !== undefined ? body.generatedByAgentId : item.generatedByAgentId,
        startedAt: body.startedAt !== undefined ? body.startedAt : item.startedAt,
        errorMessage: body.errorMessage !== undefined ? body.errorMessage : item.errorMessage,
        waitingFor:
          body.waitingFor !== undefined
            ? body.waitingFor
              ? String(body.waitingFor).trim()
              : null
            : nextStatus !== 'waiting' && body.status !== undefined
              ? null
              : (item.waitingFor ?? null),
        waitingSince:
          body.waitingSince !== undefined
            ? body.waitingSince
            : nextStatus === 'waiting'
              ? item.waitingSince || (previous?.status !== 'waiting' ? now() : item.waitingSince)
              : body.status !== undefined && nextStatus !== 'waiting'
                ? null
                : item.waitingSince ?? null,
        followUpDate:
          body.followUpDate !== undefined ? body.followUpDate : item.followUpDate ?? null,
        scheduleId: body.scheduleId !== undefined ? body.scheduleId : item.scheduleId ?? null,
        usage: body.usage !== undefined ? body.usage : item.usage,
        suggestedTasks:
          body.suggestedTasks !== undefined ? body.suggestedTasks : item.suggestedTasks,
        suggestedMemory:
          body.suggestedMemory !== undefined ? body.suggestedMemory : item.suggestedMemory,
        contextMeta: body.contextMeta !== undefined ? body.contextMeta : item.contextMeta,
        conversationId:
          body.conversationId !== undefined ? body.conversationId : item.conversationId,
        updatedAt: now(),
        completedAt:
          nextStatus === 'done'
            ? item.completedAt || body.completedAt || now()
            : nextStatus !== 'done'
              ? null
              : item.completedAt,
      }
      return updated
    }),
  )

  if (!updated) throw Object.assign(new Error('작업을 찾을 수 없습니다.'), { status: 404 })

  if (
    updated.assignedAgentId &&
    updated.status === 'in_progress' &&
    previous?.status !== 'in_progress'
  ) {
    const conflict = await getBusyConflict(updated.assignedAgentId, updated.id)
    if (conflict && body.force !== true) {
      // revert status change conceptually - re-save previous busy check by rolling back
      await mutate(FILES.tasks, seedTasks, (items) =>
        items.map((item) => (item.id === taskId ? { ...previous, updatedAt: now() } : item)),
      )
      const err = Object.assign(new Error('에이전트가 다른 작업을 진행 중입니다.'), {
        status: 409,
        code: 'AGENT_BUSY',
        conflict,
      })
      throw err
    }
  }

  if (updated.assignedAgentId) {
    await syncAgentForTask(updated)
  }

  if (previous?.status !== updated.status) {
    const type =
      updated.status === 'done'
        ? 'task_completed'
        : updated.status === 'waiting'
          ? 'task_waiting'
          : updated.status === 'in_progress'
            ? 'task_started'
            : 'task_assigned'
    const waitSuffix =
      updated.status === 'waiting' && updated.waitingFor ? ` (대기: ${updated.waitingFor})` : ''
    await logActivity({
      type,
      projectId: updated.projectId,
      taskId: updated.id,
      agentId: updated.assignedAgentId,
      message: `작업 ${updated.status}: ${updated.title}${waitSuffix}`,
    })
  }

  if (
    previous &&
    body.assignedAgentId !== undefined &&
    previous.assignedAgentId !== updated.assignedAgentId
  ) {
    await logActivity({
      type: 'task_reassigned',
      projectId: updated.projectId,
      taskId: updated.id,
      agentId: updated.assignedAgentId,
      message: `작업 재배정: ${updated.title}`,
    })
  }

  if (
    body.result !== undefined &&
    body.result !== previous?.result &&
    !body.aiGenerated &&
    previous?.status === updated.status
  ) {
    await logActivity({
      type: 'manual_result_saved',
      projectId: updated.projectId,
      taskId: updated.id,
      agentId: updated.assignedAgentId,
      message: `작업 결과 저장: ${updated.title}`,
    })
  }

  try {
    const { syncScheduleFromTask } = await import('./scheduleStore.js')
    await syncScheduleFromTask(updated)
  } catch {
    // schedule optional
  }

  return updated
}

export async function deleteTask(taskId) {
  let removed = null
  await mutate(FILES.tasks, seedTasks, (items) =>
    items.filter((item) => {
      if (item.id !== taskId) return true
      removed = item
      return false
    }),
  )
  if (!removed) throw Object.assign(new Error('작업을 찾을 수 없습니다.'), { status: 404 })

  if (removed.assignedAgentId) {
    await mutate(FILES.agents, seedAgents, (agents) =>
      agents.map((agent) => {
        if (agent.id !== removed.assignedAgentId || agent.currentTaskId !== removed.id) return agent
        return {
          ...agent,
          state: 'idle',
          currentTaskId: null,
          currentProjectId: null,
          statusMessage: '대기 중',
          currentZone: agent.homeZone,
          updatedAt: now(),
        }
      }),
    )
  }
  return { ok: true }
}

/* —— Notes —— */
export async function getNotes() {
  return list(FILES.notes, seedNotes)
}

export async function createNote(body) {
  const t = now()
  const note = {
    id: id(),
    projectId: body.projectId || null,
    title: String(body.title || '').trim() || '제목 없음',
    content: String(body.content || '').trim(),
    type: body.type || 'note',
    createdAt: t,
    updatedAt: t,
  }
  await mutate(FILES.notes, seedNotes, (items) => [note, ...items])
  await logActivity({
    type: 'note_created',
    projectId: note.projectId,
    message: `노트 작성: ${note.title}`,
  })
  return note
}

export async function updateNote(noteId, body) {
  let updated = null
  await mutate(FILES.notes, seedNotes, (items) =>
    items.map((item) => {
      if (item.id !== noteId) return item
      updated = {
        ...item,
        projectId: body.projectId !== undefined ? body.projectId : item.projectId,
        title: body.title !== undefined ? String(body.title).trim() : item.title,
        content: body.content !== undefined ? String(body.content).trim() : item.content,
        type: body.type !== undefined ? body.type : item.type,
        updatedAt: now(),
      }
      return updated
    }),
  )
  if (!updated) throw Object.assign(new Error('노트를 찾을 수 없습니다.'), { status: 404 })
  return updated
}

export async function deleteNote(noteId) {
  let removed = false
  await mutate(FILES.notes, seedNotes, (items) =>
    items.filter((item) => {
      if (item.id !== noteId) return true
      removed = true
      return false
    }),
  )
  if (!removed) throw Object.assign(new Error('노트를 찾을 수 없습니다.'), { status: 404 })
  return { ok: true }
}

/* —— Memory —— */
export async function getMemory() {
  return list(FILES.memory, seedMemory)
}

export async function createMemory(body) {
  const t = now()
  const row = {
    id: id(),
    projectId: body.projectId,
    category: body.category || 'business_info',
    title: String(body.title || '').trim(),
    content: String(body.content || '').trim(),
    importance: body.importance || 'normal',
    createdAt: t,
    updatedAt: t,
  }
  if (!row.projectId) throw Object.assign(new Error('projectId가 필요합니다.'), { status: 400 })
  if (!row.title) throw Object.assign(new Error('제목이 필요합니다.'), { status: 400 })

  await mutate(FILES.memory, seedMemory, (items) => [row, ...items])
  await logActivity({
    type: 'memory_added',
    projectId: row.projectId,
    message: `메모리 추가: ${row.title}`,
  })
  return row
}

export async function updateMemory(memoryId, body) {
  let updated = null
  await mutate(FILES.memory, seedMemory, (items) =>
    items.map((item) => {
      if (item.id !== memoryId) return item
      updated = {
        ...item,
        category: body.category !== undefined ? body.category : item.category,
        title: body.title !== undefined ? String(body.title).trim() : item.title,
        content: body.content !== undefined ? String(body.content).trim() : item.content,
        importance: body.importance !== undefined ? body.importance : item.importance,
        updatedAt: now(),
      }
      return updated
    }),
  )
  if (!updated) throw Object.assign(new Error('메모리를 찾을 수 없습니다.'), { status: 404 })
  return updated
}

export async function deleteMemory(memoryId) {
  let removed = false
  await mutate(FILES.memory, seedMemory, (items) =>
    items.filter((item) => {
      if (item.id !== memoryId) return true
      removed = true
      return false
    }),
  )
  if (!removed) throw Object.assign(new Error('메모리를 찾을 수 없습니다.'), { status: 404 })
  return { ok: true }
}

/* —— Agents —— */
export async function getAgents() {
  return list(FILES.agents, seedAgents)
}

export async function updateAgent(agentId, body) {
  let updated = null
  await mutate(FILES.agents, seedAgents, (agents) =>
    agents.map((agent) => {
      if (agent.id !== agentId) return agent
      updated = {
        ...agent,
        state: body.state !== undefined ? body.state : agent.state,
        currentZone: body.currentZone !== undefined ? body.currentZone : agent.currentZone,
        currentTaskId: body.currentTaskId !== undefined ? body.currentTaskId : agent.currentTaskId,
        currentProjectId:
          body.currentProjectId !== undefined ? body.currentProjectId : agent.currentProjectId,
        statusMessage:
          body.statusMessage !== undefined ? body.statusMessage : agent.statusMessage,
        previousState:
          body.previousState !== undefined ? body.previousState : agent.previousState,
        updatedAt: now(),
      }
      if (body.state === 'idle') {
        updated.currentTaskId = null
        updated.currentProjectId = null
        updated.statusMessage = body.statusMessage || '대기 중'
        updated.currentZone = agent.homeZone
        updated.previousState = null
      }
      return updated
    }),
  )
  if (!updated) throw Object.assign(new Error('에이전트를 찾을 수 없습니다.'), { status: 404 })
  await logActivity({
    type: 'agent_state_changed',
    agentId,
    projectId: updated.currentProjectId,
    taskId: updated.currentTaskId,
    message: `${updated.name}: ${updated.state}`,
  })
  return updated
}

export async function setAgentIdle(agentId) {
  return updateAgent(agentId, { state: 'idle' })
}

/* —— Activity —— */
export async function getActivity() {
  return list(FILES.activity, seedActivity)
}

/* —— Meetings —— */
export async function getMeetings() {
  return list(FILES.meetings, seedMeetings)
}

export async function createMeeting(body) {
  const participantAgentIds = Array.isArray(body.participantAgentIds)
    ? body.participantAgentIds
    : []
  if (!participantAgentIds.length) {
    throw Object.assign(new Error('참석자를 선택하세요.'), { status: 400 })
  }

  const t = now()
  const meeting = {
    id: id(),
    projectId: body.projectId || null,
    topic: String(body.topic || '').trim() || '미팅',
    status: 'active',
    participantAgentIds,
    contributions: [],
    decisions: [],
    createdAt: t,
    completedAt: null,
    summary: '',
  }

  // Snapshot previous agent states then move to meeting
  await mutate(FILES.agents, seedAgents, (agents) =>
    agents.map((agent) => {
      if (!participantAgentIds.includes(agent.id)) return agent
      return {
        ...agent,
        previousState: {
          state: agent.state,
          currentZone: agent.currentZone,
          currentTaskId: agent.currentTaskId,
          currentProjectId: agent.currentProjectId,
          statusMessage: agent.statusMessage,
        },
        state: 'meeting',
        currentZone: 'meeting',
        statusMessage: `미팅 중: ${meeting.topic}`,
        updatedAt: now(),
      }
    }),
  )

  await mutate(FILES.meetings, seedMeetings, (items) => [meeting, ...items])
  await logActivity({
    type: 'meeting_started',
    projectId: meeting.projectId,
    message: `미팅 시작: ${meeting.topic}`,
  })
  return meeting
}

export async function updateMeeting(meetingId, body) {
  let updated = null
  let ending = false

  await mutate(FILES.meetings, seedMeetings, (items) =>
    items.map((item) => {
      if (item.id !== meetingId) return item
      ending = body.status === 'completed' && item.status !== 'completed'
      updated = {
        ...item,
        topic: body.topic !== undefined ? String(body.topic).trim() : item.topic,
        status: body.status !== undefined ? body.status : item.status,
        summary: body.summary !== undefined ? body.summary : item.summary,
        contributions:
          body.contributions !== undefined ? body.contributions : item.contributions || [],
        decisions: body.decisions !== undefined ? body.decisions : item.decisions || [],
        completedAt: ending ? now() : item.completedAt,
      }
      return updated
    }),
  )

  if (!updated) throw Object.assign(new Error('미팅을 찾을 수 없습니다.'), { status: 404 })

  if (ending) {
    const tasks = await list(FILES.tasks, seedTasks)
    await mutate(FILES.agents, seedAgents, (agents) =>
      agents.map((agent) => {
        if (!updated.participantAgentIds.includes(agent.id)) return agent
        const prev = agent.previousState
        if (prev) {
          // Prefer restoring in_progress task to working
          const task = prev.currentTaskId
            ? tasks.find((t) => t.id === prev.currentTaskId)
            : null
          if (task && task.status === 'in_progress') {
            return {
              ...agent,
              state: 'working',
              currentZone: agent.homeZone,
              currentTaskId: task.id,
              currentProjectId: task.projectId,
              statusMessage: task.title,
              previousState: null,
              updatedAt: now(),
            }
          }
          if (task && task.status === 'waiting') {
            return {
              ...agent,
              state: 'waiting',
              currentZone: agent.homeZone,
              currentTaskId: task.id,
              currentProjectId: task.projectId,
              statusMessage: '입력을 기다리는 중',
              previousState: null,
              updatedAt: now(),
            }
          }
          return {
            ...agent,
            state: prev.state === 'meeting' ? 'idle' : prev.state,
            currentZone: prev.currentZone || agent.homeZone,
            currentTaskId: prev.currentTaskId,
            currentProjectId: prev.currentProjectId,
            statusMessage: prev.statusMessage || '대기 중',
            previousState: null,
            updatedAt: now(),
          }
        }
        return {
          ...agent,
          state: 'idle',
          currentZone: agent.homeZone,
          statusMessage: '대기 중',
          previousState: null,
          updatedAt: now(),
        }
      }),
    )
    await logActivity({
      type: 'meeting_completed',
      projectId: updated.projectId,
      message: `미팅 종료: ${updated.topic}`,
    })
  }

  return updated
}

/* —— Conversations —— */
export async function getConversations() {
  return list(FILES.conversations, seedConversations)
}

export async function getConversation(conversationId) {
  const items = await getConversations()
  const found = items.find((c) => c.id === conversationId)
  if (!found) throw Object.assign(new Error('대화를 찾을 수 없습니다.'), { status: 404 })
  return found
}

export async function createConversation(body) {
  const t = now()
  const conversation = {
    id: id(),
    projectId: body.projectId || null,
    title: String(body.title || '').trim() || '새 대화',
    agentId: body.agentId || 'auto',
    messages: [],
    createdAt: t,
    updatedAt: t,
  }
  await mutate(FILES.conversations, seedConversations, (items) => [conversation, ...items])
  return conversation
}

export async function updateConversation(conversationId, body) {
  let updated = null
  await mutate(FILES.conversations, seedConversations, (items) =>
    items.map((item) => {
      if (item.id !== conversationId) return item
      updated = {
        ...item,
        title: body.title !== undefined ? String(body.title).trim() : item.title,
        projectId: body.projectId !== undefined ? body.projectId : item.projectId,
        agentId: body.agentId !== undefined ? body.agentId : item.agentId,
        messages: body.messages !== undefined ? body.messages : item.messages,
        updatedAt: now(),
      }
      return updated
    }),
  )
  if (!updated) throw Object.assign(new Error('대화를 찾을 수 없습니다.'), { status: 404 })
  return updated
}

export async function deleteConversation(conversationId) {
  let removed = false
  await mutate(FILES.conversations, seedConversations, (items) =>
    items.filter((item) => {
      if (item.id !== conversationId) return true
      removed = true
      return false
    }),
  )
  if (!removed) throw Object.assign(new Error('대화를 찾을 수 없습니다.'), { status: 404 })
  return { ok: true }
}

export async function appendConversationMessage(conversationId, message) {
  let updated = null
  await mutate(FILES.conversations, seedConversations, (items) =>
    items.map((item) => {
      if (item.id !== conversationId) return item
      const row = {
        id: id(),
        role: message.role,
        agentId: message.agentId || null,
        content: String(message.content || ''),
        taskId: message.taskId || null,
        createdAt: now(),
      }
      updated = {
        ...item,
        messages: [...(item.messages || []), row],
        updatedAt: now(),
        title:
          item.title === '새 대화' && message.role === 'user'
            ? String(message.content || '').slice(0, 40) || item.title
            : item.title,
      }
      return updated
    }),
  )
  if (!updated) throw Object.assign(new Error('대화를 찾을 수 없습니다.'), { status: 404 })
  return updated
}

export async function getTask(taskId) {
  const tasks = await getTasks()
  const task = tasks.find((t) => t.id === taskId)
  if (!task) throw Object.assign(new Error('작업을 찾을 수 없습니다.'), { status: 404 })
  return task
}

export async function getProject(projectId) {
  if (!projectId) return null
  const projects = await getProjects()
  return projects.find((p) => p.id === projectId) || null
}

export async function getOfficeBundle() {
  const scheduleMod = await import('./scheduleStore.js')
  const [projects, tasks, notes, memory, agents, activity, meetings, conversations, schedule] =
    await Promise.all([
      getProjects(),
      getTasks(),
      getNotes(),
      getMemory(),
      getAgents(),
      getActivity(),
      getMeetings(),
      getConversations(),
      scheduleMod.getScheduleItems(),
    ])
  return { projects, tasks, notes, memory, agents, activity, meetings, conversations, schedule }
}
