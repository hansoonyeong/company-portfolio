/**
 * Build clipboard-ready briefs from Office data (Manual Mode helper).
 * Selective — critical + important memory preferred.
 */

function memoryLines(items = []) {
  const critical = items.filter((m) => m.importance === 'critical')
  const important = items.filter((m) => m.importance === 'important')
  const normal = items.filter((m) => m.importance === 'normal').slice(0, 4)
  const selected = [...critical, ...important, ...normal]
  if (!selected.length) return 'None stored'
  return selected.map((m) => `- [${m.importance}] ${m.title}: ${m.content}`).join('\n')
}

export function buildTaskBrief({ project, task, memory = [], notes = [] }) {
  const projectMemory = memory.filter((m) => m.projectId === project?.id)
  const relevantNotes = notes
    .filter((n) => n.projectId === project?.id)
    .slice(0, 3)
    .map((n) => `- ${n.title}: ${String(n.content || '').slice(0, 160)}`)
    .join('\n')

  return [
    'PROJECT',
    project?.name || 'Unspecified',
    '',
    'TASK',
    task?.title || '',
    '',
    'GOAL',
    project?.currentGoal || '—',
    '',
    'PROJECT CONTEXT',
    memoryLines(projectMemory),
    '',
    relevantNotes ? `NOTES\n${relevantNotes}\n` : '',
    'INSTRUCTION',
    task?.description || task?.title || '',
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')
    .trim()
}

export function buildProjectBrief({ project, memory = [], tasks = [], notes = [] }) {
  const projectMemory = memory.filter((m) => m.projectId === project?.id)
  const openTasks = tasks
    .filter((t) => t.projectId === project?.id && t.status !== 'done')
    .slice(0, 8)
    .map((t) => `- [${t.status}/${t.priority}] ${t.title}`)
    .join('\n')
  const usefulNotes = notes
    .filter((n) => n.projectId === project?.id)
    .slice(0, 4)
    .map((n) => `- ${n.title}: ${String(n.content || '').slice(0, 160)}`)
    .join('\n')

  return [
    'PROJECT',
    project?.name || '',
    '',
    'DESCRIPTION',
    project?.description || '—',
    '',
    'CURRENT GOAL',
    project?.currentGoal || '—',
    '',
    'PROJECT MEMORY',
    memoryLines(projectMemory),
    '',
    'OPEN TASKS',
    openTasks || 'None',
    '',
    'NOTES',
    usefulNotes || 'None',
  ].join('\n')
}

export async function copyText(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }
  return false
}
