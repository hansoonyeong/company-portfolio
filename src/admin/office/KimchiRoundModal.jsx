import { useEffect, useId, useMemo, useState } from 'react'
import { createKimchiRound } from '../../lib/officeApi'

const TEMPLATE = [
  { title: '상품/가격 최종 확인', type: 'task', key: 'confirm' },
  { title: '고객 안내문 작성', type: 'announcement', key: 'draft' },
  { title: '안내문 검수', type: 'task', key: 'review' },
  { title: '안내문 발송', type: 'announcement', key: 'send', isMilestone: true },
  { title: '주문 접수', type: 'order_period', key: 'open', isMilestone: true },
  { title: '주문 마감', type: 'deadline', key: 'deadline', isMilestone: true },
  { title: '최종 주문 정리', type: 'task', key: 'finalize' },
  { title: '배송 준비', type: 'shipping', key: 'prep' },
  { title: '배송 시작', type: 'delivery', key: 'delivery', isMilestone: true },
  { title: '고객 문의 대응', type: 'task', key: 'cs' },
  { title: '차수 종료', type: 'milestone', key: 'close', isMilestone: true },
]

function buildPreview(form) {
  const open = form.orderOpenDate
  const deadline = form.orderDeadline
  const delivery = form.deliveryStartDate
  const announce = form.announcementDate || open
  const end = form.deliveryEndDate || delivery
  const dates = {
    confirm: open,
    draft: announce,
    review: announce,
    send: announce,
    open,
    deadline,
    finalize: deadline,
    prep: delivery,
    delivery,
    cs: delivery,
    close: end,
  }
  return TEMPLATE.map((step) => ({
    ...step,
    date: dates[step.key] || null,
    included: true,
  }))
}

export default function KimchiRoundModal({ projectId, onClose, onSaved }) {
  const titleId = useId()
  const [form, setForm] = useState({
    roundName: '',
    orderOpenDate: '',
    orderDeadline: '',
    deliveryStartDate: '',
    announcementDate: '',
    deliveryEndDate: '',
  })
  const [steps, setSteps] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const canPreview = form.orderOpenDate && form.orderDeadline && form.deliveryStartDate

  useEffect(() => {
    if (!canPreview) return
    setSteps((prev) => {
      const next = buildPreview(form)
      if (!prev.length) return next
      return next.map((step) => {
        const old = prev.find((p) => p.key === step.key)
        return old
          ? { ...step, included: old.included, date: old.date || step.date }
          : step
      })
    })
  }, [canPreview, form])

  const included = useMemo(() => steps.filter((s) => s.included), [steps])

  async function submit(e) {
    e.preventDefault()
    if (!form.roundName.trim()) {
      setError('차수명이 필요합니다.')
      return
    }
    if (!canPreview) {
      setError('주문 시작일, 마감일, 배송 예정일이 필요합니다.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createKimchiRound({
        projectId,
        ...form,
        steps: included.map((s) => ({
          title: s.title,
          type: s.type,
          date: s.date,
          isMilestone: Boolean(s.isMilestone),
        })),
      })
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
        className="office-modal office-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="office-modal__head">
          <h2 id={titleId}>새 차수 만들기</h2>
          <button type="button" className="office-details__close" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="office-form" onSubmit={submit}>
          <label>
            <span>차수명</span>
            <input
              value={form.roundName}
              onChange={(e) => setForm((f) => ({ ...f, roundName: e.target.value }))}
              placeholder="예: 9월 차수"
              required
            />
          </label>
          <label>
            <span>주문 시작일</span>
            <input
              type="date"
              value={form.orderOpenDate}
              onChange={(e) => setForm((f) => ({ ...f, orderOpenDate: e.target.value }))}
              required
            />
          </label>
          <label>
            <span>주문 마감일</span>
            <input
              type="date"
              value={form.orderDeadline}
              onChange={(e) => setForm((f) => ({ ...f, orderDeadline: e.target.value }))}
              required
            />
          </label>
          <label>
            <span>배송 예정일</span>
            <input
              type="date"
              value={form.deliveryStartDate}
              onChange={(e) => setForm((f) => ({ ...f, deliveryStartDate: e.target.value }))}
              required
            />
          </label>
          <label>
            <span>안내문 발송일 (선택)</span>
            <input
              type="date"
              value={form.announcementDate}
              onChange={(e) => setForm((f) => ({ ...f, announcementDate: e.target.value }))}
            />
          </label>
          <label>
            <span>배송 종료일 (선택)</span>
            <input
              type="date"
              value={form.deliveryEndDate}
              onChange={(e) => setForm((f) => ({ ...f, deliveryEndDate: e.target.value }))}
            />
          </label>

          {steps.length ? (
            <div className="sch-round-preview">
              <h3>운영 단계 미리보기</h3>
              <p className="sch-muted">날짜를 수정하거나 불필요한 단계를 제외할 수 있습니다.</p>
              <ol className="sch-round-steps">
                {steps.map((step, index) => (
                  <li key={step.key}>
                    <label className="office-check">
                      <input
                        type="checkbox"
                        checked={step.included}
                        onChange={(e) =>
                          setSteps((list) =>
                            list.map((s, i) =>
                              i === index ? { ...s, included: e.target.checked } : s,
                            ),
                          )
                        }
                      />
                      <span>{step.title}</span>
                    </label>
                    <input
                      type="date"
                      value={step.date || ''}
                      disabled={!step.included}
                      onChange={(e) =>
                        setSteps((list) =>
                          list.map((s, i) => (i === index ? { ...s, date: e.target.value } : s)),
                        )
                      }
                    />
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="sch-muted">필수 날짜를 입력하면 표준 단계가 미리보기로 표시됩니다.</p>
          )}

          {error ? <p style={{ color: '#8b3a3a' }}>{error}</p> : null}
          <div className="office-modal__actions">
            <button type="button" className="office-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="office-btn office-btn--primary" disabled={saving}>
              {saving ? '저장 중…' : '차수 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
