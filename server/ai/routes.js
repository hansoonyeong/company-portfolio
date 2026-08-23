import { Router } from 'express'
import { getProviderStatus, isOpenAiConfigured } from './config.js'
import { routeAgent, routeLocally } from './router.js'
import {
  executeAiWork,
  generateMeetingContributions,
  generateMeetingSummary,
} from './executor.js'
import * as office from '../office/service.js'

function wrap(handler) {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (err) {
      const status = err.status || 500
      const payload = { error: err.message || 'Server error' }
      if (err.code) payload.code = err.code
      if (err.conflict) payload.conflict = err.conflict
      if (err.taskId) payload.taskId = err.taskId
      if (err.agentId) payload.agentId = err.agentId
      if (err.conversationId) payload.conversationId = err.conversationId
      res.status(status).json(payload)
    }
  }
}

export function createAiRouter() {
  const router = Router()

  router.get(
    '/status',
    wrap(async (_req, res) => {
      res.json(getProviderStatus())
    }),
  )

  router.post(
    '/route',
    wrap(async (req, res) => {
      const message = String(req.body?.message || '').trim()
      if (!message) {
        res.status(400).json({ error: '메시지가 필요합니다.' })
        return
      }
      // Manual Mode: local keyword routing only (no paid LLM routing)
      const allowLlm = isOpenAiConfigured() && req.body?.allowLlm !== false
      if (!allowLlm) {
        res.json({ ...routeLocally(message), source: 'local' })
        return
      }
      res.json(await routeAgent(message, { allowLlm: true }))
    }),
  )

  router.post(
    '/execute',
    wrap(async (req, res) => {
      if (!isOpenAiConfigured()) {
        res.status(503).json({
          error: 'AI generation is off. Use Manual Mode to assign and complete work.',
          code: 'MANUAL_MODE',
          mode: 'manual',
        })
        return
      }
      const result = await executeAiWork(req.body ?? {})
      res.json(result)
    }),
  )

  router.post(
    '/meetings/:id/contributions',
    wrap(async (req, res) => {
      if (!isOpenAiConfigured()) {
        res.status(503).json({
          error: 'AI generation is off. Use Manual Meeting notes instead.',
          code: 'MANUAL_MODE',
        })
        return
      }
      const meeting = await generateMeetingContributions(req.params.id)
      res.json(meeting)
    }),
  )

  router.post(
    '/meetings/:id/summary',
    wrap(async (req, res) => {
      if (!isOpenAiConfigured()) {
        res.status(503).json({
          error: 'AI generation is off. Write a manual summary instead.',
          code: 'MANUAL_MODE',
        })
        return
      }
      const meeting = await generateMeetingSummary(req.params.id)
      res.json(meeting)
    }),
  )

  return router
}

export function createConversationRoutes(router, wrapFn) {
  router.get(
    '/conversations',
    wrapFn(async (_req, res) => {
      res.json(await office.getConversations())
    }),
  )
  router.post(
    '/conversations',
    wrapFn(async (req, res) => {
      res.status(201).json(await office.createConversation(req.body ?? {}))
    }),
  )
  router.put(
    '/conversations/:id',
    wrapFn(async (req, res) => {
      res.json(await office.updateConversation(req.params.id, req.body ?? {}))
    }),
  )
  router.delete(
    '/conversations/:id',
    wrapFn(async (req, res) => {
      res.json(await office.deleteConversation(req.params.id))
    }),
  )
}
