import { Link } from 'react-router-dom'
import { useState } from 'react'
import { AGENT_STATE_LABEL, TASK_STATUS_LABEL, useOfficeData } from '../OfficeDataContext'
import AiResultModal from '../office/AiResultModal'
import '../office/office.css'

function isToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return d < now
}

export default function DashboardPage() {
  const { activeProjects, tasks, agents, activity, loading, error, isAiMode } = useOfficeData()
  const [resultTaskId, setResultTaskId] = useState(null)

  const inProgress = tasks.filter((t) => t.status === 'in_progress')
  const waiting = tasks.filter((t) => t.status === 'waiting')
  const dueToday = tasks.filter((t) => isToday(t.dueDate) && t.status !== 'done')
  const overdue = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'done')
  const recentlyCompleted = tasks.filter((t) => t.status === 'done').slice(0, 8)
  const aiDone = tasks.filter((t) => t.aiGenerated && t.status === 'done')
  const workingAgents = agents.filter((a) => a.state === 'working' || a.state === 'thinking')

  return (
    <div className="office-page">
      <p className="office-page__eyebrow">개요</p>
      <h2 className="office-page__title">대시보드</h2>
      <p className="office-page__lead">저장된 오피스 데이터 기준 현황입니다.</p>
      {error ? <p style={{ color: '#8b3a3a' }}>{error}</p> : null}
      {loading ? <p>불러오는 중…</p> : null}

      <div className="office-card-grid">
        <section className="office-card">
          <h3>Active Projects</h3>
          <p>{activeProjects.length}</p>
        </section>
        <section className="office-card">
          <h3>Tasks In Progress</h3>
          <p>{inProgress.length}</p>
        </section>
        <section className="office-card">
          <h3>Waiting</h3>
          <p>{waiting.length}</p>
          <ul>
            {waiting.slice(0, 5).map((t) => (
              <li key={t.id}>
                {t.title}
                {t.waitingFor ? ` · Waiting for ${t.waitingFor}` : ''}
              </li>
            ))}
          </ul>
        </section>
        <section className="office-card">
          <h3>Due Today</h3>
          <p>{dueToday.length}</p>
        </section>
        <section className="office-card">
          <h3>Overdue</h3>
          <p>{overdue.length}</p>
        </section>
        <section className="office-card">
          <h3>Recently Completed</h3>
          <ul>
            {recentlyCompleted.map((t) => (
              <li key={t.id}>
                <button type="button" className="office-btn" onClick={() => setResultTaskId(t.id)}>
                  {t.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="office-card">
          <h3>Team Status</h3>
          <ul>
            {workingAgents.map((a) => (
              <li key={a.id}>
                {a.name} · {AGENT_STATE_LABEL[a.state]}
              </li>
            ))}
            {workingAgents.length === 0 ? <li>모두 대기</li> : null}
          </ul>
        </section>
        <section className="office-card">
          <h3>Recent Activity</h3>
          <ul>
            {activity.slice(0, 8).map((item) => (
              <li key={item.id}>{item.message}</li>
            ))}
          </ul>
        </section>
        <section className="office-card">
          <h3>Website Management</h3>
          <ul>
            <li>
              <Link to="/admin/website/quotes">견적</Link>
            </li>
            <li>
              <Link to="/admin/website/news">소식</Link>
            </li>
            <li>
              <Link to="/admin/website/hero">히어로</Link>
            </li>
            <li>
              <Link to="/admin/website/portfolio">포트폴리오</Link>
            </li>
          </ul>
        </section>
        {isAiMode ? (
          <section className="office-card">
            <h3>AI Tasks Completed</h3>
            <p>{aiDone.length}</p>
          </section>
        ) : null}
      </div>

      {resultTaskId ? (
        <AiResultModal taskId={resultTaskId} onClose={() => setResultTaskId(null)} />
      ) : null}
    </div>
  )
}
