import crypto from 'crypto'
import { weddingConfig } from '../../src/wedding/config/weddingConfig.js'
import { canBookSession, getRemainingSeats } from './capacity.js'
import { withRsvpTransaction } from './store.js'

function normalizeName(name) {
  return (name || '').trim()
}

function buildGuests(primaryName, companionNames, afterPartyIds, guestCount, mealSession, existingGuests = []) {
  const existingCompanions = existingGuests.filter((g) => !g.isPrimary)
  const existingPrimary = existingGuests.find((g) => g.isPrimary)

  const guests = [
    {
      id: existingPrimary?.id || crypto.randomUUID(),
      name: primaryName,
      isPrimary: true,
      unknownName: false,
      afterPartyAttending: afterPartyIds.includes('primary'),
      mealSession: mealSession || null,
    },
  ]

  for (let i = 0; i < guestCount - 1; i += 1) {
    const companion = companionNames[i] || {}
    guests.push({
      id: existingCompanions[i]?.id || crypto.randomUUID(),
      name: companion.unknownName ? null : normalizeName(companion.name),
      isPrimary: false,
      unknownName: Boolean(companion.unknownName),
      afterPartyAttending: afterPartyIds.includes(`companion-${i}`),
      mealSession: mealSession || null,
    })
  }

  return guests
}

function validateRsvpPayload(body, rsvps, excludeRsvpId = null, existingGuests = []) {
  const primaryGuestName = normalizeName(body.primaryGuestName)
  if (!primaryGuestName) {
    return { error: '대표 예약자 성함을 입력해주세요.' }
  }

  const attending = Boolean(body.attending)
  const guestCount = attending ? Math.max(1, Number(body.guestCount) || 1) : 0

  if (attending && guestCount < 1) {
    return { error: '참석 인원을 선택해주세요.' }
  }

  const companionNames = Array.isArray(body.companionNames) ? body.companionNames : []
  if (attending && guestCount > 1) {
    const needed = guestCount - 1
    if (companionNames.length < needed) {
      return { error: '동반 참석자 정보를 입력해주세요.' }
    }
    for (let i = 0; i < needed; i += 1) {
      const c = companionNames[i] || {}
      if (!c.unknownName && !normalizeName(c.name)) {
        return { error: `동반인 ${i + 1} 이름을 입력하거나 "아직 모르겠어요"를 선택해주세요.` }
      }
    }
  }

  let mealSession = null
  let mealGuestCount = 0

  if (attending) {
    mealSession = body.mealSession || null
    if (!mealSession || !weddingConfig.meal.sessions.some((s) => s.id === mealSession)) {
      return { error: '식사 시간을 선택해주세요.' }
    }
    mealGuestCount = guestCount
    if (!canBookSession(rsvps, mealSession, mealGuestCount, excludeRsvpId)) {
      const remaining = getRemainingSeats(rsvps, mealSession, excludeRsvpId)
      return {
        error: `선택하신 시간에는 ${remaining}자리만 남아 있습니다. 다른 식사 시간을 선택해주세요.`,
      }
    }
  }

  const afterPartyIds = Array.isArray(body.afterPartyGuestIds) ? body.afterPartyGuestIds : []
  if (attending && afterPartyIds.length > guestCount) {
    return { error: '애프터파티 참석 인원은 예식 참석 인원을 초과할 수 없습니다.' }
  }

  const guests = attending
    ? buildGuests(primaryGuestName, companionNames, afterPartyIds, guestCount, mealSession, existingGuests)
    : [
        {
          id: existingGuests.find((g) => g.isPrimary)?.id || crypto.randomUUID(),
          name: primaryGuestName,
          isPrimary: true,
          unknownName: false,
          afterPartyAttending: false,
          mealSession: null,
        },
      ]

  return {
    data: {
      primaryGuestName,
      attending,
      guestCount: attending ? guestCount : 0,
      mealSession: attending ? mealSession : null,
      mealGuestCount: attending ? mealGuestCount : 0,
      guests,
    },
  }
}

export async function createRsvp(body) {
  return withRsvpTransaction(async (rsvps) => {
    const validated = validateRsvpPayload(body, rsvps)
    if (validated.error) {
      const err = new Error(validated.error)
      err.status = 400
      throw err
    }

    const now = new Date().toISOString()
    const rsvp = {
      id: crypto.randomUUID(),
      editToken: crypto.randomBytes(24).toString('hex'),
      ...validated.data,
      createdAt: now,
      updatedAt: now,
    }

    return { rsvps: [rsvp, ...rsvps], value: rsvp }
  })
}

export async function updateRsvp(token, body) {
  return withRsvpTransaction(async (rsvps) => {
    const index = rsvps.findIndex((r) => r.editToken === token)
    if (index === -1) {
      const err = new Error('예약을 찾을 수 없습니다.')
      err.status = 404
      throw err
    }

    const existing = rsvps[index]
    const validated = validateRsvpPayload(body, rsvps, existing.id, existing.guests || [])
    if (validated.error) {
      const err = new Error(validated.error)
      err.status = 400
      throw err
    }

    const updated = {
      ...existing,
      ...validated.data,
      updatedAt: new Date().toISOString(),
    }

    const next = [...rsvps]
    next[index] = updated
    return { rsvps: next, value: updated }
  })
}

export async function adminUpdateRsvp(id, body) {
  return withRsvpTransaction(async (rsvps) => {
    const index = rsvps.findIndex((r) => r.id === id)
    if (index === -1) {
      const err = new Error('Not found')
      err.status = 404
      throw err
    }

    const existing = rsvps[index]
    const validated = validateRsvpPayload(body, rsvps, existing.id, existing.guests || [])
    if (validated.error) {
      const err = new Error(validated.error)
      err.status = 400
      throw err
    }

    const updated = {
      ...existing,
      ...validated.data,
      updatedAt: new Date().toISOString(),
    }

    const next = [...rsvps]
    next[index] = updated
    return { rsvps: next, value: updated }
  })
}

export async function adminMoveGuestMeal(guestId, mealSession) {
  return withRsvpTransaction(async (rsvps) => {
    if (!weddingConfig.meal.sessions.some((s) => s.id === mealSession)) {
      const err = new Error('식사 시간이 올바르지 않습니다.')
      err.status = 400
      throw err
    }

    const rsvpIndex = rsvps.findIndex((r) => (r.guests || []).some((g) => g.id === guestId))
    if (rsvpIndex === -1) {
      const err = new Error('참석자를 찾을 수 없습니다.')
      err.status = 404
      throw err
    }

    const existing = rsvps[rsvpIndex]
    if (!existing.attending) {
      const err = new Error('불참 예약은 식사 시간을 변경할 수 없습니다.')
      err.status = 400
      throw err
    }

    const seats = getRemainingSeats(rsvps, mealSession, null, guestId)
    if (seats < 1) {
      const err = new Error('선택하신 시간에는 자리가 부족합니다.')
      err.status = 400
      throw err
    }

    const guests = (existing.guests || []).map((guest) =>
      guest.id === guestId ? { ...guest, mealSession } : { ...guest, mealSession: guest.mealSession || existing.mealSession },
    )
    const uniqueSessions = [...new Set(guests.map((g) => g.mealSession).filter(Boolean))]

    const updated = {
      ...existing,
      guests,
      mealSession: uniqueSessions.length === 1 ? uniqueSessions[0] : existing.mealSession,
      mealGuestCount: guests.filter((g) => g.mealSession === (uniqueSessions.length === 1 ? uniqueSessions[0] : existing.mealSession)).length,
      updatedAt: new Date().toISOString(),
    }

    const next = [...rsvps]
    next[rsvpIndex] = updated
    return { rsvps: next, value: updated }
  })
}

export async function adminCreateRsvp(body) {
  return createRsvp(body)
}

export function sanitizeRsvpForGuest(rsvp) {
  return {
    id: rsvp.id,
    editToken: rsvp.editToken,
    primaryGuestName: rsvp.primaryGuestName,
    attending: rsvp.attending,
    guestCount: rsvp.guestCount,
    mealSession: rsvp.mealSession,
    mealGuestCount: rsvp.mealGuestCount,
    guests: rsvp.guests,
    createdAt: rsvp.createdAt,
    updatedAt: rsvp.updatedAt,
  }
}
