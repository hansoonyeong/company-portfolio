import { Router } from 'express'
import crypto from 'crypto'
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

  // —— Schedule ——
  router.get(
    '/schedule',
    wrap(async (_req, res) => {
      const { getScheduleItems } = await import('./scheduleStore.js')
      res.json(await getScheduleItems())
    }),
  )
  router.post(
    '/schedule',
    wrap(async (req, res) => {
      const { createScheduleItem } = await import('./scheduleStore.js')
      const item = await createScheduleItem(req.body ?? {})
      // Optional: create linked task
      if (req.body?.createTask) {
        const task = await office.createTask({
          projectId: item.projectId,
          assignedAgentId: item.assignedAgentId,
          title: item.title,
          description: item.description,
          dueDate: item.date || item.endDate,
          priority: item.priority,
          mode: 'queue',
          status: item.status === 'waiting' ? 'waiting' : 'todo',
          waitingFor: item.waitingFor,
          followUpDate: item.followUpDate,
          scheduleId: item.id,
        })
        const { updateScheduleItem } = await import('./scheduleStore.js')
        const linked = await updateScheduleItem(item.id, { relatedTaskId: task.id })
        res.status(201).json(linked)
        return
      }
      res.status(201).json(item)
    }),
  )
  router.put(
    '/schedule/:id',
    wrap(async (req, res) => {
      const { updateScheduleItem, getScheduleItem } = await import('./scheduleStore.js')
      const updated = await updateScheduleItem(req.params.id, req.body ?? {})
      if (updated.relatedTaskId && (req.body?.date !== undefined || req.body?.status !== undefined)) {
        const patch = {}
        if (req.body.date !== undefined) patch.dueDate = req.body.date
        if (req.body.status === 'completed') patch.status = 'done'
        if (req.body.status === 'waiting') {
          patch.status = 'waiting'
          if (req.body.waitingFor !== undefined) patch.waitingFor = req.body.waitingFor
        }
        if (req.body.followUpDate !== undefined) patch.followUpDate = req.body.followUpDate
        if (Object.keys(patch).length) {
          try {
            await office.updateTask(updated.relatedTaskId, { ...patch, force: true })
          } catch {
            // task may have been deleted
          }
        }
      }
      void getScheduleItem
      res.json(updated)
    }),
  )
  router.delete(
    '/schedule/:id',
    wrap(async (req, res) => {
      const { deleteScheduleItem } = await import('./scheduleStore.js')
      res.json(await deleteScheduleItem(req.params.id))
    }),
  )

  router.post(
    '/schedule/kimchi-round',
    wrap(async (req, res) => {
      const body = req.body ?? {}
      const projectId = body.projectId || 'proj-kimchi'
      const roundName = String(body.roundName || '').trim()
      if (!roundName) throw Object.assign(new Error('차수명이 필요합니다.'), { status: 400 })
      if (!body.orderOpenDate || !body.orderDeadline || !body.deliveryStartDate) {
        throw Object.assign(new Error('주문 시작일, 마감일, 배송 예정일이 필요합니다.'), {
          status: 400,
        })
      }

      const steps = Array.isArray(body.steps) ? body.steps : defaultKimchiSteps(body)
      const { createManyScheduleItems } = await import('./scheduleStore.js')
      const roundId = crypto.randomUUID()
      const created = await createManyScheduleItems(
        steps.map((step, index) => ({
          projectId,
          title: step.title,
          description: step.description || `${roundName} · ${step.title}`,
          type: step.type || 'task',
          date: step.date || null,
          status: step.status || 'upcoming',
          priority: step.priority || 'high',
          isMilestone: Boolean(step.isMilestone),
          category: 'order_round',
          roundId,
          roundName,
          sortOrder: index,
        })),
      )
      res.status(201).json({ roundId, roundName, items: created })
    }),
  )

  router.post(
    '/schedule/ensure-hangeul',
    wrap(async (_req, res) => {
      const { ensureHangeulSnackTimeline } = await import('./scheduleStore.js')
      const created = await ensureHangeulSnackTimeline('proj-hangeul')
      res.json({ created: created.length, items: created })
    }),
  )

  return router
}

function defaultKimchiSteps(body) {
  const open = body.orderOpenDate
  const deadline = body.orderDeadline
  const delivery = body.deliveryStartDate
  const announce = body.announcementDate || open
  return [
    { title: '상품/가격 최종 확인', date: open, type: 'task', isMilestone: false },
    { title: '고객 안내문 작성', date: announce, type: 'announcement' },
    { title: '안내문 검수', date: announce, type: 'task' },
    { title: '안내문 발송', date: announce, type: 'announcement', isMilestone: true },
    { title: '주문 접수', date: open, type: 'order_period', isMilestone: true },
    { title: '주문 마감', date: deadline, type: 'deadline', isMilestone: true },
    { title: '최종 주문 정리', date: deadline, type: 'task' },
    { title: '배송 준비', date: delivery, type: 'shipping' },
    { title: '배송 시작', date: delivery, type: 'delivery', isMilestone: true },
    { title: '고객 문의 대응', date: delivery, type: 'task' },
    { title: '차수 종료', date: body.deliveryEndDate || delivery, type: 'milestone', isMilestone: true },
  ]
}
