/** soono AI Office — zones & helpers (agent data comes from API) */

export const ZONES = [
  { id: 'executive', label: '경영', x: 6, y: 8, w: 22, h: 30 },
  { id: 'marketing', label: '마케팅', x: 32, y: 6, w: 24, h: 28 },
  { id: 'creative', label: '크리에이티브', x: 60, y: 6, w: 22, h: 28 },
  { id: 'research', label: '리서치', x: 6, y: 44, w: 20, h: 26 },
  { id: 'sales', label: '세일즈', x: 30, y: 42, w: 20, h: 26 },
  { id: 'development', label: '개발', x: 54, y: 42, w: 22, h: 26 },
  { id: 'operations', label: '운영', x: 80, y: 42, w: 16, h: 26 },
  { id: 'meeting', label: '미팅룸', x: 78, y: 8, w: 18, h: 28 },
  { id: 'coffee', label: '커피', x: 4, y: 76, w: 18, h: 18 },
]

export function getZoneById(zoneId) {
  return ZONES.find((z) => z.id === zoneId) ?? ZONES[0]
}

export function getAgentFloorPosition(agent, agentsInSameZone = []) {
  const zone = getZoneById(agent.currentZone || agent.zone || agent.homeZone)
  const siblings = agentsInSameZone.filter(
    (a) => (a.currentZone || a.zone || a.homeZone) === (agent.currentZone || agent.zone || agent.homeZone),
  )
  const index = Math.max(0, siblings.findIndex((a) => a.id === agent.id))
  const cols = Math.min(3, Math.max(1, siblings.length))
  const col = index % cols
  const row = Math.floor(index / cols)
  const insetX = zone.w * 0.22
  const insetY = zone.h * 0.38
  const stepX = cols > 1 ? (zone.w - insetX * 2) / (cols - 1) : 0
  const x = zone.x + insetX + col * stepX
  const y = zone.y + insetY + row * (zone.h * 0.22)
  return { x, y }
}

export function countByState(agents) {
  const working = agents.filter((a) => a.state === 'working' || a.state === 'thinking').length
  const waiting = agents.filter((a) => a.state === 'waiting').length
  const available = agents.filter((a) => a.state === 'idle' || a.state === 'done').length
  return { working, waiting, available }
}

export function enrichAgent(agent, { projects = [], tasks = [] } = {}) {
  const task = tasks.find((t) => t.id === agent.currentTaskId)
  const project = projects.find((p) => p.id === agent.currentProjectId)
  const openTasks = tasks.filter((t) => t.assignedAgentId === agent.id && t.status !== 'done')
  const waitingTask = openTasks.find((t) => t.status === 'waiting')
  const workingTask = openTasks.find((t) => t.status === 'in_progress') || task

  let derivedState = agent.state
  if (agent.state === 'meeting') {
    derivedState = 'meeting'
  } else if (waitingTask) {
    derivedState = 'waiting'
  } else if (workingTask || agent.state === 'working' || agent.state === 'thinking') {
    derivedState = agent.state === 'thinking' ? 'thinking' : 'working'
  } else if (!openTasks.length && (agent.state === 'idle' || agent.state === 'done')) {
    derivedState = 'idle'
  }

  return {
    ...agent,
    state: derivedState,
    zone: agent.currentZone || agent.homeZone,
    currentTask: workingTask?.title || waitingTask?.title || task?.title || null,
    project: project?.name || null,
  }
}

export function buildAriaLabel(agent) {
  const bits = [`${agent.name} AI`]
  if (agent.state === 'working' && agent.currentTask) {
    bits.push(`${agent.project ? `${agent.project} ` : ''}${agent.currentTask} 작업 중`)
  } else if (agent.state === 'waiting') {
    bits.push(agent.statusMessage || '입력 대기')
  } else if (agent.state === 'thinking') {
    bits.push(agent.statusMessage || '생각 중')
  } else if (agent.state === 'meeting') {
    bits.push('미팅 중')
  } else if (agent.state === 'done') {
    bits.push('완료')
  } else {
    bits.push(agent.statusMessage || agent.state || '대기')
  }
  return bits.join(', ')
}
