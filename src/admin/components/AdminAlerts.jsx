import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useOfficeData } from '../OfficeDataContext'
import { buildAdminAlerts, buildWorkItems } from '../office/scheduleSelectors'
import { todayKey } from '../office/scheduleUtils'
import '../office/schedule.css'

export default function AdminAlerts() {
  const { tasks, schedule, activeProjects } = useOfficeData()
  const alerts = useMemo(() => {
    const items = buildWorkItems({ tasks, schedule: schedule || [], projects: activeProjects })
    return buildAdminAlerts(items, schedule || [], todayKey())
  }, [tasks, schedule, activeProjects])

  if (!alerts.length) return null

  return (
    <div className="sch-alerts sch-alerts--bar" role="status">
      {alerts.slice(0, 3).map((a) => (
        <p key={a.id}>{a.text}</p>
      ))}
      <Link to="/admin/today">오늘 보기</Link>
    </div>
  )
}
