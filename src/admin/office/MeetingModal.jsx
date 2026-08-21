import { useEffect, useId, useState } from 'react'

export default function MeetingModal({ agents, projects, onStartMeeting, onClose }) {
  const titleId = useId()
  const [topic, setTopic] = useState('')
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [participantIds, setParticipantIds] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggleParticipant(id) {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!topic.trim() || participantIds.length === 0) return
    setSubmitting(true)
    setError('')
    try {
      await onStartMeeting?.({
        topic: topic.trim(),
        projectId: projectId || null,
        participantAgentIds: participantIds,
      })
    } catch (err) {
      setError(err.message || '미팅 시작에 실패했습니다.')
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
          <h2 id={titleId}>미팅 시작</h2>
          <button type="button" className="office-details__close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <form className="office-form" onSubmit={handleSubmit}>
          <label>
            <span>미팅 주제</span>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="주간 싱크"
              required
            />
          </label>

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

          <fieldset className="office-form__fieldset">
            <legend>참석자</legend>
            <div className="office-form__checks">
              {agents.map((a) => (
                <label key={a.id} className="office-check">
                  <input
                    type="checkbox"
                    checked={participantIds.includes(a.id)}
                    onChange={() => toggleParticipant(a.id)}
                  />
                  <span>{a.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {error ? <p className="office-form__hint" style={{ color: '#8b3a3a' }}>{error}</p> : null}

          <div className="office-modal__actions">
            <button type="button" className="office-btn" onClick={onClose}>
              취소
            </button>
            <button
              type="submit"
              className="office-btn office-btn--primary"
              disabled={participantIds.length === 0 || submitting}
            >
              {submitting ? '시작 중…' : '미팅 시작'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
