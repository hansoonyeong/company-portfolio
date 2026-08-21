const API_BASE = '/api/wedding'
const TOKEN_KEY = 'wedding-admin-token'

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export function fetchWeddingSessions(excludeToken) {
  const qs = excludeToken ? `?excludeToken=${encodeURIComponent(excludeToken)}` : ''
  return request(`/sessions${qs}`)
}

export function submitRsvp(payload) {
  return request('/rsvp', { method: 'POST', body: JSON.stringify(payload) })
}

export function fetchRsvpByToken(token) {
  return request(`/rsvp/${token}`)
}

export function updateRsvpByToken(token, payload) {
  return request(`/rsvp/${token}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function weddingAdminLogin(password) {
  return request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
}

export function fetchWeddingStats(token) {
  return request('/admin/stats', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function fetchWeddingRsvps(token, { q = '', filter = '' } = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (filter) params.set('filter', filter)
  const qs = params.toString() ? `?${params}` : ''
  return request(`/admin/rsvps${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function adminCreateRsvp(token, payload) {
  return request('/admin/rsvps', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export function adminUpdateRsvp(token, id, payload) {
  return request(`/admin/rsvps/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export function adminMoveGuestMeal(token, guestId, mealSession) {
  return request(`/admin/guests/${guestId}/meal`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mealSession }),
  })
}

export function getWeddingAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setWeddingAdminToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearWeddingAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function getWeddingCsvUrl(token) {
  return `${API_BASE}/admin/export.csv?token=${encodeURIComponent(token)}`
}

export async function downloadWeddingCsv(token) {
  const res = await fetch(`${API_BASE}/admin/export.csv`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Export failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'wedding-rsvps.csv'
  a.click()
  URL.revokeObjectURL(url)
}
