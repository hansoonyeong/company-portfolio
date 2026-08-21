import { Router } from 'express'
import * as office from './service.js'

import { createAiRouter, createConversationRoutes } from '../ai/routes.js'

function wrap(handler) {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (err) {
      const status = err.status || 500
      const payload = { error: err.message || 'Server error' }
      if (err.code) payload.code = err.code
      if (err.conflict) payload.conflict = err.conflict
      res.status(status).json(payload)
    }
  }
}

export function createOfficeRouter(authMiddleware) {
  const router = Router()
  router.use(authMiddleware)

  createConversationRoutes(router, wrap)
  router.use('/ai', createAiRouter())

  router.get(
    '/bundle',
    wrap(async (_req, res) => {
      res.json(await office.getOfficeBundle())
    }),
  )

  router.get(
    '/projects',
    wrap(async (_req, res) => {
      res.json(await office.getProjects())
    }),
  )
  router.post(
    '/projects',
    wrap(async (req, res) => {
      res.status(201).json(await office.createProject(req.body ?? {}))
    }),
  )
  router.put(
    '/projects/:id',
    wrap(async (req, res) => {
      res.json(await office.updateProject(req.params.id, req.body ?? {}))
    }),
  )
  router.delete(
    '/projects/:id',
    wrap(async (req, res) => {
      res.json(await office.deleteProject(req.params.id))
    }),
  )

  router.get(
    '/tasks',
    wrap(async (_req, res) => {
      res.json(await office.getTasks())
    }),
  )
  router.post(
    '/tasks',
    wrap(async (req, res) => {
      res.status(201).json(await office.createTask(req.body ?? {}))
    }),
  )
  router.put(
    '/tasks/:id',
    wrap(async (req, res) => {
      res.json(await office.updateTask(req.params.id, req.body ?? {}))
    }),
  )
  router.delete(
    '/tasks/:id',
    wrap(async (req, res) => {
      res.json(await office.deleteTask(req.params.id))
    }),
  )

  router.get(
    '/notes',
    wrap(async (_req, res) => {
      res.json(await office.getNotes())
    }),
  )
  router.post(
    '/notes',
    wrap(async (req, res) => {
      res.status(201).json(await office.createNote(req.body ?? {}))
    }),
  )
  router.put(
    '/notes/:id',
    wrap(async (req, res) => {
      res.json(await office.updateNote(req.params.id, req.body ?? {}))
    }),
  )
  router.delete(
    '/notes/:id',
    wrap(async (req, res) => {
      res.json(await office.deleteNote(req.params.id))
    }),
  )

  router.get(
    '/memory',
    wrap(async (_req, res) => {
      res.json(await office.getMemory())
    }),
  )
  router.post(
    '/memory',
    wrap(async (req, res) => {
      res.status(201).json(await office.createMemory(req.body ?? {}))
    }),
  )
  router.put(
    '/memory/:id',
    wrap(async (req, res) => {
      res.json(await office.updateMemory(req.params.id, req.body ?? {}))
    }),
  )
  router.delete(
    '/memory/:id',
    wrap(async (req, res) => {
      res.json(await office.deleteMemory(req.params.id))
    }),
  )

  router.get(
    '/agents',
    wrap(async (_req, res) => {
      res.json(await office.getAgents())
    }),
  )
  router.put(
    '/agents/:id',
    wrap(async (req, res) => {
      res.json(await office.updateAgent(req.params.id, req.body ?? {}))
    }),
  )

  router.get(
    '/activity',
    wrap(async (_req, res) => {
      res.json(await office.getActivity())
    }),
  )

  router.get(
    '/meetings',
    wrap(async (_req, res) => {
      res.json(await office.getMeetings())
    }),
  )
  router.post(
    '/meetings',
    wrap(async (req, res) => {
      res.status(201).json(await office.createMeeting(req.body ?? {}))
    }),
  )
  router.put(
    '/meetings/:id',
    wrap(async (req, res) => {
      res.json(await office.updateMeeting(req.params.id, req.body ?? {}))
    }),
  )

  return router
}
