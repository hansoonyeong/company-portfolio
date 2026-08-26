/**
 * One-shot: Kimchi House AU 2026-08-26 meeting decisions → Tasks + Timeline.
 * Additive only. Skips duplicate titles. Never invents dates for undated work.
 * Phase 3 uses meeting date (current focus); Phase 4–5 stay undated.
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { DATA_DIR } from './jsonStore.js'
import * as office from './service.js'
import {
  createManyScheduleItems,
  getScheduleItems,
  updateScheduleItem,
} from './scheduleStore.js'

const MARKER = 'office-import-kimchi-meeting-20260826.json'
const PROJECT_ID = 'proj-kimchi'
const MEETING_DATE = '2026-08-26'

const PHASE_MILESTONES = [
  {
    title: '3차 집중',
    description: '2026-08-26 미팅 — 현재 집중 운영·마케팅 업무',
    category: 'kimchi_phase_3',
    date: MEETING_DATE,
    sortOrder: 10,
    priority: 'urgent',
  },
  {
    title: '4차 운영 체계 정비 및 광고 준비',
    description: '다음 단계 — Aged Care 분리, 광고, 안내 전환, 데이터·SMS 기반',
    category: 'kimchi_phase_4',
    date: null,
    sortOrder: 110,
    priority: 'high',
  },
  {
    title: '5차 외부 확장 및 데이터 분석',
    description: '중기 계획 — 외부 광고 확장과 데이터 분석',
    category: 'kimchi_phase_5',
    date: null,
    sortOrder: 210,
    priority: 'high',
  },
]

/** @type {Array<{phase:string, title:string, agent:string, priority:string, status:string, description:string, date:string|null, sortOrder:number, dependsOnTitles?:string[], parentTitle?:string}>} */
const WORK_ITEMS = [
  // Phase 3
  {
    phase: 'kimchi_phase_3',
    title: '발송 문제 해결',
    agent: 'operations',
    priority: 'urgent',
    status: 'in_progress',
    description:
      '현재 발생하고 있는 발송 관련 문제의 원인을 확인하고 고객 불편 및 컴플레인을 줄일 수 있도록 운영 문제를 해결한다.',
    date: MEETING_DATE,
    sortOrder: 20,
  },
  {
    phase: 'kimchi_phase_3',
    title: 'Aged Care 관련 별도 의견 정리 및 공유',
    agent: 'chief-of-staff',
    priority: 'high',
    status: 'todo',
    description:
      'Aged Care 고객 및 주문 운영과 관련한 별도 의견을 정리하여 내부 공유 및 다음 운영방향 결정에 활용한다.',
    date: MEETING_DATE,
    sortOrder: 21,
  },
  {
    phase: 'kimchi_phase_3',
    title: '콘텐츠 기획 및 촬영 소스 준비',
    agent: 'marketing',
    priority: 'high',
    status: 'todo',
    description:
      '향후 광고 및 채널 운영에 사용할 콘텐츠 방향을 기획하고 필요한 사진·영상 촬영 소스를 준비한다.',
    date: MEETING_DATE,
    sortOrder: 22,
  },
  {
    phase: 'kimchi_phase_3',
    title: '개인 카카오톡 소식 발송 중단 관련 의견 정리',
    agent: 'chief-of-staff',
    priority: 'high',
    status: 'todo',
    description:
      '개인 카카오톡을 통한 소식 발송을 중단하는 방향에 대해 운영상 장단점과 고객 영향 등을 정리한다.',
    date: MEETING_DATE,
    sortOrder: 23,
  },
  // Phase 4
  {
    phase: 'kimchi_phase_4',
    title: 'Aged Care 주문 별도 관리',
    agent: 'operations',
    priority: 'high',
    status: 'todo',
    description:
      '일반 고객 주문과 Aged Care 관련 주문을 구분하여 관리할 수 있는 운영 방식을 마련한다.',
    date: null,
    sortOrder: 120,
  },
  {
    phase: 'kimchi_phase_4',
    title: '콘텐츠 광고 진행',
    agent: 'marketing',
    priority: 'high',
    status: 'todo',
    description:
      '준비된 콘텐츠를 활용하여 광고 집행을 시작하고 채널별 성과 확인이 가능하도록 한다.',
    date: null,
    sortOrder: 121,
  },
  {
    phase: 'kimchi_phase_4',
    title: '개인 카카오톡 소식 발송 중단 경고 및 안내 준비',
    agent: 'copywriter',
    priority: 'high',
    status: 'todo',
    description:
      '개인 카카오톡 소식 발송 중단에 앞서 고객에게 전달할 경고 또는 사전 안내 내용을 준비한다.',
    date: null,
    sortOrder: 122,
    dependsOnTitles: ['개인 카카오톡 소식 발송 중단 관련 의견 정리'],
  },
  {
    phase: 'kimchi_phase_4',
    title: '데이터 분석 준비',
    agent: 'research',
    priority: 'medium',
    status: 'todo',
    description:
      '주문, 고객, 채널 및 광고 데이터를 향후 분석할 수 있도록 필요한 데이터 항목과 정리 방식을 준비한다.',
    date: null,
    sortOrder: 123,
  },
  {
    phase: 'kimchi_phase_4',
    title: 'Twilio 연동 준비',
    agent: 'web-developer',
    priority: 'high',
    status: 'todo',
    description: '향후 주문 고객 대상 SMS 안내가 가능하도록 Twilio 연동 구조를 준비한다.',
    date: null,
    sortOrder: 124,
  },
  {
    phase: 'kimchi_phase_4',
    title: '주문 고객 정보 업데이트 구조 준비',
    agent: 'web-developer',
    priority: 'high',
    status: 'todo',
    description: 'Twilio 연동 준비의 하위 업무 — 주문 고객 정보를 SMS 안내에 맞게 업데이트할 구조를 준비한다.',
    date: null,
    sortOrder: 125,
    dependsOnTitles: ['Twilio 연동 준비'],
    parentTitle: 'Twilio 연동 준비',
  },
  {
    phase: 'kimchi_phase_4',
    title: 'SMS 발송 기반 마련',
    agent: 'web-developer',
    priority: 'high',
    status: 'todo',
    description: 'Twilio 연동 준비의 하위 업무 — 주문 고객 대상 SMS 발송이 가능하도록 기반을 마련한다.',
    date: null,
    sortOrder: 126,
    dependsOnTitles: ['Twilio 연동 준비'],
    parentTitle: 'Twilio 연동 준비',
  },
  // Phase 5
  {
    phase: 'kimchi_phase_5',
    title: '외부 광고 활성화',
    agent: 'marketing',
    priority: 'high',
    status: 'todo',
    description: '내부 채널 중심 홍보에서 확장하여 외부 광고 채널을 본격적으로 활성화한다.',
    date: null,
    sortOrder: 220,
    dependsOnTitles: ['콘텐츠 광고 진행'],
  },
  {
    phase: 'kimchi_phase_5',
    title: '큰 이벤트용 채널 운영 및 활성화',
    agent: 'marketing',
    priority: 'medium',
    status: 'todo',
    description:
      '대규모 행사 또는 주요 프로모션에 활용할 수 있는 별도 채널 또는 운영 방식을 준비하고 활성화한다.',
    date: null,
    sortOrder: 221,
  },
  {
    phase: 'kimchi_phase_5',
    title: '데이터 분석 진행',
    agent: 'research',
    priority: 'high',
    status: 'todo',
    description: '앞 단계에서 준비한 주문·고객·광고 데이터를 바탕으로 실제 성과 분석을 진행한다.',
    date: null,
    sortOrder: 222,
    dependsOnTitles: ['데이터 분석 준비'],
  },
]

function normTitle(t) {
  return String(t || '')
    .trim()
    .toLowerCase()
}

export async function ensureKimchiMeeting20260826() {
  const markerPath = path.join(DATA_DIR, MARKER)
  try {
    await fs.access(markerPath)
    return { skipped: true, reason: 'already_imported' }
  } catch {
    // continue
  }

  const result = await importKimchiMeeting20260826()

  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(
    markerPath,
    `${JSON.stringify({ importedAt: new Date().toISOString(), ...result }, null, 2)}\n`,
    'utf8',
  )
  return { skipped: false, ...result }
}

export async function importKimchiMeeting20260826() {
  const tasks = await office.getTasks()
  const schedule = await getScheduleItems()
  const existingTaskTitles = new Set(
    tasks.filter((t) => t.projectId === PROJECT_ID).map((t) => normTitle(t.title)),
  )
  const existingScheduleTitles = new Set(
    schedule.filter((s) => s.projectId === PROJECT_ID).map((s) => normTitle(s.title)),
  )

  const createdTasks = []
  const skippedTasks = []
  const createdSchedule = []
  const skippedSchedule = []

  // —— Phase milestones ——
  const milestoneBodies = []
  for (const m of PHASE_MILESTONES) {
    if (existingScheduleTitles.has(normTitle(m.title))) {
      skippedSchedule.push(m.title)
      continue
    }
    milestoneBodies.push({
      projectId: PROJECT_ID,
      title: m.title,
      description: m.description,
      type: 'milestone',
      status: 'upcoming',
      priority: m.priority,
      isMilestone: true,
      category: m.category,
      date: m.date,
      sortOrder: m.sortOrder,
      notes: '2026-08-26 미팅 · 3차~5차 운영 및 마케팅 진행 계획',
    })
    existingScheduleTitles.add(normTitle(m.title))
  }
  if (milestoneBodies.length) {
    const made = await createManyScheduleItems(milestoneBodies)
    createdSchedule.push(...made.map((s) => s.title))
  }

  // —— Work items: task + schedule ——
  for (const item of WORK_ITEMS) {
    let task = tasks.find(
      (t) => t.projectId === PROJECT_ID && normTitle(t.title) === normTitle(item.title),
    )
    if (task) {
      skippedTasks.push(item.title)
    } else if (existingTaskTitles.has(normTitle(item.title))) {
      skippedTasks.push(item.title)
      task = tasks.find(
        (t) => t.projectId === PROJECT_ID && normTitle(t.title) === normTitle(item.title),
      )
    } else {
      const mode = item.status === 'in_progress' ? 'start' : 'queue'
      task = await office.createTask({
        projectId: PROJECT_ID,
        assignedAgentId: item.agent,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.status,
        dueDate: item.date,
        mode,
        force: true,
      })
      createdTasks.push(item.title)
      existingTaskTitles.add(normTitle(item.title))
      tasks.push(task)
    }

    if (existingScheduleTitles.has(normTitle(item.title))) {
      skippedSchedule.push(item.title)
      continue
    }

    const [sch] = await createManyScheduleItems([
      {
        projectId: PROJECT_ID,
        title: item.title,
        description: item.description,
        type: 'task',
        status:
          item.status === 'in_progress'
            ? 'in_progress'
            : item.status === 'done'
              ? 'completed'
              : 'upcoming',
        priority: item.priority,
        assignedAgentId: item.agent,
        relatedTaskId: task?.id || null,
        date: item.date,
        isMilestone: false,
        category: item.phase,
        sortOrder: item.sortOrder,
        notes: item.parentTitle
          ? `하위업무 · 상위: ${item.parentTitle}`
          : '2026-08-26 미팅 결정',
      },
    ])
    if (sch && task && !task.scheduleId) {
      try {
        await office.updateTask(task.id, { scheduleId: sch.id, force: true })
      } catch {
        // ignore
      }
    }
    if (sch) {
      createdSchedule.push(sch.title)
      existingScheduleTitles.add(normTitle(sch.title))
    }
  }

  // —— Wire dependsOn (phase chain + work deps) ——
  const all = await getScheduleItems()
  const byTitle = new Map(
    all.filter((s) => s.projectId === PROJECT_ID).map((s) => [normTitle(s.title), s]),
  )

  const depPairs = [
    ['4차 운영 체계 정비 및 광고 준비', ['3차 집중']],
    ['5차 외부 확장 및 데이터 분석', ['4차 운영 체계 정비 및 광고 준비']],
    ...WORK_ITEMS.filter((w) => w.dependsOnTitles?.length).map((w) => [w.title, w.dependsOnTitles]),
  ]

  for (const [title, deps] of depPairs) {
    const item = byTitle.get(normTitle(title))
    if (!item) continue
    const dependsOn = deps
      .map((t) => byTitle.get(normTitle(t))?.id)
      .filter(Boolean)
    if (!dependsOn.length) continue
    const merged = [...new Set([...(item.dependsOn || []), ...dependsOn])]
    await updateScheduleItem(item.id, { dependsOn: merged })
  }

  // Meeting note (skip if same title exists)
  const notes = await office.getNotes()
  const noteTitle = '2026-08-26 미팅 — 3차~5차 운영 및 마케팅 진행 계획'
  let noteCreated = false
  if (!notes.some((n) => n.projectId === PROJECT_ID && normTitle(n.title) === normTitle(noteTitle))) {
    await office.createNote({
      projectId: PROJECT_ID,
      title: noteTitle,
      content: [
        '미팅일: 2026-08-26',
        '',
        '타임라인:',
        '3차 집중',
        '↓',
        '4차 운영 체계 정비 및 광고 준비',
        '↓',
        '5차 외부 확장 및 데이터 분석',
        '',
        '3차는 현재 집중, 4차는 다음 단계, 5차는 중기 계획.',
        '날짜 미확정 업무는 Timeline의 날짜 미정으로 관리.',
      ].join('\n'),
    })
    noteCreated = true
  }

  return {
    createdTasks,
    skippedTasks: [...new Set(skippedTasks)],
    createdSchedule: [...new Set(createdSchedule)],
    skippedSchedule: [...new Set(skippedSchedule)],
    noteCreated,
    dependencies: depPairs.map(([title, deps]) => ({ title, dependsOn: deps })),
  }
}

/** CLI: node server/office/ensureKimchiMeeting20260826.js */
const isDirect =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirect) {
  ensureKimchiMeeting20260826()
    .then((r) => {
      console.log(JSON.stringify(r, null, 2))
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
