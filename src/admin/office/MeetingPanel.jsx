import { useEffect, useState } from 'react'
import {
  createOfficeMemory,
  createOfficeNote,
  createOfficeTask,
  generateMeetingContributions,
  generateMeetingSummary,
  updateOfficeMeeting,
} from '../../lib/officeApi'

export default function MeetingPanel({
  meeting,
  agents,
  projectName,
  projectId,
  onEnd,
  onChanged,
  isManualMode,
}) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notes, setNotes] = useState(meeting?.summary || '')
  const [decisions, setDecisions] = useState('')
  const [actionItems, setActionItems] = useState('')

  useEffect(() => {
    setNotes(meeting?.summary || '')
    const dec = Array.isArray(meeting?.decisions) ? meeting.decisions : []
    setDecisions(dec.map((d) => (typeof d === 'string' ? d : d.content || '')).join('\n'))
  }, [meeting])

  if (!meeting) return null

  const ids = meeting.participantAgentIds || meeting.participantIds || []
  const participants = agents.filter((a) => ids.includes(a.id))
  const contributions = meeting.contributions || []

  async function runContributions() {
    setError('')
    setBusy('기여 생성 중…')
    try {
      await generateMeetingContributions(meeting.id)
      await onChanged?.()
    } catch (err) {
      setError(err.message || '기여 생성 실패')
    } finally {
      setBusy('')
    }
  }

  async function runSummary() {
    setError('')
    setBusy('요약 생성 중…')
    try {
      await generateMeetingSummary(meeting.id)
      await onChanged?.()
    } catch (err) {
      setError(err.message || '요약 생성 실패')
    } finally {
      setBusy('')
    }
  }

  async function saveManualNotes() {
    const decisionList = decisions
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((content) => ({ content, createdAt: new Date().toISOString() }))
    await updateOfficeMeeting(meeting.id, {
      summary: notes,
      decisions: decisionList,
    })
    await onChanged?.()
  }

  async function createTasksFromActions() {
    const lines = actionItems
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    for (const title of lines) {
      await createOfficeTask({
        projectId: projectId || meeting.projectId || null,
        title,
        description: `From meeting: ${meeting.topic}`,
        mode: 'queue',
      })
    }
    setActionItems('')
    await onChanged?.()
  }

  async function saveDecisionsToMemory() {
    const lines = decisions
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    for (const content of lines) {
      await createOfficeMemory({
        projectId: projectId || meeting.projectId || null,
        title: `Meeting decision: ${meeting.topic}`,
        content,
        category: 'important_decisions',
        importance: 'important',
      })
    }
    await onChanged?.()
  }

  async function saveNotesAsNote() {
    await createOfficeNote({
      projectId: projectId || meeting.projectId || null,
      title: `Meeting: ${meeting.topic}`,
      content: notes,
    })
    await onChanged?.()
  }

  return (
    <section className="office-meeting" aria-label="진행 중 미팅">
      <div className="office-meeting__head">
        <div>
          <p className="office-details__eyebrow">{isManualMode ? 'Manual Meeting' : '미팅 진행 중'}</p>
          <h2 className="office-meeting__title">{meeting.topic}</h2>
          <p className="office-meeting__meta">
            {projectName || '프로젝트 없음'} · 참석 {participants.length}명
          </p>
        </div>
        <div className="office-modal__actions">
          {!isManualMode ? (
            <>
              <button type="button" className="office-btn" onClick={runContributions} disabled={Boolean(busy)}>
                Generate AI Contributions
              </button>
              <button type="button" className="office-btn" onClick={runSummary} disabled={Boolean(busy)}>
                Generate Summary
              </button>
            </>
          ) : null}
          <button type="button" className="office-btn" onClick={onEnd}>
            미팅 종료
          </button>
        </div>
      </div>

      {busy ? <p>{busy}</p> : null}
      {error ? <p style={{ color: '#8b3a3a' }}>{error}</p> : null}

      <ul className="office-meeting__list">
        {participants.map((a) => (
          <li key={a.id}>
            <span className="office-meeting__dot" style={{ background: a.accent }} aria-hidden="true" />
            <span>
              <strong>{a.name}</strong>
              <em>{a.role}</em>
            </span>
          </li>
        ))}
      </ul>

      {isManualMode ? (
        <div className="office-meeting__manual" style={{ marginTop: 12 }}>
          <div className="office-form">
            <label>
              <span>Meeting Notes</span>
              <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <label>
              <span>Decisions</span>
              <textarea
                rows={3}
                value={decisions}
                onChange={(e) => setDecisions(e.target.value)}
                placeholder="한 줄에 하나씩"
              />
            </label>
            <label>
              <span>Action Items</span>
              <textarea
                rows={3}
                value={actionItems}
                onChange={(e) => setActionItems(e.target.value)}
                placeholder="한 줄에 하나씩 → Create Tasks"
              />
            </label>
          </div>
          <div className="office-modal__actions" style={{ flexWrap: 'wrap' }}>
            <button type="button" className="office-btn office-btn--primary" onClick={saveManualNotes}>
              Save Meeting Notes
            </button>
            <button type="button" className="office-btn" onClick={saveNotesAsNote}>
              Save as Note
            </button>
            <button type="button" className="office-btn" onClick={saveDecisionsToMemory}>
              Save Decisions to Memory
            </button>
            <button type="button" className="office-btn" onClick={createTasksFromActions}>
              Create Tasks from Action Items
            </button>
          </div>
        </div>
      ) : (
        <>
          {contributions.length > 0 ? (
            <div className="office-meeting__contributions">
              <h3>기여</h3>
              {contributions.map((c, i) => (
                <article key={`${c.agentId}-${i}`} className="office-card" style={{ marginTop: 8 }}>
                  <p className="office-badge">
                    {agents.find((a) => a.id === c.agentId)?.name || c.agentId}
                    {c.aiGenerated ? ' · AI generated' : ''}
                  </p>
                  <pre className="office-result__text">{c.content}</pre>
                </article>
              ))}
            </div>
          ) : null}
          {meeting.summary ? (
            <div className="office-meeting__summary" style={{ marginTop: 12 }}>
              <h3>요약</h3>
              <pre className="office-result__text">{meeting.summary}</pre>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
