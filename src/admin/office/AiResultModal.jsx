import { useEffect, useId, useState } from 'react'
import {
  createOfficeMemory,
  createOfficeNote,
  createOfficeTask,
  updateOfficeTask,
} from '../../lib/officeApi'
import { MEMORY_CATEGORY_LABEL, PRIORITY_LABEL, useOfficeData } from '../OfficeDataContext'

export default function AiResultModal({ taskId, onClose, onChanged }) {
  const titleId = useId()
  const { tasks, projects, agents, refresh } = useOfficeData()
  const task = tasks.find((t) => t.id === taskId)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [contextOpen, setContextOpen] = useState(false)
  const [noteForm, setNoteForm] = useState({ title: '', content: '' })
  const [memoryForm, setMemoryForm] = useState({
    title: '',
    content: '',
    category: 'current_status',
    importance: 'normal',
  })
  const [selectedSuggestions, setSelectedSuggestions] = useState({})

  useEffect(() => {
    if (task) {
      setDraft(task.result || '')
      setNoteForm({
        title: task.title || 'AI 결과',
        content: task.result || '',
      })
      setMemoryForm((f) => ({
        ...f,
        title: task.title || 'AI 결과',
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

  async function saveEdit() {
    await updateOfficeTask(task.id, { result: draft })
    setEditing(false)
    await refresh()
    await onChanged?.()
  }

  async function markApproved() {
    await updateOfficeTask(task.id, { status: 'done', errorMessage: null })
    await refresh()
    await onChanged?.()
    onClose?.()
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
            {task.aiGenerated ? <span className="office-badge">AI generated</span> : null}
          </div>
          <button type="button" className="office-details__close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className="office-result">
          <p>
            <strong>에이전트</strong> {agent?.name || '—'}
          </p>
          <p>
            <strong>프로젝트</strong> {project?.name || '—'}
          </p>
          <p>
            <strong>지시</strong> {task.description || task.title}
          </p>
          <p>
            <strong>생성</strong> {task.createdAt ? new Date(task.createdAt).toLocaleString() : '—'}
          </p>
          <p>
            <strong>완료</strong>{' '}
            {task.completedAt ? new Date(task.completedAt).toLocaleString() : '—'}
          </p>

          {task.errorMessage ? (
            <p style={{ color: '#8b3a3a' }}>{task.errorMessage}</p>
          ) : null}

          <div className="office-result__body">
            {editing ? (
              <textarea rows={12} value={draft} onChange={(e) => setDraft(e.target.value)} />
            ) : (
              <pre className="office-result__text">{task.result || '(결과 없음)'}</pre>
            )}
          </div>

          {task.contextMeta ? (
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

          {suggestions.length > 0 ? (
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

          <div className="office-modal__actions" style={{ flexWrap: 'wrap' }}>
            <button
              type="button"
              className="office-btn"
              onClick={() => navigator.clipboard?.writeText(task.result || '')}
            >
              Copy Result
            </button>
            {editing ? (
              <button type="button" className="office-btn office-btn--primary" onClick={saveEdit}>
                저장
              </button>
            ) : (
              <button type="button" className="office-btn" onClick={() => setEditing(true)}>
                Edit Result
              </button>
            )}
            <button type="button" className="office-btn" onClick={() => setNoteOpen(true)}>
              Save as Note
            </button>
            <button type="button" className="office-btn" onClick={() => setMemoryOpen(true)}>
              Save to Project Memory
            </button>
            <a className="office-btn" href={`/admin/chat`}>
              Ask Follow-up
            </a>
            <button type="button" className="office-btn office-btn--primary" onClick={markApproved}>
              Mark Approved
            </button>
          </div>
        </div>

        {noteOpen ? (
          <div className="office-result__submodal">
            <h3>노트로 저장</h3>
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
                  취소
                </button>
                <button type="button" className="office-btn office-btn--primary" onClick={saveNote}>
                  저장
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {memoryOpen ? (
          <div className="office-result__submodal">
            <h3>프로젝트 메모리로 저장</h3>
            <p>AI 결과는 확인 후에만 메모리에 저장됩니다.</p>
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
                  취소
                </button>
                <button type="button" className="office-btn office-btn--primary" onClick={saveMemory}>
                  확인 후 저장
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
