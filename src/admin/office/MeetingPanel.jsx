import { useState } from 'react'
import {
  generateMeetingContributions,
  generateMeetingSummary,
} from '../../lib/officeApi'

export default function MeetingPanel({ meeting, agents, projectName, onEnd, onChanged }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

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

  return (
    <section className="office-meeting" aria-label="진행 중 미팅">
      <div className="office-meeting__head">
        <div>
          <p className="office-details__eyebrow">미팅 진행 중</p>
          <h2 className="office-meeting__title">{meeting.topic}</h2>
          <p className="office-meeting__meta">
            {projectName || '프로젝트 없음'} · 참석 {participants.length}명
          </p>
        </div>
        <div className="office-modal__actions">
          <button type="button" className="office-btn" onClick={runContributions} disabled={Boolean(busy)}>
            Generate AI Contributions
          </button>
          <button type="button" className="office-btn" onClick={runSummary} disabled={Boolean(busy)}>
            Generate Summary
          </button>
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
    </section>
  )
}
