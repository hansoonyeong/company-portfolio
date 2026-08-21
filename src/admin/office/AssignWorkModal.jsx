import { useEffect, useId, useState } from 'react'
import { PRIORITY_LABEL } from '../OfficeDataContext'

export default function AssignWorkModal({
  agents,
  projects,
  initialAgentId,
  onAssign,
  onClose,
  busyWarning,
}) {
  const titleId = useId()
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [agentId, setAgentId] = useState(initialAgentId || agents[0]?.id || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [mode, setMode] = useState('start')
  const [force, setForce] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialAgentId) setAgentId(initialAgentId)
  }, [initialAgentId])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!agentId || !title.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await onAssign?.({
        projectId: projectId || null,
        assignedAgentId: agentId,
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || null,
        mode,
        force,
      })
    } catch (err) {
      setError(err.message || '배정에 실패했습니다.')
      if (err.code === 'AGENT_BUSY') setForce(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="office-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="office-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="office-modal__head">
          <h2 id={titleId}>작업 배정</h2>
          <button type="button" className="office-details__close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <form className="office-form" onSubmit={handleSubmit}>
          <label>
            <span>프로젝트</span>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">선택 안 함</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>AI 에이전트</span>
            <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>작업 제목</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="무엇을 할까요?"
              required
            />
          </label>

          <label>
            <span>설명</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="세부 내용 (선택)"
            />
          </label>

          <label>
            <span>우선순위</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>마감일 (선택)</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>

          <fieldset className="office-form__fieldset">
            <legend>배정 방식</legend>
            <label className="office-check">
              <input
                type="radio"
                name="mode"
                checked={mode === 'start'}
                onChange={() => setMode('start')}
              />
              <span>바로 시작 (진행 중)</span>
            </label>
            <label className="office-check">
              <input
                type="radio"
                name="mode"
                checked={mode === 'queue'}
                onChange={() => setMode('queue')}
              />
              <span>대기열에 추가 (할 일)</span>
            </label>
          </fieldset>

          {(busyWarning || error) && (
            <p className="office-form__hint" style={{ color: '#8b3a3a' }}>
              {busyWarning || error}
              {error?.includes('다른 작업') ? (
                <>
                  <br />
                  <label className="office-check" style={{ marginTop: 8 }}>
                    <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
                    <span>그래도 이 작업으로 전환</span>
                  </label>
                </>
              ) : null}
            </p>
          )}

          <div className="office-modal__actions">
            <button type="button" className="office-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="office-btn office-btn--primary" disabled={submitting}>
              {submitting ? '저장 중…' : '배정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
