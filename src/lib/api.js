const API_BASE = '/api'

async function parseApiError(res, fallback) {
  const text = await res.text().catch(() => '')
  if (!text) return fallback
  try {
    const err = JSON.parse(text)
    return err.error || fallback
  } catch {
    return text.slice(0, 200) || fallback
  }
}

async function apiFetch(url, options) {
  let res
  try {
    res = await fetch(url, options)
  } catch {
    throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.')
  }

  return res
}

export async function submitQuote(data) {
  const res = await fetch(`${API_BASE}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Submit failed')
  }

  return res.json()
}

export async function adminLogin(password) {
  let res
  try {
    res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
  } catch {
    throw new Error('SERVER_UNAVAILABLE')
  }

  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new Error('SERVER_UNAVAILABLE')
  }

  if (!res.ok) {
    throw new Error('INVALID_PASSWORD')
  }

  return res.json()
}

export async function fetchQuotes(token) {
  const res = await fetch(`${API_BASE}/quotes`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error('Unauthorized')
  }

  return res.json()
}

export async function updateQuoteStatus(token, id, status) {
  const res = await fetch(`${API_BASE}/quotes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  })

  if (!res.ok) {
    throw new Error('Update failed')
  }

  return res.json()
}

export async function fetchNews() {
  const res = await fetch(`${API_BASE}/news`)

  if (!res.ok) {
    throw new Error('Failed to load news')
  }

  return res.json()
}

export async function createNews(token, data) {
  const res = await fetch(`${API_BASE}/news`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Create failed')
  }

  return res.json()
}

export async function updateNews(token, id, data) {
  const res = await fetch(`${API_BASE}/news/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Update failed')
  }

  return res.json()
}

export async function deleteNews(token, id) {
  const res = await fetch(`${API_BASE}/news/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error('Delete failed')
  }

  return res.json()
}

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/projects`)

  if (!res.ok) {
    throw new Error('Failed to load projects')
  }

  return res.json()
}

export async function createProject(token, formData, slug = '') {
  const headers = { Authorization: `Bearer ${token}` }
  if (slug) headers['X-Project-Slug'] = slug

  const res = await apiFetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const message = await parseApiError(res, 'Create failed')
    if (res.status === 401) throw new Error('Unauthorized')
    throw new Error(message)
  }

  return res.json()
}

export async function updateProject(token, id, formData, slug = '') {
  const headers = { Authorization: `Bearer ${token}` }
  if (slug) headers['X-Project-Slug'] = slug

  const res = await apiFetch(`${API_BASE}/projects/${id}`, {
    method: 'PATCH',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const message = await parseApiError(res, 'Update failed')
    if (res.status === 401) throw new Error('Unauthorized')
    throw new Error(message)
  }

  return res.json()
}

export async function deleteProject(token, id) {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error('Delete failed')
  }

  return res.json()
}

export async function fetchHero() {
  const res = await fetch(`${API_BASE}/hero`)

  if (!res.ok) {
    throw new Error('Failed to load hero')
  }

  return res.json()
}

export async function updateHero(token, data) {
  const res = await fetch(`${API_BASE}/hero`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Update failed')
  }

  return res.json()
}

export async function uploadHeroImage(token, file) {
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`${API_BASE}/hero/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Upload failed')
  }

  return res.json()
}

export async function deleteHeroImage(token, path) {
  const res = await fetch(`${API_BASE}/hero/images`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ path }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Delete failed')
  }

  return res.json()
}
