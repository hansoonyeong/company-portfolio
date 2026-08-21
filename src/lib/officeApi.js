const API_BASE = '/api/office'
const TOKEN_KEY = 'soono-admin-token'

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || ''
}

async function parseError(res, fallback) {
  const text = await res.text().catch(() => '')
  if (!text) return { message: fallback }
  try {
    const err = JSON.parse(text)
    return {
      message: err.error || fallback,
      code: err.code,
      conflict: err.conflict,
      taskId: err.taskId,
      agentId: err.agentId,
      conversationId: err.conversationId,
    }
  } catch {
    return { message: text.slice(0, 200) || fallback }
  }
}

async function officeFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  }

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw Object.assign(new Error('서버에 연결할 수 없습니다.'), { status: 0 })
  }

  if (!res.ok) {
    const err = await parseError(res, '요청에 실패했습니다.')
    throw Object.assign(new Error(err.message), {
      status: res.status,
      code: err.code,
      conflict: err.conflict,
      taskId: err.taskId,
      agentId: err.agentId,
      conversationId: err.conversationId,
    })
  }

  if (res.status === 204) return null
  return res.json()
}

export const getOfficeBundle = () => officeFetch('/bundle')
export const getOfficeProjects = () => officeFetch('/projects')
export const createOfficeProject = (data) =>
  officeFetch('/projects', { method: 'POST', body: JSON.stringify(data) })
export const updateOfficeProject = (id, data) =>
  officeFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteOfficeProject = (id) => officeFetch(`/projects/${id}`, { method: 'DELETE' })

export const getOfficeTasks = () => officeFetch('/tasks')
export const createOfficeTask = (data) =>
  officeFetch('/tasks', { method: 'POST', body: JSON.stringify(data) })
export const updateOfficeTask = (id, data) =>
  officeFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteOfficeTask = (id) => officeFetch(`/tasks/${id}`, { method: 'DELETE' })

export const getOfficeNotes = () => officeFetch('/notes')
export const createOfficeNote = (data) =>
  officeFetch('/notes', { method: 'POST', body: JSON.stringify(data) })
export const updateOfficeNote = (id, data) =>
  officeFetch(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteOfficeNote = (id) => officeFetch(`/notes/${id}`, { method: 'DELETE' })

export const getOfficeMemory = () => officeFetch('/memory')
export const createOfficeMemory = (data) =>
  officeFetch('/memory', { method: 'POST', body: JSON.stringify(data) })
export const updateOfficeMemory = (id, data) =>
  officeFetch(`/memory/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteOfficeMemory = (id) => officeFetch(`/memory/${id}`, { method: 'DELETE' })

export const getOfficeAgents = () => officeFetch('/agents')
export const updateOfficeAgent = (id, data) =>
  officeFetch(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const getOfficeActivity = () => officeFetch('/activity')

export const getOfficeMeetings = () => officeFetch('/meetings')
export const createOfficeMeeting = (data) =>
  officeFetch('/meetings', { method: 'POST', body: JSON.stringify(data) })
export const updateOfficeMeeting = (id, data) =>
  officeFetch(`/meetings/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const getOfficeConversations = () => officeFetch('/conversations')
export const createOfficeConversation = (data) =>
  officeFetch('/conversations', { method: 'POST', body: JSON.stringify(data) })
export const updateOfficeConversation = (id, data) =>
  officeFetch(`/conversations/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteOfficeConversation = (id) =>
  officeFetch(`/conversations/${id}`, { method: 'DELETE' })

export const getAiStatus = () => officeFetch('/ai/status')
export const routeAiAgent = (data) =>
  officeFetch('/ai/route', { method: 'POST', body: JSON.stringify(data) })
export const executeAiWork = (data) =>
  officeFetch('/ai/execute', { method: 'POST', body: JSON.stringify(data) })
export const generateMeetingContributions = (id) =>
  officeFetch(`/ai/meetings/${id}/contributions`, { method: 'POST', body: '{}' })
export const generateMeetingSummary = (id) =>
  officeFetch(`/ai/meetings/${id}/summary`, { method: 'POST', body: '{}' })
