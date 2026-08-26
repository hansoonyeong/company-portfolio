import { useMemo, useState } from 'react'
import { useOfficeData } from '../OfficeDataContext'
import ScheduleAddModal, { parseQuickSchedule } from '../office/ScheduleAddModal'
import { buildWorkItems, groupListView, isActive } from '../office/scheduleSelectors'
import {
  SCHEDULE_STATUS_LABEL,
  SCHEDULE_TYPE_LABEL,
  addDaysKey,
  formatKoreanDate,
  formatKoreanDateTime,
  formatTimeLabel,
  startOfWeekMonday,
  todayKey,
  toDateKey,
  weekKeys,
} from '../office/scheduleUtils'
import '../office/office.css'
import '../office/schedule.css'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

function sortByTime(a, b) {
  return String(a.time || '99:99').localeCompare(String(b.time || '99:99'))
}

function ItemCard({ item, onOpen }) {
  const timeLabel = formatTimeLabel(item.time)
  return (
    <button type="button" className="sch-cal-card" onClick={() => onOpen(item)}>
      {timeLabel ? <span className="sch-cal-card__time">{timeLabel}</span> : null}
      <span className="sch-cal-card__dot" style={{ background: item.projectColor }} />
      <span className="sch-cal-card__project">{item.projectName}</span>
      <strong>{item.title}</strong>
      <span className="sch-cal-card__meta">
        {SCHEDULE_TYPE_LABEL[item.type] || item.type} · {SCHEDULE_STATUS_LABEL[item.status] || item.status}
      </span>
    </button>
  )
}

function DetailDrawer({ item, onClose, onEdit }) {
  if (!item) return null
  return (
    <div className="office-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="office-modal" role="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="office-modal__head">
          <h2>{item.title}</h2>
          <button type="button" className="office-details__close" onClick={onClose}>
            ×
          </button>
        </div>
        <dl className="sch-detail">
          <div>
            <dt>프로젝트</dt>
            <dd>{item.projectName}</dd>
          </div>
          <div>
            <dt>날짜 · 시간</dt>
            <dd>
              {item.date || item.time
                ? formatKoreanDateTime(item.date, item.time)
                : '미정'}
              {item.endDate || item.endTime
                ? ` ~ ${formatKoreanDateTime(item.endDate || item.date, item.endTime)}`
                : ''}
            </dd>
          </div>
          <div>
            <dt>유형</dt>
            <dd>{SCHEDULE_TYPE_LABEL[item.type] || item.type}</dd>
          </div>
          <div>
            <dt>상태</dt>
            <dd>{SCHEDULE_STATUS_LABEL[item.status] || item.status}</dd>
          </div>
          {item.description ? (
            <div>
              <dt>설명</dt>
              <dd>{item.description}</dd>
            </div>
          ) : null}
        </dl>
        <div className="office-modal__actions">
          <button type="button" className="office-btn" onClick={onClose}>
            닫기
          </button>
          {item.scheduleId || item.rawSchedule ? (
            <button type="button" className="office-btn office-btn--primary" onClick={onEdit}>
              수정
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function SchedulePage() {
  const { tasks, projects, schedule, refresh, loading, activeProjects } = useOfficeData()
  const [view, setView] = useState('week')
  const [anchor, setAnchor] = useState(todayKey())
  const [addOpen, setAddOpen] = useState(false)
  const [addPrefill, setAddPrefill] = useState({ title: '', date: '', projectId: '' })
  const [editItem, setEditItem] = useState(null)
  const [quick, setQuick] = useState('')
  const [selected, setSelected] = useState(null)
  const [dayFocus, setDayFocus] = useState(null)

  const items = useMemo(
    () => buildWorkItems({ tasks, schedule: schedule || [], projects }).filter(isActive),
    [tasks, schedule, projects],
  )

  const days = weekKeys(anchor)
  const byDate = useMemo(() => {
    const map = new Map()
    for (const item of items) {
      if (!item.date) continue
      if (!map.has(item.date)) map.set(item.date, [])
      map.get(item.date).push(item)
    }
    for (const list of map.values()) list.sort(sortByTime)
    return map
  }, [items])

  const listBuckets = useMemo(() => groupListView(items, todayKey()), [items])

  const monthGrid = useMemo(() => {
    const d = new Date(`${anchor.slice(0, 7)}-01T12:00:00`)
    const year = d.getFullYear()
    const month = d.getMonth()
    const firstKey = toDateKey(new Date(year, month, 1))
    const start = startOfWeekMonday(firstKey)
    return Array.from({ length: 42 }, (_, i) => addDaysKey(start, i))
  }, [anchor])

  function openEdit(workItem) {
    const raw = workItem.rawSchedule || (schedule || []).find((s) => s.id === workItem.scheduleId)
    if (!raw) return
    setSelected(null)
    setEditItem(raw)
  }

  function submitQuick(e) {
    e.preventDefault()
    const parsed = parseQuickSchedule(quick)
    if (!parsed) return
    let projectId = ''
    if (parsed.projectHint === 'kimchi') {
      projectId =
        activeProjects.find((p) => p.id === 'proj-kimchi' || /kimchi|김치/i.test(p.name))?.id || ''
    } else if (parsed.projectHint === 'hangeul') {
      projectId =
        activeProjects.find((p) => p.id === 'proj-hangeul' || /hangeul|한글/i.test(p.name))?.id || ''
    }
    setAddPrefill({
      title: parsed.title,
      date: parsed.date || todayKey(),
      projectId,
    })
    setAddOpen(true)
    setQuick('')
  }

  function shiftWeek(delta) {
    setAnchor(addDaysKey(startOfWeekMonday(anchor), delta * 7))
  }

  function shiftMonth(delta) {
    const d = new Date(`${anchor.slice(0, 7)}-01T12:00:00`)
    d.setMonth(d.getMonth() + delta)
    setAnchor(toDateKey(d))
  }

  return (
    <div className="office-page sch-page">
      <div className="sch-page__head">
        <div>
          <p className="office-page__eyebrow">홈</p>
          <h2 className="office-page__title">일정</h2>
          <p className="office-page__lead">주 · 월 · 리스트로 사업 일정을 확인합니다.</p>
        </div>
        <button
          type="button"
          className="office-btn office-btn--primary"
          onClick={() => {
            setAddPrefill({ title: '', date: todayKey(), projectId: '' })
            setAddOpen(true)
          }}
        >
          + 일정 추가
        </button>
      </div>

      <form className="sch-quick" onSubmit={submitQuick}>
        <input
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          placeholder="예: 김치하우스 9월 4일 안내문 발송"
        />
        <button type="submit" className="office-btn">
          빠른 입력
        </button>
      </form>

      <div className="sch-view-tabs">
        {[
          { id: 'week', label: '주' },
          { id: 'month', label: '월' },
          { id: 'list', label: '리스트' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`office-topbar__switch-btn${view === tab.id ? ' is-active' : ''}`}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <p>불러오는 중…</p> : null}

      {view === 'week' ? (
        <>
          <div className="sch-nav-row">
            <button type="button" className="office-btn" onClick={() => shiftWeek(-1)}>
              ← 이전 주
            </button>
            <strong>
              {formatKoreanDate(days[0])} – {formatKoreanDate(days[6])}
            </strong>
            <button type="button" className="office-btn" onClick={() => shiftWeek(1)}>
              다음 주 →
            </button>
            <button type="button" className="office-btn" onClick={() => setAnchor(todayKey())}>
              이번 주
            </button>
          </div>
          <div className="sch-week">
            {days.map((key, i) => (
              <div key={key} className={`sch-week__col${key === todayKey() ? ' is-today' : ''}`}>
                <header>
                  <span>{WEEKDAYS[i]}</span>
                  <strong>{key.slice(8)}</strong>
                </header>
                <div className="sch-week__list">
                  {(byDate.get(key) || []).map((item) => (
                    <ItemCard key={item.id} item={item} onOpen={setSelected} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {view === 'month' ? (
        <>
          <div className="sch-nav-row">
            <button type="button" className="office-btn" onClick={() => shiftMonth(-1)}>
              ← 이전 달
            </button>
            <strong>
              {anchor.slice(0, 4)}년 {Number(anchor.slice(5, 7))}월
            </strong>
            <button type="button" className="office-btn" onClick={() => shiftMonth(1)}>
              다음 달 →
            </button>
          </div>
          <div className="sch-month">
            {WEEKDAYS.map((d) => (
              <div key={d} className="sch-month__head">
                {d}
              </div>
            ))}
            {monthGrid.map((key) => {
              const inMonth = key.startsWith(anchor.slice(0, 7))
              const dayItems = byDate.get(key) || []
              return (
                <button
                  key={key}
                  type="button"
                  className={`sch-month__cell${inMonth ? '' : ' is-muted'}${key === todayKey() ? ' is-today' : ''}`}
                  onClick={() => setDayFocus(key)}
                >
                  <span>{key.slice(8)}</span>
                  <em>{dayItems.length ? `${dayItems.length}건` : ''}</em>
                </button>
              )
            })}
          </div>
          {dayFocus ? (
            <section className="sch-section">
              <h3 className="sch-section__title">{formatKoreanDate(dayFocus, { weekday: true })}</h3>
              {(byDate.get(dayFocus) || []).length === 0 ? <p className="sch-empty">없음</p> : null}
              {(byDate.get(dayFocus) || []).map((item) => (
                <ItemCard key={item.id} item={item} onOpen={setSelected} />
              ))}
            </section>
          ) : null}
        </>
      ) : null}

      {view === 'list' ? (
        <>
          {[
            ['today', '오늘'],
            ['thisWeek', '이번 주'],
            ['nextWeek', '다음 주'],
            ['thisMonth', '이번 달'],
            ['later', '이후'],
            ['undated', '날짜 미정'],
          ].map(([key, label]) => (
            <section key={key} className="sch-section">
              <h3 className="sch-section__title">{label}</h3>
              {(listBuckets[key] || []).length === 0 ? <p className="sch-empty">없음</p> : null}
              {(listBuckets[key] || []).map((item) => (
                <ItemCard key={item.id} item={item} onOpen={setSelected} />
              ))}
            </section>
          ))}
        </>
      ) : null}

      <DetailDrawer
        item={selected}
        onClose={() => setSelected(null)}
        onEdit={() => openEdit(selected)}
      />
      {addOpen ? (
        <ScheduleAddModal
          onClose={() => setAddOpen(false)}
          onSaved={refresh}
          initialTitle={addPrefill.title}
          initialDate={addPrefill.date}
          initialProjectId={addPrefill.projectId}
        />
      ) : null}
      {editItem ? (
        <ScheduleAddModal
          editItem={editItem}
          onClose={() => setEditItem(null)}
          onSaved={refresh}
        />
      ) : null}
    </div>
  )
}
