import { useEffect, useId, useState } from 'react'
import { createOfficeSchedule } from '../../lib/officeApi'
import { PRIORITY_LABEL, useOfficeData } from '../OfficeDataContext'
import { SCHEDULE_STATUS_LABEL, SCHEDULE_TYPE_LABEL, todayKey } from './scheduleUtils'

export default function ScheduleAddModal({
  onClose,
  onSaved,
  initialTitle = '',
  initialProjectId = '',
  initialDate = '',
}) {
  const titleId = useId()
  const { activeProjects, agents, refresh } = useOfficeData()
  const [form, setForm] = useState({
    projectId: initialProjectId || activeProjects[0]?.id || '',
    title: initialTitle,
    description: '',
    date: initialDate || todayKey(),
    endDate: '',
    type: 'task',
    status: 'upcoming',
    priority: 'medium',
    assignedAgentId: '',
    waitingFor: '',
    followUpDate: '',
    isMilestone: false,
    createTask: true,
  })
  const [advanced, setAdvanced] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    setError('')
    try {
      await createOfficeSchedule({
        ...form,
        projectId: form.projectId || null,
        assignedAgentId: form.assignedAgentId || null,
        endDate: form.endDate || null,
        followUpDate: form.followUpDate || null,
        waitingFor: form.waitingFor || null,
        status: form.waitingFor ? 'waiting' : form.status,
      })
      await refresh()
      onSaved?.()
      onClose?.()
    } catch (err) {
      setError(err.message || '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="office-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="office-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="office-modal__head">
          <h2 id={titleId}>일정 추가</h2>
          <button type="button" className="office-details__close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <form className="office-form" onSubmit={submit}>
          <label>
            <span>프로젝트</span>
            <select
              value={form.projectId}
              onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
            >
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>제목</span>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </label>
          <label>
            <span>날짜</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </label>
          <label>
            <span>유형</span>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {Object.entries(SCHEDULE_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>우선순위</span>
            <select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            >
              {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>상태</span>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {Object.entries(SCHEDULE_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>담당</span>
            <select
              value={form.assignedAgentId}
              onChange={(e) => setForm((f) => ({ ...f, assignedAgentId: e.target.value }))}
            >
              <option value="">없음</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>설명</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className="office-check">
            <input
              type="checkbox"
              checked={form.createTask}
              onChange={(e) => setForm((f) => ({ ...f, createTask: e.target.checked }))}
            />
            <span>연결된 업무(Task)도 만들기</span>
          </label>
          <button type="button" className="office-btn" onClick={() => setAdvanced((v) => !v)}>
            {advanced ? '간단히' : '고급 옵션'}
          </button>
          {advanced ? (
            <>
              <label>
                <span>종료일</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </label>
              <label>
                <span>대기 대상</span>
                <input
                  value={form.waitingFor}
                  onChange={(e) => setForm((f) => ({ ...f, waitingFor: e.target.value }))}
                  placeholder="예: 공급사 회신"
                />
              </label>
              <label>
                <span>Follow-up 날짜</span>
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))}
                />
              </label>
              <label className="office-check">
                <input
                  type="checkbox"
                  checked={form.isMilestone}
                  onChange={(e) => setForm((f) => ({ ...f, isMilestone: e.target.checked }))}
                />
                <span>마일스톤</span>
              </label>
            </>
          ) : null}
          {error ? <p style={{ color: '#8b3a3a' }}>{error}</p> : null}
          <div className="office-modal__actions">
            <button type="button" className="office-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="office-btn office-btn--primary" disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Lightweight Korean date parse — returns { title, date, projectHint } */
export function parseQuickSchedule(text) {
  const raw = String(text || '').trim()
  if (!raw) return null
  let projectHint = ''
  let rest = raw
  if (/김치\s*하우스|kimchi/i.test(raw)) {
    projectHint = 'kimchi'
    rest = raw.replace(/김치\s*하우스|Kimchi\s*House(\s*AU)?/gi, '').trim()
  } else if (/한글\s*과자|hangeul|hangul/i.test(raw)) {
    projectHint = 'hangeul'
    rest = raw.replace(/한글\s*과자|Hangeul\s*Snack/gi, '').trim()
  }
  const m = rest.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/) || raw.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/)
  if (!m) return { title: rest || raw, date: '', projectHint }
  const year = new Date().getFullYear()
  const month = String(m[1]).padStart(2, '0')
  const day = String(m[2]).padStart(2, '0')
  const title = (rest || raw).replace(m[0], '').replace(/\s+/g, ' ').trim() || raw
  return { title, date: `${year}-${month}-${day}`, projectHint }
}
