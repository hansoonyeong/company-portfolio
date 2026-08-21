import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchRsvpByToken,
  fetchWeddingSessions,
  submitRsvp,
  updateRsvpByToken,
} from '../lib/weddingApi.js'
import WeddingRsvpSteps from './WeddingRsvpSteps.jsx'

const EMPTY_COMPANION = { name: '', unknownName: false }

function buildCompanionDraft(count, prev = []) {
  const needed = Math.max(0, count - 1)
  const next = []
  for (let i = 0; i < needed; i += 1) {
    next.push(prev[i] ? { ...prev[i] } : { ...EMPTY_COMPANION })
  }
  return next
}

function guestLabels(primaryName, companions) {
  const labels = [{ id: 'primary', name: primaryName || '대표 예약자' }]
  companions.forEach((_, i) => {
    labels.push({ id: `companion-${i}`, name: companions[i]?.name || `동반인 ${i + 1}` })
  })
  return labels
}

function nextView(view, attending, guestCount) {
  if (view === 'name') return 'attend'
  if (view === 'attend') return attending ? 'count' : 'confirm'
  if (view === 'count') return guestCount > 1 ? 'companions' : 'meal'
  if (view === 'companions') return 'meal'
  if (view === 'meal') return 'after'
  if (view === 'after') return 'confirm'
  return view
}

function prevView(view, attending, guestCount) {
  if (view === 'attend') return 'name'
  if (view === 'count') return 'attend'
  if (view === 'companions') return 'count'
  if (view === 'meal') return guestCount > 1 ? 'companions' : 'count'
  if (view === 'after') return 'meal'
  if (view === 'confirm') return attending ? 'after' : 'attend'
  return view
}

export default function WeddingRsvpForm({ editToken, onTokenChange }) {
  const [view, setView] = useState('name')
  const [loading, setLoading] = useState(Boolean(editToken))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sessions, setSessions] = useState([])
  const [saved, setSaved] = useState(null)

  const [primaryGuestName, setPrimaryGuestName] = useState('')
  const [attending, setAttending] = useState(null)
  const [guestCount, setGuestCount] = useState(1)
  const [companions, setCompanions] = useState([])
  const [mealSession, setMealSession] = useState('')
  const [afterPartyIds, setAfterPartyIds] = useState([])
  const companionDraftRef = useRef([])

  const loadSessions = useCallback(async (token) => {
    const data = await fetchWeddingSessions(token)
    setSessions(data.sessions || [])
  }, [])

  useEffect(() => {
    loadSessions(editToken).catch(() => {})
  }, [editToken, loadSessions])

  useEffect(() => {
    if (!editToken) return undefined
    setLoading(true)
    fetchRsvpByToken(editToken)
      .then((rsvp) => {
        setSaved(rsvp)
        setPrimaryGuestName(rsvp.primaryGuestName || '')
        setAttending(rsvp.attending)
        setGuestCount(rsvp.guestCount || 1)
        const comps = (rsvp.guests || [])
          .filter((g) => !g.isPrimary)
          .map((g) => ({ name: g.name || '', unknownName: g.unknownName }))
        setCompanions(comps)
        companionDraftRef.current = comps
        setMealSession(rsvp.mealSession || '')
        const ids = []
        ;(rsvp.guests || []).forEach((g, idx) => {
          if (!g.afterPartyAttending) return
          if (g.isPrimary) ids.push('primary')
          else ids.push(`companion-${idx - 1}`)
        })
        setAfterPartyIds(ids)
        setView('name')
      })
      .catch(() => setError('예약 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [editToken])

  const handleGuestCountChange = (next) => {
    const clamped = Math.max(1, next)
    companionDraftRef.current = buildCompanionDraft(clamped, companions)
    setCompanions(companionDraftRef.current)
    setGuestCount(clamped)
    setAfterPartyIds((prev) =>
      prev.filter((id) => {
        if (id === 'primary') return true
        const idx = Number(id.replace('companion-', ''))
        return idx < clamped - 1
      }),
    )
  }

  const canSelectSession = (session) => {
    if (!session.available) return false
    if (session.remaining !== null && guestCount > session.remaining) return false
    return true
  }

  const payload = useMemo(
    () => ({
      primaryGuestName,
      attending: attending === true,
      guestCount: attending ? guestCount : 0,
      companionNames: companions.slice(0, Math.max(0, guestCount - 1)),
      mealSession: attending ? mealSession : null,
      afterPartyGuestIds: attending ? afterPartyIds : [],
    }),
    [primaryGuestName, attending, guestCount, companions, mealSession, afterPartyIds],
  )

  const guestList = useMemo(
    () => guestLabels(primaryGuestName, companions.slice(0, Math.max(0, guestCount - 1))),
    [primaryGuestName, companions, guestCount],
  )

  const validateView = () => {
    if (view === 'name' && !primaryGuestName.trim()) return '성함을 입력해주세요.'
    if (view === 'attend' && attending === null) return '참석 여부를 선택해주세요.'
    if (view === 'companions') {
      const needed = companions.slice(0, guestCount - 1)
      for (let i = 0; i < needed.length; i += 1) {
        const c = needed[i]
        if (!c.unknownName && !c.name.trim()) {
          return `동반인 ${i + 1} 이름을 입력하거나 "아직 모르겠어요"를 선택해주세요.`
        }
      }
    }
    if (view === 'meal' && !mealSession) return '식사 시간을 선택해주세요.'
    return ''
  }

  const handleNext = () => {
    const message = validateView()
    if (message) {
      setError(message)
      return
    }
    setError('')
    setView((current) => nextView(current, attending === true, guestCount))
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    try {
      const result = editToken
        ? await updateRsvpByToken(editToken, payload)
        : await submitRsvp(payload)
      setSaved(result)
      onTokenChange?.(result.editToken)
      setView('done')
      await loadSessions(result.editToken)
    } catch (err) {
      setError(err.message || '제출에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="wedding-hint">예약 정보를 불러오는 중…</p>
  }

  return (
    <WeddingRsvpSteps
      view={view}
      error={error}
      submitting={submitting}
      sessions={sessions}
      primaryGuestName={primaryGuestName}
      attending={attending}
      guestCount={guestCount}
      companions={companions}
      mealSession={mealSession}
      afterPartyIds={afterPartyIds}
      guestList={guestList}
      saved={saved}
      canSelectSession={canSelectSession}
      onName={setPrimaryGuestName}
      onAttend={setAttending}
      onGuestCount={handleGuestCountChange}
      onCompanion={(index, name) => {
        const next = [...companions]
        next[index] = { ...next[index], name, unknownName: false }
        companionDraftRef.current = next
        setCompanions(next)
      }}
      onUnknownName={(index, checked) => {
        const next = [...companions]
        next[index] = {
          ...next[index],
          unknownName: checked,
          name: checked ? '' : next[index].name,
        }
        companionDraftRef.current = next
        setCompanions(next)
      }}
      onMeal={setMealSession}
      onAfterParty={(id, checked) => {
        setAfterPartyIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)))
      }}
      onBack={() => {
        setError('')
        setView((current) => prevView(current, attending === true, guestCount))
      }}
      onNext={handleNext}
      onSubmit={handleSubmit}
      onEditAgain={() => setView('name')}
    />
  )
}
