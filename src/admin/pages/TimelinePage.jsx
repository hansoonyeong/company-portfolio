import { useEffect, useMemo, useState } from 'react'
import {
  ensureHangeulSchedule,
  updateOfficeSchedule,
} from '../../lib/officeApi'
import { useOfficeData } from '../OfficeDataContext'
import ScheduleAddModal from '../office/ScheduleAddModal'
import {
  dependencyWarnings,
  milestoneHealth,
} from '../office/scheduleSelectors'
import {
  SCHEDULE_STATUS_LABEL,
  countdownLabel,
  formatKoreanDate,
  formatKoreanDateTime,
  itemEffectiveDate,
  todayKey,
} from '../office/scheduleUtils'
import '../office/office.css'
import '../office/schedule.css'

const HEALTH_LABEL = { normal: '정상', warning: '주의', risk: '위험' }

export default function TimelinePage({ lockedProjectId = null }) {
  const { activeProjects, schedule, tasks, refresh, loading } = useOfficeData()
  const [projectId, setProjectId] = useState(lockedProjectId || '')
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [ensured, setEnsured] = useState(false)

  useEffect(() => {
    if (lockedProjectId) setProjectId(lockedProjectId)
  }, [lockedProjectId])

  useEffect(() => {
    if (!projectId && activeProjects.length) {
      const prefer =
        activeProjects.find((p) => /hangeul|한글/i.test(p.name) || p.id === 'proj-hangeul') ||
        activeProjects.find((p) => /kimchi|김치/i.test(p.name) || p.id === 'proj-kimchi') ||
        activeProjects[0]
      setProjectId(prefer.id)
    }
  }, [activeProjects, projectId])

  useEffect(() => {
    if (ensured) return
    if (projectId !== 'proj-hangeul' && !/hangeul|한글/i.test(activeProjects.find((p) => p.id === projectId)?.name || '')) {
      return
    }
    ensureHangeulSchedule()
      .then(() => refresh())
      .catch(() => {})
      .finally(() => setEnsured(true))
  }, [projectId, activeProjects, ensured, refresh])

  const projectItems = useMemo(() => {
    return (schedule || [])
      .filter((s) => s.projectId === projectId)
      .slice()
      .sort((a, b) => {
        const da = itemEffectiveDate(a) || '9999'
        const db = itemEffectiveDate(b) || '9999'
        if (da !== db) return da.localeCompare(db)
        return (a.sortOrder || 0) - (b.sortOrder || 0)
      })
  }, [schedule, projectId])

  const dated = projectItems.filter((i) => itemEffectiveDate(i))
  const undated = projectItems.filter((i) => !itemEffectiveDate(i))
  const byId = useMemo(() => new Map(projectItems.map((i) => [i.id, i])), [projectItems])

  const phaseGroups = useMemo(() => {
    const labels = {
      kimchi_phase_3: 'PHASE 3 — 3차 집중',
      kimchi_phase_4: 'PHASE 4 — 4차 운영 체계 정비 및 광고 준비',
      kimchi_phase_5: 'PHASE 5 — 5차 외부 확장 및 데이터 분석',
    }
    const order = ['kimchi_phase_3', 'kimchi_phase_4', 'kimchi_phase_5']
    const hasPhase = projectItems.some((i) => order.includes(i.category))
    if (!hasPhase) return null
    return order
      .map((key) => ({
        key,
        label: labels[key],
        items: projectItems
          .filter((i) => i.category === key)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
      }))
      .filter((g) => g.items.length)
  }, [projectItems])

  async function complete(item) {
    await updateOfficeSchedule(item.id, { status: 'completed' })
    await refresh()
  }

  async function saveDate(item) {
    await updateOfficeSchedule(item.id, { date: editDate || null })
    setEditingId(null)
    await refresh()
  }

  function renderTimelineItem(item) {
    const date = itemEffectiveDate(item)
    const health = item.isMilestone ? milestoneHealth(item, schedule || [], todayKey()) : 'normal'
    const warnings = dependencyWarnings(item, schedule || [], todayKey())
    const relatedTasks = tasks.filter(
      (t) => t.id === item.relatedTaskId || t.scheduleId === item.id,
    )
    const deps = (item.dependsOn || []).map((id) => byId.get(id)).filter(Boolean)

    return (
      <article key={item.id} className={`sch-tl-item sch-tl-item--${health}`}>
        <div className="sch-tl-item__rail" aria-hidden />
        <div className="sch-tl-item__body">
          <div className="sch-tl-item__top">
            <time>{date ? formatKoreanDateTime(date, item.time) : '날짜 미정'}</time>
            {item.isMilestone && date ? (
              <span className="sch-countdown">{countdownLabel(date)}</span>
            ) : null}
            {item.isMilestone ? (
              <span className={`sch-health sch-health--${health}`}>{HEALTH_LABEL[health]}</span>
            ) : null}
            {item.isMilestone ? <span className="sch-tag">Phase</span> : null}
            <span className="office-badge">{SCHEDULE_STATUS_LABEL[item.status] || item.status}</span>
          </div>
          <h3>{item.title}</h3>
          {item.roundName ? <p className="sch-muted">{item.roundName}</p> : null}
          {deps.length ? (
            <p className="sch-deps">
              선행: {deps.map((d) => d.title).join(' → ')} → {item.title}
            </p>
          ) : null}
          {warnings.map((w, i) => (
            <p key={`${w.kind}-${i}`} className="sch-warn">
              {w.text}
              {w.depTitle ? ` (${w.depTitle})` : ''}
            </p>
          ))}
          {relatedTasks.length ? (
            <p className="sch-muted">관련 업무: {relatedTasks.map((t) => t.title).join(', ')}</p>
          ) : null}
          {item.notes ? <p className="sch-muted">{item.notes}</p> : null}
          <div className="sch-row__actions">
            {item.status !== 'completed' ? (
              <button type="button" className="office-btn office-btn--primary" onClick={() => complete(item)}>
                완료
              </button>
            ) : (
              <span className="sch-tag">완료 / 지남</span>
            )}
            <button type="button" className="office-btn" onClick={() => setEditItem(item)}>
              수정
            </button>
            <button
              type="button"
              className="office-btn"
              onClick={() => {
                setEditingId(item.id)
                setEditDate(date || '')
              }}
            >
              날짜 변경
            </button>
            {editingId === item.id ? (
              <span className="sch-inline-date">
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                <button type="button" className="office-btn" onClick={() => saveDate(item)}>
                  저장
                </button>
              </span>
            ) : null}
          </div>
        </div>
      </article>
    )
  }

  return (
    <div className={`office-page sch-page${lockedProjectId ? ' sch-page--embedded' : ''}`}>
      {!lockedProjectId ? (
        <div className="sch-page__head">
          <div>
            <p className="office-page__eyebrow">홈</p>
            <h2 className="office-page__title">타임라인</h2>
            <p className="office-page__lead">프로젝트별 다음 단계와 선행 관계를 봅니다.</p>
          </div>
          <button type="button" className="office-btn office-btn--primary" onClick={() => setAddOpen(true)}>
            + 다음 단계 추가
          </button>
        </div>
      ) : (
        <div className="sch-page__head sch-page__head--compact">
          <h3>타임라인</h3>
          <button type="button" className="office-btn office-btn--primary" onClick={() => setAddOpen(true)}>
            + 다음 단계
          </button>
        </div>
      )}

      {!lockedProjectId ? (
        <label className="sch-project-select">
          <span>프로젝트</span>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {activeProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {loading ? <p>불러오는 중…</p> : null}

      {phaseGroups ? (
        phaseGroups.map((group) => (
          <section key={group.key} className="sch-section">
            <h3 className="sch-section__title">{group.label}</h3>
            <div className="sch-timeline">{group.items.map((item) => renderTimelineItem(item))}</div>
          </section>
        ))
      ) : (
        <>
          <div className="sch-timeline">{dated.map((item) => renderTimelineItem(item))}</div>
          <section className="sch-section">
            <h3 className="sch-section__title">날짜 미정</h3>
            {undated.length === 0 ? <p className="sch-empty">없음</p> : null}
            {undated.map((item) => renderTimelineItem(item))}
          </section>
        </>
      )}

      {addOpen ? (
        <ScheduleAddModal
          onClose={() => setAddOpen(false)}
          onSaved={refresh}
          initialProjectId={projectId}
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
