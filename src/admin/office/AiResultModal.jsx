import { useEffect, useId, useRef, useState } from 'react'
import {
  createOfficeMemory,
  createOfficeNote,
  createOfficeTask,
  updateOfficeAgent,
  updateOfficeTask,
} from '../../lib/officeApi'
import { MEMORY_CATEGORY_LABEL, PRIORITY_LABEL, useOfficeData } from '../OfficeDataContext'
import { buildTaskBrief, copyText } from './briefBuilder'

export default function AiResultModal({ taskId, onClose, onChanged }) {
  const titleId = useId()
  const resultRef = useRef(null)
  const { tasks, projects, agents, memory, notes, refresh, isManualMode, isAiMode } = useOfficeData()
  const task = tasks.find((t) => t.id === taskId)
  const [draft, setDraft] = useState('')
  const [waitingFor, setWaitingFor] = useState('')
  const [agentId, setAgentId] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [contextOpen, setContextOpen] = useState(false)
  const [waitOpen, setWaitOpen] = useState(false)
  const [noteForm, setNoteForm] = useState({ title: '', content: '' })
  const [memoryForm, setMemoryForm] = useState({
    title: '',
    content: '',
    category: 'current_status',
    importance: 'normal',
  })
  const [selectedSuggestions, setSelectedSuggestions] = useState({})
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (task) {
      setDraft(task.result || '')
      setWaitingFor(task.waitingFor || '')
      setAgentId(task.assignedAgentId || '')
      setNoteForm({
        title: task.title || 'Work result',
        content: task.result || '',
      })
      setMemoryForm((f) => ({
        ...f,
        title: task.title || 'Work result',
        content: task.result || '',
      }))
    }
  }, [task])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!task) return null

  const agent = agents.find(
    (a) => a.id === task.generatedByAgentId || a.id === task.assignedAgentId,
  )
  const project = projects.find((p) => p.id === task.projectId)
  const suggestions = Array.isArray(task.suggestedTasks) ? task.suggestedTasks : []
  const showAiBadge = Boolean(task.aiGenerated) && isAiMode
  const isFailedAi = Boolean(task.errorMessage) && !task.aiGenerated

  async function saveResult() {
    await updateOfficeTask(task.id, {
      result: draft,
      aiGenerated: task.aiGenerated || false,
    })
    await refresh()
    await onChanged?.()
    setMsg('결과 저장됨')
  }

  async function markDone() {
    await updateOfficeTask(task.id, {
      status: 'done',
      result: draft,
      errorMessage: null,
      waitingFor: null,
      aiGenerated: task.aiGenerated || false,
    })
    await refresh()
    await onChanged?.()
    onClose?.()
  }

  async function markWaiting() {
    await updateOfficeTask(task.id, {
      status: 'waiting',
      waitingFor: waitingFor.trim() || null,
      result: draft,
    })
    setWaitOpen(false)
    await refresh()
    await onChanged?.()
    setMsg('대기 상태로 표시됨')
  }

  async function reassign() {
    if (!agentId) return
    await updateOfficeTask(task.id, {
      assignedAgentId: agentId,
      force: true,
    })
    await refresh()
    await onChanged?.()
    setMsg('재배정됨')
  }

  async function convertToManual() {
    await updateOfficeTask(task.id, {
      errorMessage: null,
      aiGenerated: false,
      generatedByAgentId: null,
      usage: null,
      status: task.status === 'waiting' ? 'todo' : task.status === 'done' ? 'todo' : task.status,
    })
    await refresh()
    await onChanged?.()
    setMsg('Manual Task로 전환됨')
  }

  async function returnIdle() {
    if (!task.assignedAgentId) return
    await updateOfficeAgent(task.assignedAgentId, { state: 'idle' })
    await refresh()
    await onChanged?.()
    setMsg('에이전트를 대기로 전환')
  }

  async function copyBrief() {
    const text = buildTaskBrief({
      project,
      task: { ...task, description: task.description || task.title },
      memory,
      notes,
    })
    const ok = await copyText(text)
    setMsg(ok ? 'Brief copied' : '클립보드에 복사할 수 없습니다. 텍스트를 확인하세요.')
    if (!ok) window.prompt('Copy brief:', text)
  }

  async function pasteResult() {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText()
        if (text) {
          setDraft(text)
          setMsg('붙여넣기 완료')
          return
        }
      }
    } catch {
      // fall through
    }
    resultRef.current?.focus()
    setMsg('Work Result에 붙여넣으세요 (⌘/Ctrl+V)')
  }

  async function saveNote() {
    await createOfficeNote({
      projectId: task.projectId,
      title: noteForm.title,
      content: noteForm.content,
    })
    setNoteOpen(false)
    await refresh()
    await onChanged?.()
  }

  async function saveMemory() {
    await createOfficeMemory({
      projectId: task.projectId,
      ...memoryForm,
    })
    setMemoryOpen(false)
    await refresh()
    await onChanged?.()
  }

  async function createSuggested() {
    const picked = suggestions.filter((_, i) => selectedSuggestions[i])
    for (const item of picked) {
      await createOfficeTask({
        projectId: task.projectId,
        assignedAgentId: task.assignedAgentId || null,
        title: item.title || '후속 작업',
        description: item.description || '',
        priority: item.priority || 'medium',
        mode: 'queue',
      })
    }
    setSelectedSuggestions({})
    await refresh()
    await onChanged?.()
  }

  return (
    <div className="office-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="office-modal office-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="office-modal__head">
          <div>
            <h2 id={titleId}>{task.title}</h2>
            {showAiBadge ? <span className="office-badge">AI generated</span> : null}
            {isFailedAi ? <span className="office-badge">Needs attention</span> : null}
          </div>
          <button type="button" className="office-details__close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className="office-result">
          <p>
            <strong>Agent</strong> {agent?.name || '—'}
          </p>
          <p>
            <strong>Project</strong> {project?.name || '—'}
          </p>
          <p>
            <strong>Instruction</strong> {task.description || task.title}
          </p>
          {task.waitingFor ? (
            <p>
              <strong>Waiting for</strong> {task.waitingFor}
            </p>
          ) : null}
          <p>
            <strong>Created</strong> {task.createdAt ? new Date(task.createdAt).toLocaleString() : '—'}
          </p>
          <p>
            <strong>Completed</strong>{' '}
            {task.completedAt ? new Date(task.completedAt).toLocaleString() : '—'}
          </p>

          {isFailedAi ? (
            <div className="office-card" style={{ margin: '10px 0' }}>
              <p>{task.errorMessage}</p>
              <button type="button" className="office-btn" onClick={convertToManual}>
                Convert to Manual Task
              </button>
            </div>
          ) : null}

          <h3 style={{ marginTop: 16 }}>Work Result</h3>
          <textarea
            ref={resultRef}
            rows={12}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste or write the completed work here..."
          />

          {task.contextMeta && task.aiGenerated ? (
            <div className="office-result__context">
              <button type="button" className="office-btn" onClick={() => setContextOpen((v) => !v)}>
                Context used
              </button>
              {contextOpen ? (
                <ul>
                  <li>Project Memory: {task.contextMeta.memoryCount || 0} items</li>
                  <li>Open Tasks: {task.contextMeta.openTaskCount || 0}</li>
                  <li>Recent Notes: {task.contextMeta.noteCount || 0}</li>
                </ul>
              ) : null}
            </div>
          ) : null}

          {suggestions.length > 0 && task.aiGenerated ? (
            <div className="office-result__suggestions">
              <h3>Suggested Tasks</h3>
              {suggestions.map((item, i) => (
                <label key={i} className="office-check">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedSuggestions[i])}
                    onChange={(e) =>
                      setSelectedSuggestions((s) => ({ ...s, [i]: e.target.checked }))
                    }
                  />
                  <span>
                    {item.title}
                    {item.priority ? ` · ${PRIORITY_LABEL[item.priority] || item.priority}` : ''}
                  </span>
                </label>
              ))}
              <button type="button" className="office-btn" onClick={createSuggested}>
                선택한 작업 만들기
              </button>
            </div>
          ) : null}

          <div className="office-form" style={{ marginTop: 12 }}>
            <label>
              <span>Reassign agent</span>
              <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="office-btn" onClick={reassign}>
              Reassign
            </button>
          </div>

          {msg ? <p className="office-form__hint">{msg}</p> : null}

          <div className="office-modal__actions" style={{ flexWrap: 'wrap' }}>
            <button type="button" className="office-btn" onClick={copyBrief}>
              Copy Brief
            </button>
            <button type="button" className="office-btn" onClick={pasteResult}>
              Paste Result
            </button>
            <button
              type="button"
              className="office-btn"
              onClick={() => navigator.clipboard?.writeText(draft || '')}
            >
              Copy
            </button>
            <button type="button" className="office-btn office-btn--primary" onClick={saveResult}>
              Save
            </button>
            <button type="button" className="office-btn" onClick={() => setWaitOpen(true)}>
              Mark as Waiting
            </button>
            <button type="button" className="office-btn" onClick={() => setNoteOpen(true)}>
              Save as Note
            </button>
            <button type="button" className="office-btn" onClick={() => setMemoryOpen(true)}>
              Save to Project Memory
            </button>
            <button type="button" className="office-btn office-btn--primary" onClick={markDone}>
              Mark Done
            </button>
            {task.status === 'done' ? (
              <button type="button" className="office-btn" onClick={returnIdle}>
                Return Agent to Idle
              </button>
            ) : null}
            {isManualMode ? null : (
              <a className="office-btn" href="/admin/chat">
                Ask Follow-up
              </a>
            )}
          </div>
        </div>

        {waitOpen ? (
          <div className="office-result__submodal">
            <h3>Mark as Waiting</h3>
            <div className="office-form">
              <input
                value={waitingFor}
                onChange={(e) => setWaitingFor(e.target.value)}
                placeholder="Waiting for (e.g. Supplier reply)"
              />
              <div className="office-modal__actions">
                <button type="button" className="office-btn" onClick={() => setWaitOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="office-btn office-btn--primary" onClick={markWaiting}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {noteOpen ? (
          <div className="office-result__submodal">
            <h3>Save as Note</h3>
            <div className="office-form">
              <input
                value={noteForm.title}
                onChange={(e) => setNoteForm((f) => ({ ...f, title: e.target.value }))}
              />
              <textarea
                rows={6}
                value={noteForm.content}
                onChange={(e) => setNoteForm((f) => ({ ...f, content: e.target.value }))}
              />
              <div className="office-modal__actions">
                <button type="button" className="office-btn" onClick={() => setNoteOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="office-btn office-btn--primary" onClick={saveNote}>
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {memoryOpen ? (
          <div className="office-result__submodal">
            <h3>Save to Project Memory</h3>
            <p>Confirm before saving. Content is never auto-promoted to Memory.</p>
            <div className="office-form">
              <select
                value={memoryForm.category}
                onChange={(e) => setMemoryForm((f) => ({ ...f, category: e.target.value }))}
              >
                {Object.entries(MEMORY_CATEGORY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                value={memoryForm.title}
                onChange={(e) => setMemoryForm((f) => ({ ...f, title: e.target.value }))}
              />
              <textarea
                rows={6}
                value={memoryForm.content}
                onChange={(e) => setMemoryForm((f) => ({ ...f, content: e.target.value }))}
              />
              <select
                value={memoryForm.importance}
                onChange={(e) => setMemoryForm((f) => ({ ...f, importance: e.target.value }))}
              >
                <option value="normal">보통</option>
                <option value="important">중요</option>
                <option value="critical">긴급</option>
              </select>
              <div className="office-modal__actions">
                <button type="button" className="office-btn" onClick={() => setMemoryOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="office-btn office-btn--primary" onClick={saveMemory}>
                  Confirm & Save
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
