import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { updateOfficeSchedule, updateOfficeTask } from '../../lib/officeApi'
import { useOfficeData } from '../OfficeDataContext'
import ScheduleAddModal from '../office/ScheduleAddModal'
import { buildWorkItems, waitingGroups } from '../office/scheduleSelectors'
import {
  daysWaitingLabel,
  formatKoreanDate,
  todayKey,
} from '../office/scheduleUtils'
import '../office/office.css'
import '../office/schedule.css'

async function patchWaiting(item, patch) {
  if (item.scheduleId) await updateOfficeSchedule(item.scheduleId, patch)
  if (item.taskId) {
    const taskPatch = { force: true }
    if (patch.status === 'completed') taskPatch.status = 'done'
    if (patch.status === 'in_progress') taskPatch.status = 'in_progress'
    if (patch.status === 'waiting') taskPatch.status = 'waiting'
    if (patch.waitingFor !== undefined) taskPatch.waitingFor = patch.waitingFor
    if (patch.followUpDate !== undefined) taskPatch.followUpDate = patch.followUpDate
    if (patch.date !== undefined) taskPatch.dueDate = patch.date
    await updateOfficeTask(item.taskId, taskPatch)
  }
}

function WaitingCard({ item, onChanged }) {
  const [busy, setBusy] = useState(false)

  async function run(fn) {
    setBusy(true)
    try {
      await fn()
      await onChanged()
    } catch (err) {
      window.alert(err.message || '처리 실패')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="sch-row">
      <div className="sch-row__main">
        <span className="sch-row__project" style={{ borderColor: item.projectColor }}>
          {item.projectName}
        </span>
        <strong className="sch-row__title">{item.title}</strong>
        <div className="sch-row__meta">
          <span>대기: {item.waitingFor || '—'}</span>
          <span>{item.waitingSince ? daysWaitingLabel(item.waitingSince) : '대기 시작 미기록'}</span>
          <span>
            Follow-up:{' '}
            {item.followUpDate ? formatKoreanDate(item.followUpDate) : '날짜 없음'}
          </span>
          {item.followUpDate && item.followUpDate <= todayKey() ? (
            <span className="sch-tag">Follow-up 필요</span>
          ) : null}
        </div>
      </div>
      <div className="sch-row__actions">
        <button
          type="button"
          className="office-btn office-btn--primary"
          disabled={busy}
          onClick={() =>
            run(() =>
              patchWaiting(item, {
                status: 'in_progress',
                waitingFor: null,
              }),
            )
          }
        >
          회신 받음
        </button>
        <button
          type="button"
          className="office-btn"
          disabled={busy}
          onClick={() =>
            run(() =>
              patchWaiting(item, {
                status: 'completed',
              }),
            )
          }
        >
          Follow-up 완료
        </button>
        <label className="sch-inline-date">
          <span>날짜 변경</span>
          <input
            type="date"
            disabled={busy}
            onChange={(e) => {
              if (!e.target.value) return
              run(() => patchWaiting(item, { followUpDate: e.target.value }))
            }}
          />
        </label>
        <Link className="office-btn" to="/admin/tasks">
          업무 열기
        </Link>
      </div>
    </article>
  )
}

function Group({ title, items, onChanged }) {
  return (
    <section className="sch-section">
      <h3 className="sch-section__title">
        {title} <span className="sch-count">{items.length}</span>
      </h3>
      {items.length === 0 ? <p className="sch-empty">없음</p> : null}
      {items.map((item) => (
        <WaitingCard key={item.id} item={item} onChanged={onChanged} />
      ))}
    </section>
  )
}

export default function WaitingPage() {
  const { tasks, projects, schedule, refresh, loading } = useOfficeData()
  const [addOpen, setAddOpen] = useState(false)

  const items = useMemo(
    () => buildWorkItems({ tasks, schedule: schedule || [], projects }),
    [tasks, schedule, projects],
  )
  const groups = useMemo(() => waitingGroups(items), [items])

  return (
    <div className="office-page sch-page">
      <div className="sch-page__head">
        <div>
          <p className="office-page__eyebrow">워크스페이스</p>
          <h2 className="office-page__title">대기 중</h2>
          <p className="office-page__lead">회신·후속 확인이 필요한 업무를 모아 둡니다.</p>
        </div>
        <button type="button" className="office-btn office-btn--primary" onClick={() => setAddOpen(true)}>
          + 일정 추가
        </button>
      </div>
      {loading ? <p>불러오는 중…</p> : null}

      <Group title="오늘 Follow-up" items={groups.todayFollowUp} onChanged={refresh} />
      <Group title="Follow-up 예정" items={groups.upcomingFollowUp} onChanged={refresh} />
      <Group title="Follow-up 날짜 없음" items={groups.noFollowUp} onChanged={refresh} />

      {addOpen ? (
        <ScheduleAddModal
          onClose={() => setAddOpen(false)}
          onSaved={refresh}
          initialTitle=""
        />
      ) : null}
    </div>
  )
}
