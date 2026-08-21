import { buildAiContext } from './contextBuilder.js'
import { chatCompletion } from './openaiClient.js'
import { parseAiResult } from './resultFormatter.js'
import { routeAgent } from './router.js'
import { isOpenAiConfigured } from './config.js'
import * as office from '../office/service.js'

const MAX_MESSAGE = 8000

function assertConfigured() {
  if (!isOpenAiConfigured()) {
    throw Object.assign(new Error('OpenAI가 아직 설정되지 않았습니다. OPENAI_API_KEY를 서버 환경에 추가하세요.'), {
      status: 503,
      code: 'OPENAI_NOT_CONFIGURED',
    })
  }
}

async function setAgentState(agentId, patch) {
  return office.updateAgent(agentId, patch)
}

/**
 * Main AI execution entry — user-triggered only.
 */
export async function executeAiWork(body) {
  assertConfigured()

  const message = String(body.message || '').trim()
  if (!message) throw Object.assign(new Error('메시지를 입력하세요.'), { status: 400 })
  if (message.length > MAX_MESSAGE) {
    throw Object.assign(new Error('메시지가 너무 깁니다.'), { status: 400 })
  }

  let project = null
  if (body.projectId) {
    project = await office.getProject(body.projectId)
    if (!project) throw Object.assign(new Error('프로젝트를 찾을 수 없습니다.'), { status: 404 })
  }

  let route = null
  let agentId = body.agentId === 'auto' || !body.agentId ? null : body.agentId
  if (!agentId) {
    route = await routeAgent(message, { allowLlm: true })
    agentId = route.agentId
  }

  const agents = await office.getAgents()
  const agent = agents.find((a) => a.id === agentId)
  if (!agent) throw Object.assign(new Error('에이전트를 찾을 수 없습니다.'), { status: 404 })

  let conversation = null
  let task = null
  if (body.taskId) {
    task = await office.getTask(body.taskId)
    if (task.assignedAgentId && task.assignedAgentId !== agentId) {
      agentId = task.assignedAgentId
    }
  }

  if (body.conversationId) {
    conversation = await office.getConversation(body.conversationId)
  } else if (task?.conversationId) {
    conversation = await office.getConversation(task.conversationId)
  } else if (body.createConversation !== false) {
    conversation = await office.createConversation({
      projectId: project?.id || null,
      agentId,
      title: message.slice(0, 40),
    })
  }

  if (!task) {
    try {
      task = await office.createTask({
        projectId: project?.id || null,
        assignedAgentId: agentId,
        title: message.slice(0, 80),
        description: message,
        status: 'in_progress',
        conversationId: conversation?.id || null,
        mode: 'start',
        force: body.force === true,
      })
    } catch (err) {
      if (err.code === 'AGENT_BUSY') throw err
      throw err
    }
  }

  const startedAt = new Date().toISOString()
  await office.updateTask(task.id, {
    status: 'in_progress',
    assignedAgentId: agentId,
    startedAt: task.startedAt || startedAt,
    errorMessage: null,
    conversationId: conversation?.id || task.conversationId || null,
  })

  await setAgentState(agentId, {
    state: 'thinking',
    statusMessage: '요청을 이해하는 중...',
    currentTaskId: task.id,
    currentProjectId: project?.id || null,
  })

  await office.logActivity({
    type: 'ai_task_started',
    projectId: project?.id || null,
    taskId: task.id,
    agentId,
    message: `AI 작업 시작 (${agent.name}): ${task.title}`,
  })

  const priorMessages = conversation?.messages || []

  try {
    const [memory, tasks, notes, activity] = await Promise.all([
      office.getMemory(),
      office.getTasks(),
      office.getNotes(),
      office.getActivity(),
    ])

    const ctx = buildAiContext({
      agent,
      project,
      memory,
      tasks,
      notes,
      activity,
      task,
      conversationMessages: priorMessages,
      userMessage: message,
    })

    if (conversation) {
      conversation = await office.appendConversationMessage(conversation.id, {
        role: 'user',
        content: message,
        taskId: task.id,
      })
    }

    await setAgentState(agentId, {
      state: 'working',
      statusMessage: `작업 중: ${task.title}`,
      currentTaskId: task.id,
      currentProjectId: project?.id || null,
    })

    const completion = await chatCompletion({
      system: ctx.system,
      user: ctx.user,
      history: ctx.history,
    })

    const parsed = parseAiResult(completion.content)
    const completedAt = new Date().toISOString()

    const updatedTask = await office.updateTask(task.id, {
      status: 'done',
      result: parsed.result,
      resultFormat: 'text',
      aiGenerated: true,
      generatedByAgentId: agentId,
      completedAt,
      errorMessage: null,
      usage: completion.usage,
      suggestedTasks: parsed.suggestedTasks,
      suggestedMemory: parsed.suggestedMemory,
      contextMeta: ctx.meta,
    })

    await setAgentState(agentId, {
      state: 'done',
      statusMessage: '작업 완료',
      currentTaskId: task.id,
      currentProjectId: project?.id || null,
    })

    await office.logActivity({
      type: 'ai_task_completed',
      projectId: project?.id || null,
      taskId: task.id,
      agentId,
      message: `AI 작업 완료 (${agent.name}): ${task.title}`,
    })

    if (conversation) {
      conversation = await office.appendConversationMessage(conversation.id, {
        role: 'assistant',
        agentId,
        content: parsed.result,
        taskId: task.id,
      })
    }

    return {
      agentId,
      taskId: task.id,
      conversationId: conversation?.id || null,
      result: parsed.result,
      suggestedTasks: parsed.suggestedTasks,
      suggestedMemory: parsed.suggestedMemory,
      usage: completion.usage,
      route,
      contextMeta: ctx.meta,
      task: updatedTask,
    }
  } catch (err) {
    const friendly =
      err.code === 'OPENAI_NOT_CONFIGURED'
        ? err.message
        : 'AI 요청에 실패했습니다. 다시 시도하세요.'

    await office.updateTask(task.id, {
      status: 'waiting',
      errorMessage: friendly,
      aiGenerated: false,
      // do not mark done
    })

    await setAgentState(agentId, {
      state: 'waiting',
      statusMessage: '확인이 필요합니다',
      currentTaskId: task.id,
      currentProjectId: project?.id || null,
    })

    await office.logActivity({
      type: 'ai_task_failed',
      projectId: project?.id || null,
      taskId: task.id,
      agentId,
      message: `AI 작업 실패 (${agent.name}): ${task.title}`,
    })

    const wrapped = Object.assign(new Error(friendly), {
      status: err.status || 502,
      code: err.code || 'AI_EXECUTION_FAILED',
      taskId: task.id,
      agentId,
      conversationId: conversation?.id || null,
    })
    throw wrapped
  }
}

export async function generateMeetingContributions(meetingId) {
  assertConfigured()
  const meetings = await office.getMeetings()
  const meeting = meetings.find((m) => m.id === meetingId)
  if (!meeting) throw Object.assign(new Error('미팅을 찾을 수 없습니다.'), { status: 404 })

  const project = meeting.projectId ? await office.getProject(meeting.projectId) : null
  const [memory, tasks, notes, activity, agents] = await Promise.all([
    office.getMemory(),
    office.getTasks(),
    office.getNotes(),
    office.getActivity(),
    office.getAgents(),
  ])

  const contributions = [...(meeting.contributions || [])]

  for (const agentId of meeting.participantAgentIds) {
    if (agentId === 'chief-of-staff') continue // synthesize later
    const agent = agents.find((a) => a.id === agentId)
    if (!agent) continue

    const ctx = buildAiContext({
      agent,
      project,
      memory,
      tasks,
      notes,
      activity,
      task: null,
      conversationMessages: [],
      userMessage: `미팅 주제: ${meeting.topic}\n당신의 역할 관점에서 핵심 의견·리스크·제안을 간결히 작성하세요.`,
    })

    const completion = await chatCompletion({
      system: ctx.system,
      user: ctx.user,
      history: [],
      temperature: 0.6,
    })

    contributions.push({
      agentId,
      content: completion.content,
      createdAt: new Date().toISOString(),
      aiGenerated: true,
    })
  }

  // Chief of Staff synthesis if selected
  if (meeting.participantAgentIds.includes('chief-of-staff')) {
    const cos = agents.find((a) => a.id === 'chief-of-staff')
    const others = contributions.map((c) => `[${c.agentId}]\n${c.content}`).join('\n\n')
    const completion = await chatCompletion({
      system: (await import('./agentPrompts.js')).getAgentPrompt('chief-of-staff').systemPrompt,
      user: `미팅 주제: ${meeting.topic}\n프로젝트: ${project?.name || '미지정'}\n\n참석자 기여:\n${others}\n\n역할별 기여를 조율해 의사결정 포인트와 다음 액션을 제시하세요.`,
      history: [],
    })
    contributions.push({
      agentId: 'chief-of-staff',
      content: completion.content,
      createdAt: new Date().toISOString(),
      aiGenerated: true,
    })
  }

  return office.updateMeeting(meetingId, { contributions })
}

export async function generateMeetingSummary(meetingId) {
  assertConfigured()
  const meetings = await office.getMeetings()
  const meeting = meetings.find((m) => m.id === meetingId)
  if (!meeting) throw Object.assign(new Error('미팅을 찾을 수 없습니다.'), { status: 404 })

  const project = meeting.projectId ? await office.getProject(meeting.projectId) : null
  const contributions = meeting.contributions || []
  const body = contributions.map((c) => `[${c.agentId}]\n${c.content}`).join('\n\n')

  const { getAgentPrompt } = await import('./agentPrompts.js')
  const completion = await chatCompletion({
    system: getAgentPrompt('chief-of-staff').systemPrompt,
    user: `미팅 주제: ${meeting.topic}\n프로젝트: ${project?.name || '미지정'}\n\n기여 내용:\n${body || '(기여 없음)'}\n\n미팅 요약을 작성하세요. 결정사항, 열린 이슈, 다음 액션을 포함하세요.`,
  })

  return office.updateMeeting(meetingId, { summary: completion.content })
}
