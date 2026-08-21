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

export default function TodayPage() {
  const { tasks, projects, activity, agents, refresh } = useOfficeData()
  const [resultTaskId, setResultTaskId] = useState(null)

  const dueToday = useMemo(() => tasks.filter((t) => isToday(t.dueDate) && t.status !== 'done'), [tasks])
  const inProgress = tasks.filter((t) => t.status === 'in_progress')
  const waiting = tasks.filter((t) => t.status === 'waiting')
  const aiToday = tasks.filter(
    (t) =>
      (isToday(t.completedAt) || isToday(t.createdAt) || isToday(t.startedAt)) &&
      (t.aiGenerated || t.assignedAgentId),
  )
  const attentionProjects = projects.filter((p) =>
    tasks.some(
      (t) =>
        t.projectId === p.id &&
        (t.priority === 'urgent' || t.status === 'waiting' || (t.dueDate && new Date(t.dueDate) < new Date())),
    ),
  )

  return (
    <div className="office-page">
      <p className="office-page__eyebrow">홈</p>
      <h2 className="office-page__title">오늘</h2>
      <p className="office-page__lead">오늘 확인할 일과 AI 활동을 모았습니다.</p>

      <div className="office-card-grid">
        <section className="office-card">
          <h3>AI Work Today</h3>
          {aiToday.length === 0 ? (
            <p>없음</p>
          ) : (
            <ul>
              {aiToday.map((t) => (
                <li key={t.id}>
                  <button type="button" className="office-btn" onClick={() => setResultTaskId(t.id)}>
                    {t.title}
                  </button>
                  <span>
                    {' '}
                    · {TASK_STATUS_LABEL[t.status]}
                    {t.aiGenerated ? ' · AI' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="office-card">
          <h3>오늘 마감</h3>
          {dueToday.length === 0 ? (
            <p>없음</p>
          ) : (
            <ul>
              {dueToday.map((t) => (
                <li key={t.id}>{t.title}</li>
              ))}
            </ul>
          )}
        </section>
        <section className="office-card">
          <h3>진행 중</h3>
          <ul>
            {inProgress.map((t) => (
              <li key={t.id}>
                {t.title} · {TASK_STATUS_LABEL[t.status]}
              </li>
            ))}
          </ul>
        </section>
        <section className="office-card">
          <h3>입력 대기</h3>
          <ul>
            {waiting.map((t) => (
              <li key={t.id}>{t.title}</li>
            ))}
          </ul>
        </section>
        <section className="office-card">
          <h3>AI 팀 활동</h3>
          <ul>
            {activity.slice(0, 8).map((a) => (
              <li key={a.id}>{a.message}</li>
            ))}
          </ul>
        </section>
        <section className="office-card">
          <h3>관심 필요 프로젝트</h3>
          {attentionProjects.length === 0 ? (
            <p>없음</p>
          ) : (
            <ul>
              {attentionProjects.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/projects/${p.id}`}>{p.name}</Link>
                </li>
              ))}
            </ul>
          )}
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
        </section>
      </div>

      {resultTaskId ? (
        <AiResultModal taskId={resultTaskId} onClose={() => setResultTaskId(null)} onChanged={refresh} />
      ) : null}
    </div>
  )
}
