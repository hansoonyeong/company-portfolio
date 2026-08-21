import { Link } from 'react-router-dom'
import { useState } from 'react'
import { AGENT_STATE_LABEL, TASK_STATUS_LABEL, useOfficeData } from '../OfficeDataContext'
import AiResultModal from '../office/AiResultModal'
import '../office/office.css'

export default function DashboardPage() {
  const { activeProjects, tasks, agents, activity, loading, error } = useOfficeData()
  const [resultTaskId, setResultTaskId] = useState(null)

  const aiDone = tasks.filter((t) => t.aiGenerated && t.status === 'done')
  const aiInProgress = tasks.filter((t) => t.status === 'in_progress' && t.assignedAgentId)
  const aiWaiting = tasks.filter((t) => t.status === 'waiting')
  const recentAi = aiDone.slice(0, 8)
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
          <h3>AI Tasks Completed</h3>
          <p>{aiDone.length}개</p>
        </section>
        <section className="office-card">
          <h3>AI Tasks In Progress</h3>
          <p>{aiInProgress.length}개</p>
        </section>
        <section className="office-card">
          <h3>AI Tasks Waiting</h3>
          <p>{aiWaiting.length}개</p>
        </section>
        <section className="office-card">
          <h3>활성 프로젝트</h3>
          <p>{activeProjects.length}개</p>
        </section>
        <section className="office-card">
          <h3>Recent AI Results</h3>
          <ul>
            {recentAi.map((t) => (
              <li key={t.id}>
                <button type="button" className="office-btn" onClick={() => setResultTaskId(t.id)}>
                  {t.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="office-card">
          <h3>작업 중인 AI</h3>
          <p>{workingAgents.length}명</p>
          <ul>
            {workingAgents.map((a) => (
              <li key={a.id}>
                {a.name} · {AGENT_STATE_LABEL[a.state]}
              </li>
            ))}
          </ul>
        </section>
        <section className="office-card">
          <h3>최근 활동</h3>
          <ul>
            {activity.slice(0, 8).map((item) => (
              <li key={item.id}>{item.message}</li>
            ))}
          </ul>
        </section>
        <section className="office-card">
          <h3>웹사이트 관리</h3>
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
        <section className="office-card">
          <h3>대기 작업</h3>
          <ul>
            {aiWaiting.slice(0, 6).map((t) => (
              <li key={t.id}>
                {t.title} · {TASK_STATUS_LABEL[t.status]}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {resultTaskId ? (
        <AiResultModal taskId={resultTaskId} onClose={() => setResultTaskId(null)} />
      ) : null}
    </div>
  )
}
