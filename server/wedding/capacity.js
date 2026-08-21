import { weddingConfig } from '../../src/wedding/config/weddingConfig.js'

export function getSessionCapacity(sessionId) {
  const session = weddingConfig.meal.sessions.find((s) => s.id === sessionId)
  return session?.capacity ?? 0
}

export function guestMealSession(rsvp, guest) {
  return guest?.mealSession || rsvp?.mealSession || null
}

export function countMealBookings(rsvps, sessionId, excludeRsvpId = null, excludeGuestId = null) {
  return rsvps.reduce((sum, rsvp) => {
    if (!rsvp.attending) return sum
    if (rsvp.id === excludeRsvpId) return sum
    const guests = rsvp.guests?.length ? rsvp.guests : []
    if (guests.length === 0) {
      if (rsvp.mealSession !== sessionId) return sum
      return sum + (rsvp.mealGuestCount || 0)
    }
    return (
      sum +
      guests.filter((guest) => {
        if (guest.id === excludeGuestId) return false
        return guestMealSession(rsvp, guest) === sessionId
      }).length
    )
  }, 0)
}

export function getRemainingSeats(rsvps, sessionId, excludeRsvpId = null, excludeGuestId = null) {
  const capacity = getSessionCapacity(sessionId)
  const booked = countMealBookings(rsvps, sessionId, excludeRsvpId, excludeGuestId)
  return Math.max(0, capacity - booked)
}

export function canBookSession(rsvps, sessionId, guestCount, excludeRsvpId = null) {
  const remaining = getRemainingSeats(rsvps, sessionId, excludeRsvpId)
  return remaining >= guestCount
}

/** Public-facing availability — never expose exact count above threshold */
export function getPublicSessionStatus(rsvps, sessionId, excludeRsvpId = null) {
  const remaining = getRemainingSeats(rsvps, sessionId, excludeRsvpId)

  if (remaining <= 0) {
    return { available: false, status: 'closed', statusLabel: '예약 마감', remaining: 0 }
  }
  if (remaining >= 16) {
    return { available: true, status: 'open', statusLabel: '예약 가능', remaining: null }
  }
  if (remaining <= 5) {
    return {
      available: true,
      status: 'urgent',
      statusLabel: `${remaining}자리 남았어요`,
      statusHint: '마감 임박',
      remaining,
    }
  }
  return {
    available: true,
    status: 'limited',
    statusLabel: `${remaining}자리 남았어요`,
    remaining,
  }
}

export function getAdminSessionStats(rsvps) {
  return weddingConfig.meal.sessions.map((session) => {
    const booked = countMealBookings(rsvps, session.id)
    return {
      id: session.id,
      label: session.label,
      capacity: session.capacity,
      booked,
      remaining: Math.max(0, session.capacity - booked),
    }
  })
}

export function countAfterPartyGuests(rsvps) {
  return rsvps.reduce((sum, rsvp) => {
    if (!rsvp.attending) return sum
    const count = (rsvp.guests || []).filter((g) => g.afterPartyAttending).length
    return sum + count
  }, 0)
}
