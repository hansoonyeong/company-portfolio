import express from 'express'
import crypto from 'crypto'
import { weddingConfig } from '../../src/wedding/config/weddingConfig.js'
import { getAdminSessionStats, getPublicSessionStatus, countAfterPartyGuests } from './capacity.js'
import { readRsvps, findRsvpByToken } from './store.js'
import {
  adminCreateRsvp,
  adminMoveGuestMeal,
  adminUpdateRsvp,
  createRsvp,
  sanitizeRsvpForGuest,
  updateRsvp,
} from './service.js'

const WEDDING_ADMIN_PASSWORD = process.env.WEDDING_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'soono2026'
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8
const weddingSessions = new Map()

function createToken() {
  return crypto.randomBytes(32).toString('hex')
}

function weddingAuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const session = weddingSessions.get(token)
  if (!session || Date.now() > session.expiresAt) {
    weddingSessions.delete(token)
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

function escapeCsv(value) {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

function guestNames(rsvp) {
  return (rsvp.guests || [])
    .filter((g) => !g.isPrimary)
    .map((g) => (g.unknownName || !g.name ? '미입력' : g.name))
    .join('; ')
}

function afterPartyNames(rsvp) {
  return (rsvp.guests || [])
    .filter((g) => g.afterPartyAttending)
    .map((g) => g.name || '미입력')
    .join('; ')
}

export function createWeddingRouter() {
  const router = express.Router()

  router.get('/sessions', async (_req, res) => {
    try {
      const rsvps = await readRsvps()
      const excludeToken = _req.query.excludeToken
      let excludeId = null
      if (excludeToken) {
        const existing = await findRsvpByToken(String(excludeToken))
        excludeId = existing?.id ?? null
      }

      const sessions = weddingConfig.meal.sessions.map((session) => ({
        id: session.id,
        label: session.label,
        start: session.start,
        end: session.end,
        ...getPublicSessionStatus(rsvps, session.id, excludeId),
      }))
      res.json({ sessions })
    } catch (err) {
      res.status(500).json({ error: 'Failed to load sessions' })
    }
  })

  router.post('/rsvp', async (req, res) => {
    try {
      const rsvp = await createRsvp(req.body ?? {})
      res.status(201).json(sanitizeRsvpForGuest(rsvp))
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to save RSVP' })
    }
  })

  router.get('/rsvp/:token', async (req, res) => {
    try {
      const rsvp = await findRsvpByToken(req.params.token)
      if (!rsvp) return res.status(404).json({ error: 'Not found' })
      res.json(sanitizeRsvpForGuest(rsvp))
    } catch (err) {
      res.status(500).json({ error: 'Failed to load RSVP' })
    }
  })

  router.patch('/rsvp/:token', async (req, res) => {
    try {
      const rsvp = await updateRsvp(req.params.token, req.body ?? {})
      res.json(sanitizeRsvpForGuest(rsvp))
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to update RSVP' })
    }
  })

  router.post('/admin/login', (req, res) => {
    const { password } = req.body ?? {}
    if (password !== WEDDING_ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' })
    }
    const token = createToken()
    weddingSessions.set(token, { expiresAt: Date.now() + TOKEN_TTL_MS })
    res.json({ token })
  })

  router.get('/admin/stats', weddingAuthMiddleware, async (_req, res) => {
    try {
      const rsvps = await readRsvps()
      const attending = rsvps.filter((r) => r.attending)
      const declined = rsvps.filter((r) => !r.attending)
      const totalGuests = attending.reduce((sum, r) => sum + (r.guestCount || 0), 0)

      res.json({
        totalRsvps: rsvps.length,
        totalGuests,
        declinedCount: declined.length,
        sessionStats: getAdminSessionStats(rsvps),
        afterPartyCount: countAfterPartyGuests(rsvps),
      })
    } catch (err) {
      res.status(500).json({ error: 'Failed to load stats' })
    }
  })

  router.get('/admin/rsvps', weddingAuthMiddleware, async (req, res) => {
    try {
      let rsvps = await readRsvps()
      const q = (req.query.q || '').trim().toLowerCase()
      const filter = req.query.filter

      if (q) {
        rsvps = rsvps.filter((r) => {
          const names = (r.guests || []).map((g) => (g.name || '').toLowerCase())
          return (
            r.primaryGuestName.toLowerCase().includes(q) ||
            names.some((n) => n.includes(q))
          )
        })
      }

      if (filter === 'attending') rsvps = rsvps.filter((r) => r.attending)
      if (filter === 'declined') rsvps = rsvps.filter((r) => !r.attending)
      if (filter === 'session1') {
        rsvps = rsvps.filter((r) =>
          (r.guests || []).some((g) => (g.mealSession || r.mealSession) === 'session1'),
        )
      }
      if (filter === 'session2') {
        rsvps = rsvps.filter((r) =>
          (r.guests || []).some((g) => (g.mealSession || r.mealSession) === 'session2'),
        )
      }
      if (filter === 'afterparty') {
        rsvps = rsvps.filter((r) => (r.guests || []).some((g) => g.afterPartyAttending))
      }

      res.json(rsvps)
    } catch (err) {
      res.status(500).json({ error: 'Failed to load RSVPs' })
    }
  })

  router.post('/admin/rsvps', weddingAuthMiddleware, async (req, res) => {
    try {
      const rsvp = await adminCreateRsvp(req.body ?? {})
      res.status(201).json(rsvp)
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to create RSVP' })
    }
  })

  router.patch('/admin/guests/:guestId/meal', weddingAuthMiddleware, async (req, res) => {
    try {
      const rsvp = await adminMoveGuestMeal(req.params.guestId, req.body?.mealSession)
      res.json(rsvp)
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to move guest' })
    }
  })

  router.patch('/admin/rsvps/:id', weddingAuthMiddleware, async (req, res) => {
    try {
      const rsvp = await adminUpdateRsvp(req.params.id, req.body ?? {})
      res.json(rsvp)
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to update RSVP' })
    }
  })

  router.get('/admin/export.csv', weddingAuthMiddleware, async (_req, res) => {
    try {
      const rsvps = await readRsvps()
      const header = [
        '대표 예약자',
        '참석 여부',
        '총 인원',
        '동반인',
        '식사 타임',
        '식사 인원',
        '애프터 참석자',
        '등록일',
        '수정일',
        'editToken',
      ]
      const rows = rsvps.map((r) => [
        r.primaryGuestName,
        r.attending ? '참석' : '불참',
        r.guestCount,
        guestNames(r),
        r.mealSession || '',
        r.mealGuestCount || 0,
        afterPartyNames(r),
        r.createdAt,
        r.updatedAt,
        r.editToken,
      ])

      const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
      const bom = '\uFEFF'
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="wedding-rsvps.csv"')
      res.send(bom + csv)
    } catch (err) {
      res.status(500).json({ error: 'Export failed' })
    }
  })

  return router
}
