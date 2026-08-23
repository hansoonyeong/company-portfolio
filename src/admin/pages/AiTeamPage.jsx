import { Link } from 'react-router-dom'
import { useState } from 'react'
import { AGENT_STATE_LABEL, useOfficeData } from '../OfficeDataContext'
import { enrichAgent } from '../office/officeData'
import AiResultModal from '../office/AiResultModal'
import '../office/office.css'

export default function AiTeamPage() {
  const { agents, projects, tasks, refresh, isManualMode } = useOfficeData()
  const [resultTaskId, setResultTaskId] = useState(null)
  const enriched = agents.map((a) => enrichAgent(a, { projects, tasks }))

  return (
    <div className="office-page">
      <p className="office-page__eyebrow">AI 팀</p>
      <h2 className="office-page__title">AI 팀</h2>
      <p className="office-page__lead">
        {isManualMode
          ? '워크플로 역할입니다. 배정된 작업을 시각적으로 추적합니다.'
          : '각 에이전트의 AI 작업 현황입니다.'}
      </p>

      <div className="office-card-grid">
        {enriched.map((agent) => {
          const completed = tasks.filter(
            (t) => t.assignedAgentId === agent.id && t.status === 'done',
          )
          const queued = tasks.filter(
            (t) =>
              t.assignedAgentId === agent.id &&
              (t.status === 'todo' || t.status === 'inbox'),
          )
          const lastResult = completed.find((t) => t.result) || completed[0]
          return (
            <section key={agent.id} id={agent.id} className="office-card">
              <h3>{agent.name}</h3>
              <p>{agent.role}</p>
              <p style={{ marginTop: 8 }}>
                <span className="office-badge">{AGENT_STATE_LABEL[agent.state] || agent.state}</span>
              </p>
              <p style={{ marginTop: 8 }}>Current project: {agent.project || '—'}</p>
              <p>Current task: {agent.currentTask || '—'}</p>
              <p>{agent.statusMessage}</p>
              <p style={{ marginTop: 8 }}>Queued: {queued.length}</p>
              <p>Completed: {completed.length}</p>
              {lastResult ? (
                <p style={{ marginTop: 10 }}>
                  <strong>Last result</strong>
                  <br />
                  <button
                    type="button"
                    className="office-btn"
                    onClick={() => setResultTaskId(lastResult.id)}
                  >
                    {lastResult.title}
                  </button>
                </p>
              ) : null}
              <p style={{ marginTop: 10 }}>
                <Link to="/admin/office">View Work →</Link>
              </p>
            </section>
          )
        })}
      </div>
      <button type="button" className="office-btn" onClick={refresh} style={{ marginTop: 12 }}>
        새로고침
      </button>

      {resultTaskId ? (
        <AiResultModal taskId={resultTaskId} onClose={() => setResultTaskId(null)} onChanged={refresh} />
      ) : null}
    </div>
  )
}
