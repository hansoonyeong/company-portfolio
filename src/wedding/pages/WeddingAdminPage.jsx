import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { weddingConfig, formatSessionTime, getSessionById } from '../config/weddingConfig.js'
import WeddingRsvpForm from '../components/WeddingRsvpForm.jsx'
import {
  adminMoveGuestMeal,
  clearWeddingAdminToken,
  downloadWeddingCsv,
  fetchWeddingRsvps,
  fetchWeddingStats,
  getWeddingAdminToken,
  setWeddingAdminToken,
  weddingAdminLogin,
} from '../lib/weddingApi.js'
import '../styles/wedding-admin.css'

function guestName(guest, fallback = '미입력') {
  if (guest?.unknownName || !guest?.name) return fallback
  return guest.name
}

function flattenGuests(rsvps) {
  return rsvps.flatMap((rsvp) => {
    if (!rsvp.attending) return []
    const guests = rsvp.guests?.length
      ? rsvp.guests
      : [{ id: `${rsvp.id}-primary`, name: rsvp.primaryGuestName, isPrimary: true, mealSession: rsvp.mealSession }]
    return guests.map((guest) => ({
      ...guest,
      rsvpId: rsvp.id,
      partyName: rsvp.primaryGuestName,
      mealSession: guest.mealSession || rsvp.mealSession || null,
    }))
  })
}

export default function WeddingAdminPage() {
  const [token, setToken] = useState(() => getWeddingAdminToken())
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [stats, setStats] = useState(null)
  const [rsvps, setRsvps] = useState([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState(null)
  const [moveError, setMoveError] = useState('')
  const [draggingId, setDraggingId] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [statsData, rsvpData] = await Promise.all([
        fetchWeddingStats(token),
        fetchWeddingRsvps(token, { q, filter }),
      ])
      setStats(statsData)
      setRsvps(rsvpData)
    } catch {
      clearWeddingAdminToken()
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [token, q, filter])

  useEffect(() => {
    load()
  }, [load])

  const guests = useMemo(() => flattenGuests(rsvps), [rsvps])
  const afterGuests = guests.filter((g) => g.afterPartyAttending)
  const declined = rsvps.filter((r) => !r.attending)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    try {
      const { token: nextToken } = await weddingAdminLogin(password)
      setWeddingAdminToken(nextToken)
      setToken(nextToken)
      setPassword('')
    } catch {
      setLoginError('비밀번호가 올바르지 않습니다.')
    }
  }

  const moveGuest = async (guestId, mealSession) => {
    setMoveError('')
    try {
      await adminMoveGuestMeal(token, guestId, mealSession)
      await load()
    } catch (err) {
      setMoveError(err.message || '식사 시간을 바꾸지 못했습니다.')
    }
  }

  const onDropSession = (sessionId) => async (event) => {
    event.preventDefault()
    const guestId = event.dataTransfer.getData('text/guest-id')
    if (guestId) await moveGuest(guestId, sessionId)
    setDraggingId('')
  }

  if (!token) {
    return (
      <div className="wedding-admin">
        <form className="wedding-admin__login" onSubmit={handleLogin}>
          <h1 className="wedding-admin__title">Wedding Admin</h1>
          <input
            className="wedding-admin__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
          {loginError && <p className="wedding-error">{loginError}</p>}
          <button type="submit" className="wedding-btn wedding-btn--fill">
            Login
          </button>
          <Link to="/wedding" className="wedding-hint">
            ← 청첩장으로
          </Link>
        </form>
      </div>
    )
  }

  return (
    <div className="wedding-admin">
      <div className="wedding-admin__inner">
        <header className="wedding-admin__header">
          <h1 className="wedding-admin__title">Wedding Admin</h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/wedding" className="wedding-btn">
              청첩장
            </Link>
            <button
              type="button"
              className="wedding-btn"
              onClick={() => downloadWeddingCsv(token).catch(() => {})}
            >
              CSV 다운로드
            </button>
            <button
              type="button"
              className="wedding-btn"
              onClick={() => {
                clearWeddingAdminToken()
                setToken(null)
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {stats && (
          <dl className="wedding-admin__stats">
            <div className="wedding-admin__stat">
              <dt>RSVP</dt>
              <dd>{stats.totalRsvps}</dd>
            </div>
            <div className="wedding-admin__stat">
              <dt>예식 참석</dt>
              <dd>{stats.totalGuests}</dd>
            </div>
            <div className="wedding-admin__stat">
              <dt>불참</dt>
              <dd>{stats.declinedCount}</dd>
            </div>
            <div className="wedding-admin__stat">
              <dt>애프터파티</dt>
              <dd>{stats.afterPartyCount}</dd>
            </div>
            {stats.sessionStats?.map((s) => (
              <div key={s.id} className="wedding-admin__stat">
                <dt>식사 {s.label}</dt>
                <dd>
                  {s.booked}/{s.capacity} · 잔여 {s.remaining}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="wedding-admin__toolbar">
          <input
            className="wedding-admin__input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름 검색 (대표·동반인)"
          />
          <select
            className="wedding-admin__select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">전체</option>
            <option value="attending">참석</option>
            <option value="declined">불참</option>
            <option value="session1">식사 Session 1</option>
            <option value="session2">식사 Session 2</option>
            <option value="afterparty">애프터파티</option>
          </select>
          <button type="button" className="wedding-btn" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? '닫기' : '새 예약 추가'}
          </button>
        </div>

        {showCreate && (
          <div className="wedding-admin__panel">
            <WeddingRsvpForm
              onTokenChange={() => {
                setShowCreate(false)
                load()
              }}
            />
          </div>
        )}

        {editId && (
          <div className="wedding-admin__panel">
            <p className="wedding-hint">예약 수정</p>
            <WeddingRsvpForm
              editToken={rsvps.find((r) => r.id === editId)?.editToken}
              onTokenChange={() => {
                setEditId(null)
                load()
              }}
            />
          </div>
        )}

        <section className="wedding-admin__board-section">
          <h2 className="wedding-admin__section-title">식사 · 도동산방</h2>
          <p className="wedding-hint">카드를 다른 시간대로 드래그하면 식사 인원이 이동합니다.</p>
          {moveError && <p className="wedding-error">{moveError}</p>}
          <div className="wedding-admin__board">
            {weddingConfig.meal.sessions.map((session) => {
              const people = guests.filter((g) => g.mealSession === session.id)
              const stat = stats?.sessionStats?.find((s) => s.id === session.id)
              return (
                <div
                  key={session.id}
                  className="wedding-admin__column"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={onDropSession(session.id)}
                >
                  <header>
                    <p className="wedding-admin__column-label">{session.label}</p>
                    <p className="wedding-admin__column-meta">
                      {formatSessionTime(session)}
                      <br />
                      {people.length}명 · 잔여 {stat?.remaining ?? session.capacity - people.length}
                    </p>
                  </header>
                  <ul className="wedding-admin__people">
                    {people.length === 0 && <li className="wedding-admin__empty">아직 없음</li>}
                    {people.map((person) => (
                      <li
                        key={person.id}
                        className={`wedding-admin__person${draggingId === person.id ? ' is-dragging' : ''}`}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData('text/guest-id', person.id)
                          event.dataTransfer.effectAllowed = 'move'
                          setDraggingId(person.id)
                        }}
                        onDragEnd={() => setDraggingId('')}
                      >
                        <strong>{guestName(person)}</strong>
                        <span>
                          {person.isPrimary ? '대표' : '동반'} · {person.partyName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        <section className="wedding-admin__board-section">
          <h2 className="wedding-admin__section-title">애프터파티 · 미지의</h2>
          <ul className="wedding-admin__after-list">
            {afterGuests.length === 0 && <li className="wedding-admin__empty">아직 없음</li>}
            {afterGuests.map((person) => (
              <li key={person.id}>
                <strong>{guestName(person)}</strong>
                <span>{person.isPrimary ? '대표' : '동반'} · {person.partyName}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="wedding-admin__board-section">
          <h2 className="wedding-admin__section-title">예약 목록</h2>
          <div className="wedding-admin__table-wrap">
            <table className="wedding-admin__table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>구분</th>
                  <th>식사</th>
                  <th>애프터</th>
                  <th>예약</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>불러오는 중…</td>
                  </tr>
                ) : (
                  <>
                    {rsvps
                      .filter((r) => r.attending)
                      .flatMap((rsvp) =>
                        (rsvp.guests || []).map((guest) => {
                          const session = getSessionById(guest.mealSession || rsvp.mealSession)
                          return (
                            <tr key={guest.id}>
                              <td>{guestName(guest)}</td>
                              <td>{guest.isPrimary ? '대표' : '동반'}</td>
                              <td>{session ? `${session.label} ${formatSessionTime(session)}` : '—'}</td>
                              <td>{guest.afterPartyAttending ? '참석' : '—'}</td>
                              <td>{rsvp.primaryGuestName}</td>
                              <td>
                                <button
                                  type="button"
                                  className="wedding-admin__row-btn"
                                  onClick={() => setEditId(rsvp.id)}
                                >
                                  수정
                                </button>
                              </td>
                            </tr>
                          )
                        }),
                      )}
                    {declined.map((rsvp) => (
                      <tr key={rsvp.id}>
                        <td>{rsvp.primaryGuestName}</td>
                        <td>대표</td>
                        <td>불참</td>
                        <td>—</td>
                        <td>{rsvp.primaryGuestName}</td>
                        <td>
                          <button
                            type="button"
                            className="wedding-admin__row-btn"
                            onClick={() => setEditId(rsvp.id)}
                          >
                            수정
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!loading && rsvps.length === 0 && (
                      <tr>
                        <td colSpan={6}>예약 없음</td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
