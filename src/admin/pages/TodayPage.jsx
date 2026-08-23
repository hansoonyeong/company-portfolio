import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function TodayPage() {
  const { tasks, projects, activity, agents, refresh } = useOfficeData()
  const [resultTaskId, setResultTaskId] = useState(null)

  const dueToday = useMemo(
    () => tasks.filter((t) => isToday(t.dueDate) && t.status !== 'done'),
    [tasks],
  )
  const urgent = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done')
  const overdue = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'done')
  const inProgress = tasks.filter((t) => t.status === 'in_progress')
  const waiting = tasks.filter((t) => t.status === 'waiting')
  const recentlyCompleted = tasks.filter((t) => t.status === 'done' && isToday(t.completedAt))

  return (
    <div className="office-page">
      <p className="office-page__eyebrow">홈</p>
      <h2 className="office-page__title">오늘</h2>
      <p className="office-page__lead">오늘 확인할 일과 진행 중인 작업을 모았습니다.</p>

      <div className="office-card-grid">
        <section className="office-card">
          <h3>Today&apos;s Priorities</h3>
          <p>
            <strong>Due today</strong>
          </p>
          <ul>
            {dueToday.length === 0 ? <li>없음</li> : dueToday.map((t) => <li key={t.id}>{t.title}</li>)}
          </ul>
          <p style={{ marginTop: 10 }}>
            <strong>Urgent</strong>
          </p>
          <ul>
            {urgent.length === 0 ? <li>없음</li> : urgent.map((t) => <li key={t.id}>{t.title}</li>)}
          </ul>
          <p style={{ marginTop: 10 }}>
            <strong>Overdue</strong>
          </p>
          <ul>
            {overdue.length === 0 ? <li>없음</li> : overdue.map((t) => <li key={t.id}>{t.title}</li>)}
          </ul>
        </section>
        <section className="office-card">
          <h3>In Progress</h3>
          <ul>
            {inProgress.map((t) => (
              <li key={t.id}>
                <button type="button" className="office-btn" onClick={() => setResultTaskId(t.id)}>
                  {t.title}
                </button>
                <span> · {TASK_STATUS_LABEL[t.status]}</span>
              </li>
            ))}
            {inProgress.length === 0 ? <li>없음</li> : null}
          </ul>
        </section>
        <section className="office-card">
          <h3>Waiting</h3>
          <ul>
            {waiting.map((t) => (
              <li key={t.id}>
                <button type="button" className="office-btn" onClick={() => setResultTaskId(t.id)}>
                  {t.title}
                </button>
                {t.waitingFor ? <span> · Waiting for {t.waitingFor}</span> : null}
              </li>
            ))}
            {waiting.length === 0 ? <li>없음</li> : null}
          </ul>
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
            {recentlyCompleted.length === 0 ? <li>없음</li> : null}
          </ul>
        </section>
        <section className="office-card">
          <h3>Project Activity</h3>
          <ul>
            {activity.slice(0, 10).map((a) => (
              <li key={a.id}>{a.message}</li>
            ))}
          </ul>
        </section>
        <section className="office-card">
          <h3>팀 상태</h3>
          <ul>
            {agents
              .filter((a) => a.state !== 'idle')
              .map((a) => (
                <li key={a.id}>
                  {a.name} · {AGENT_STATE_LABEL[a.state]}
                </li>
              ))}
          </ul>
          <p style={{ marginTop: 10 }}>
            <Link to="/admin/projects">프로젝트 보기</Link>
          </p>
        </section>
      </div>

      {resultTaskId ? (
        <AiResultModal taskId={resultTaskId} onClose={() => setResultTaskId(null)} onChanged={refresh} />
      ) : null}
    </div>
  )
}
