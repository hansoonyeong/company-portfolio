import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { updateOfficeSchedule, updateOfficeTask } from '../../lib/officeApi'
import { useOfficeData } from '../OfficeDataContext'
import ScheduleAddModal from '../office/ScheduleAddModal'
import {
  buildWorkItems,
  partitionToday,
} from '../office/scheduleSelectors'
import {
  SCHEDULE_STATUS_LABEL,
  SCHEDULE_TYPE_LABEL,
  addDaysKey,
  daysWaitingLabel,
  formatKoreanDate,
  formatKoreanDateTime,
  todayKey,
} from '../office/scheduleUtils'
import '../office/office.css'
import '../office/schedule.css'

const URGENCY_LABEL = { urgent: '긴급', high: '높음', normal: '보통' }

async function completeItem(item) {
  if (item.taskId) {
    await updateOfficeTask(item.taskId, { status: 'done', force: true })
  }
  if (item.scheduleId) {
    await updateOfficeSchedule(item.scheduleId, { status: 'completed' })
  }
}

async function rescheduleItem(item, date) {
  if (item.scheduleId) {
    await updateOfficeSchedule(item.scheduleId, { date })
  }
  if (item.taskId) {
    await updateOfficeTask(item.taskId, { dueDate: date, force: true })
  }
}

function WorkRow({ item, onChanged, showWaiting, onEdit }) {
  const [busy, setBusy] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)

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
    <article className={`sch-row sch-row--${item.urgency}`}>
      <div className="sch-row__main">
        <span className="sch-row__project" style={{ borderColor: item.projectColor }}>
          {item.projectName}
        </span>
        <strong className="sch-row__title">{item.title}</strong>
        <div className="sch-row__meta">
          {item.date || item.time ? (
            <span>{formatKoreanDateTime(item.date, item.time)}</span>
          ) : (
            <span>날짜 미정</span>
          )}
          <span>{SCHEDULE_TYPE_LABEL[item.type] || item.type}</span>
          <span>{SCHEDULE_STATUS_LABEL[item.status] || item.status}</span>
          <span className={`sch-urgency sch-urgency--${item.urgency}`}>
            {URGENCY_LABEL[item.urgency]}
          </span>
          {item.followUpDate === todayKey() ? <span className="sch-tag">Follow-up 필요</span> : null}
          {showWaiting && item.waitingFor ? (
            <span>
              대기: {item.waitingFor}
              {item.waitingSince ? ` · ${daysWaitingLabel(item.waitingSince)}` : ''}
            </span>
          ) : null}
        </div>
      </div>
      <div className="sch-row__actions">
        <button
          type="button"
          className="office-btn office-btn--primary"
          disabled={busy}
          onClick={() => run(() => completeItem(item))}
        >
          완료
        </button>
        {item.scheduleId || item.rawSchedule ? (
          <button type="button" className="office-btn" disabled={busy} onClick={() => onEdit?.(item)}>
            수정
          </button>
        ) : null}
        <button type="button" className="office-btn" disabled={busy} onClick={() => setDateOpen((v) => !v)}>
          날짜 변경
        </button>
        {dateOpen ? (
          <div className="sch-reschedule">
            <button
              type="button"
              className="office-btn"
              onClick={() => run(() => rescheduleItem(item, todayKey()))}
            >
              오늘
            </button>
            <button
              type="button"
              className="office-btn"
              onClick={() => run(() => rescheduleItem(item, addDaysKey(todayKey(), 1)))}
            >
              내일
            </button>
            <button
              type="button"
              className="office-btn"
              onClick={() => run(() => rescheduleItem(item, addDaysKey(todayKey(), 3)))}
            >
              이번 주
            </button>
            <input
              type="date"
              onChange={(e) => {
                if (!e.target.value) return
                run(() => rescheduleItem(item, e.target.value))
              }}
            />
            <label className="sch-inline-date">
              <span>시간</span>
              <input
                type="time"
                defaultValue={item.time || ''}
                onChange={(e) => {
                  if (!item.scheduleId) return
                  run(() => updateOfficeSchedule(item.scheduleId, { time: e.target.value || null }))
                }}
              />
            </label>
          </div>
        ) : null}
        {item.taskId ? (
          <Link className="office-btn" to="/admin/tasks">
            업무
          </Link>
        ) : null}
      </div>
    </article>
  )
}

function Section({ title, children, empty }) {
  return (
    <section className="sch-section">
      <h3 className="sch-section__title">{title}</h3>
      {empty ? <p className="sch-empty">없음</p> : children}
    </section>
  )
}

export default function TodayPage() {
  const { tasks, projects, schedule, refresh, loading, error } = useOfficeData()
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const nowKey = todayKey()

  const items = useMemo(
    () => buildWorkItems({ tasks, schedule: schedule || [], projects }),
    [tasks, schedule, projects],
  )
  const parts = useMemo(() => partitionToday(items, nowKey), [items, nowKey])

  function openEdit(workItem) {
    const raw = workItem.rawSchedule || (schedule || []).find((s) => s.id === workItem.scheduleId)
    if (raw) setEditItem(raw)
  }

  return (
    <div className="office-page sch-page">
      <div className="sch-page__head">
        <div>
          <p className="office-page__eyebrow">운영 본부</p>
          <h2 className="office-page__title">오늘</h2>
          <p className="sch-date-line">{formatKoreanDate(nowKey, { weekday: true })}</p>
        </div>
        <button type="button" className="office-btn office-btn--primary" onClick={() => setAddOpen(true)}>
          + 일정 추가
        </button>
      </div>

      {error ? <p style={{ color: '#8b3a3a' }}>{error}</p> : null}
      {loading ? <p>불러오는 중…</p> : null}

      <div className="sch-morning">
        <div className="sch-morning__stat">
          <strong>{parts.todayAction.length}</strong>
          <span>오늘 할 일</span>
        </div>
        <div className="sch-morning__stat">
          <strong>{parts.weekDeadlines.length}</strong>
          <span>이번 주 마감</span>
        </div>
        <div className="sch-morning__stat">
          <strong>{parts.waiting.length}</strong>
          <span>대기 중</span>
        </div>
        <div className="sch-morning__stat">
          <strong>{parts.overdue.length}</strong>
          <span>지연</span>
        </div>
      </div>

      <Section title="가장 먼저 확인할 것" empty={parts.firstCheck.length === 0}>
        {parts.firstCheck.map((item) => (
          <WorkRow key={item.id} item={item} onChanged={refresh} showWaiting onEdit={openEdit} />
        ))}
      </Section>

      <Section title="오늘 해야 할 일" empty={parts.todayAction.length === 0}>
        {parts.todayAction.map((item) => (
          <WorkRow key={item.id} item={item} onChanged={refresh} onEdit={openEdit} />
        ))}
      </Section>

      <Section title="이번 주" empty={parts.thisWeek.length === 0}>
        {parts.thisWeek.map((item) => (
          <WorkRow key={item.id} item={item} onChanged={refresh} onEdit={openEdit} />
        ))}
      </Section>

      <Section title="대기 중" empty={parts.waiting.length === 0}>
        {parts.waiting.map((item) => (
          <WorkRow key={item.id} item={item} onChanged={refresh} showWaiting onEdit={openEdit} />
        ))}
        <p className="sch-section__link">
          <Link to="/admin/waiting">대기 목록 전체 보기 →</Link>
        </p>
      </Section>

      <Section title="지연" empty={parts.overdue.length === 0}>
        {parts.overdue.map((item) => (
          <WorkRow key={item.id} item={item} onChanged={refresh} onEdit={openEdit} />
        ))}
      </Section>

      <Section title="다가오는 중요 일정" empty={parts.milestones.length === 0}>
        {parts.milestones.map((item) => (
          <WorkRow key={item.id} item={item} onChanged={refresh} onEdit={openEdit} />
        ))}
      </Section>

      {addOpen ? <ScheduleAddModal onClose={() => setAddOpen(false)} onSaved={refresh} /> : null}
      {editItem ? (
        <ScheduleAddModal editItem={editItem} onClose={() => setEditItem(null)} onSaved={refresh} />
      ) : null}
    </div>
  )
}
