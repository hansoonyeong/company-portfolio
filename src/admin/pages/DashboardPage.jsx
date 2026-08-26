import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useOfficeData } from '../OfficeDataContext'
import {
  buildAdminAlerts,
  buildWorkItems,
  partitionToday,
} from '../office/scheduleSelectors'
import {
  countdownLabel,
  formatKoreanDate,
  itemEffectiveDate,
  todayKey,
} from '../office/scheduleUtils'
import '../office/office.css'
import '../office/schedule.css'

export default function DashboardPage() {
  const { activeProjects, tasks, schedule, activity, loading, error } = useOfficeData()
  const nowKey = todayKey()

  const items = useMemo(
    () => buildWorkItems({ tasks, schedule: schedule || [], projects: activeProjects }),
    [tasks, schedule, activeProjects],
  )
  const parts = useMemo(() => partitionToday(items, nowKey), [items, nowKey])
  const alerts = useMemo(
    () => buildAdminAlerts(items, schedule || [], nowKey),
    [items, schedule, nowKey],
  )

  const projectCards = useMemo(() => {
    return activeProjects.map((project) => {
      const projItems = (schedule || [])
        .filter((s) => s.projectId === project.id && s.status !== 'completed' && s.status !== 'cancelled')
        .map((s) => ({ ...s, date: itemEffectiveDate(s) }))
        .filter((s) => s.date && s.date >= nowKey)
        .sort((a, b) => a.date.localeCompare(b.date))
      const next = projItems[0] || null
      const milestone = projItems.find((s) => s.isMilestone) || next
      return { project, next, milestone }
    })
  }, [activeProjects, schedule, nowKey])

  const recentlyCompleted = items
    .filter((i) => i.status === 'completed')
    .sort((a, b) => String(b.completedAt || '').localeCompare(String(a.completedAt || '')))
    .slice(0, 8)

  return (
    <div className="office-page sch-page">
      <p className="office-page__eyebrow">홈</p>
      <h2 className="office-page__title">대시보드</h2>
      <p className="office-page__lead">일정·마감·대기 중심 운영 현황입니다.</p>
      {error ? <p style={{ color: '#8b3a3a' }}>{error}</p> : null}
      {loading ? <p>불러오는 중…</p> : null}

      {alerts.length ? (
        <div className="sch-alerts" role="status">
          {alerts.map((a) => (
            <p key={a.id}>{a.text}</p>
          ))}
        </div>
      ) : null}

      <div className="sch-morning">
        <Link to="/admin/today" className="sch-morning__stat">
          <strong>{parts.todayAction.length}</strong>
          <span>오늘 할 일</span>
        </Link>
        <Link to="/admin/schedule" className="sch-morning__stat">
          <strong>{parts.weekDeadlines.length}</strong>
          <span>이번 주 마감</span>
        </Link>
        <Link to="/admin/waiting" className="sch-morning__stat">
          <strong>{parts.waiting.length}</strong>
          <span>대기 중</span>
        </Link>
        <Link to="/admin/today" className="sch-morning__stat">
          <strong>{parts.overdue.length}</strong>
          <span>지연</span>
        </Link>
      </div>

      <section className="sch-section">
        <h3 className="sch-section__title">프로젝트 일정 상태</h3>
        <div className="office-card-grid">
          {projectCards.map(({ project, next, milestone }) => (
            <section key={project.id} className="office-card">
              <h3>
                <Link to={`/admin/projects/${project.id}`}>{project.name}</Link>
              </h3>
              {next ? (
                <p>
                  다음: {next.title}
                  <br />
                  <span className="sch-muted">{formatKoreanDate(next.date)}</span>
                </p>
              ) : (
                <p className="sch-muted">다가오는 일정 없음</p>
              )}
              {milestone?.isMilestone ? (
                <p>
                  마일스톤 {countdownLabel(milestone.date)} · {milestone.title}
                </p>
              ) : null}
            </section>
          ))}
        </div>
      </section>

      <section className="sch-section">
        <h3 className="sch-section__title">최근 완료 업무</h3>
        {recentlyCompleted.length === 0 ? <p className="sch-empty">없음</p> : null}
        <ul>
          {recentlyCompleted.map((item) => (
            <li key={item.id}>
              {item.projectName} · {item.title}
            </li>
          ))}
        </ul>
      </section>

      <section className="sch-section">
        <h3 className="sch-section__title">최근 활동</h3>
        <ul>
          {activity.slice(0, 8).map((item) => (
            <li key={item.id}>{item.message}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
