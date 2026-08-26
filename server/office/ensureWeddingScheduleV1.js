/**
 * One-shot: Wedding project schedule + tasks (additive).
 * Confirmed dates only where specified. Periods use startDate/endDate, not fake day deadlines.
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

const MARKER = 'office-import-wedding-schedule-v1.json'
const PROJECT_ID = 'proj-wedding'

const GOAL =
  '결혼식, 식사, 모바일 청첩장, RSVP, 촬영, 디저트 케이터링 및 당일 운영을 일정에 맞춰 준비하고 각 업체 확정 시점을 놓치지 않도록 관리한다.'

/** Month period → first/last day (range only; date stays null unless confirmed) */
function monthRange(startYm, endYm = startYm) {
  const [sy, sm] = startYm.split('-').map(Number)
  const [ey, em] = endYm.split('-').map(Number)
  const startDate = `${sy}-${String(sm).padStart(2, '0')}-01`
  const end = new Date(ey, em, 0)
  const endDate = `${ey}-${String(em).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
  return { startDate, endDate, date: null }
}

const MILESTONES = [
  {
    title: '본식 스냅 작가 예약 완료',
    type: 'milestone',
    ...monthRange('2026-09', '2026-10'),
    status: 'upcoming',
    priority: 'high',
    isMilestone: true,
    category: 'wedding_phase_vendors',
    sortOrder: 120,
    description:
      '2027년 5월 15일 본식 촬영이 가능한 스냅 작가를 비교하고 원하는 작가의 해당 날짜를 확보한다.',
    notes: '목표 기간: 2026-09 ~ 2026-10 (확정 일자 미정)',
  },
  {
    title: '신혼여행 및 셀프웨딩촬영',
    type: 'event',
    date: '2026-12-18',
    startDate: '2026-12-18',
    endDate: '2026-12-22',
    status: 'upcoming',
    priority: 'high',
    isMilestone: true,
    category: 'wedding_phase_selfshoot',
    sortOrder: 230,
    description:
      '신혼여행 기간 중 셀프웨딩촬영을 진행한다. 촬영 장소, 의상, 소품, 장비 및 촬영 계획을 사전에 준비한다.',
  },
  {
    title: '모바일 청첩장 및 RSVP 오픈',
    type: 'milestone',
    ...monthRange('2027-03'),
    status: 'upcoming',
    priority: 'high',
    isMilestone: true,
    category: 'wedding_phase_invite',
    sortOrder: 340,
    description: '모바일 청첩장을 발송하고 RSVP 접수를 시작한다.',
    notes: '목표 기간: 2027-03 (확정 일자 미정)',
  },
  {
    title: 'RSVP 사실상 마감',
    type: 'deadline',
    date: '2027-04-10',
    status: 'upcoming',
    priority: 'urgent',
    isMilestone: true,
    category: 'wedding_phase_rsvp',
    sortOrder: 450,
    description:
      '도동산방 최종 인원 전달 전 참석 여부, 식사 여부 및 참석자 정보를 사실상 마감하고 미응답 하객에 대한 확인을 완료한다.',
  },
  {
    title: '도동산방 최종 인원 전달',
    type: 'deadline',
    date: '2027-04-15',
    status: 'upcoming',
    priority: 'urgent',
    isMilestone: true,
    category: 'wedding_phase_headcount',
    sortOrder: 560,
    description:
      '결혼식 한 달 전까지 도동산방에 최종 식사 인원을 전달한다. 1부/2부 인원 및 필요한 식사 운영 정보를 최종 확인한 뒤 전달한다.',
    notes: '한 달 전 최종 인원 전달 마감 · 확정일 2027-04-15',
  },
  {
    title: 'Wedding Day',
    type: 'event',
    date: '2027-05-15',
    status: 'upcoming',
    priority: 'urgent',
    isMilestone: true,
    category: 'wedding_phase_day',
    sortOrder: 800,
    description: '결혼식 본식.',
  },
]

/**
 * Tasks + linked schedule rows.
 * focusNow → surfaces in Today; deferred categories stay off Today until dated/near.
 */
const WORK_ITEMS = [
  {
    title: '본식 스냅 작가 찾기',
    agent: 'sales-cs',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_now',
    focusNow: true,
    ...monthRange('2026-08', '2026-09'),
    sortOrder: 10,
    description:
      '2027년 5월 15일 본식 촬영이 가능한 스냅 작가 후보를 찾고 촬영 스타일, 패키지, 촬영 시간, 보정 컷, 원본 제공 여부 및 가격을 비교한다.',
    notes: '관련 마일스톤: 본식 스냅 작가 예약 완료 · 목표 2026-08~09',
  },
  {
    title: '본식 스냅 작가 최종 예약',
    agent: 'operations',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_vendors',
    ...monthRange('2026-09', '2026-10'),
    sortOrder: 110,
    description:
      '선정한 스냅 작가와 날짜, 촬영 범위, 시간, 가격, 계약금 및 결과물 조건을 최종 확인하고 예약한다.',
    dependsOnTitles: ['본식 스냅 작가 찾기'],
  },
  {
    title: '본식 영상 촬영 여부 결정',
    agent: 'chief-of-staff',
    priority: 'medium',
    status: 'todo',
    category: 'wedding_phase_now',
    focusNow: true,
    ...monthRange('2026-09', '2026-10'),
    sortOrder: 20,
    description: '본식 영상 또는 스케치 영상 촬영을 별도로 진행할지 결정하고 필요 시 업체를 알아본다.',
  },
  {
    title: '디저트 케이터링 업체 찾기',
    agent: 'research',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_now',
    focusNow: true,
    ...monthRange('2026-09', '2026-10'),
    sortOrder: 30,
    description:
      '결혼식 현장에서 운영 가능한 디저트 케이터링 업체를 찾는다. 메뉴 구성, 최소 주문금액, 인원 기준, 세팅 포함 여부, 테이블 또는 장식 제공 여부, 배송 및 현장 운영 비용을 비교한다.',
  },
  {
    title: '디저트 케이터링 업체 후보 비교',
    agent: 'chief-of-staff',
    priority: 'medium',
    status: 'todo',
    category: 'wedding_phase_vendors',
    date: null,
    startDate: null,
    endDate: null,
    sortOrder: 130,
    description:
      '후보 업체의 메뉴, 가격, 최소 주문, 현장 세팅, 이동비, 서비스 범위를 비교하고 최종 후보를 선정한다.',
    dependsOnTitles: ['디저트 케이터링 업체 찾기'],
  },
  {
    title: '디저트 케이터링 예약 확정',
    agent: 'operations',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_vendors',
    ...monthRange('2026-10', '2026-11'),
    sortOrder: 140,
    description:
      '선정한 디저트 케이터링 업체의 날짜 가능 여부, 인원 기준, 메뉴, 비용, 계약금, 세팅 시간 및 현장 운영 조건을 최종 확인하고 예약한다.',
    dependsOnTitles: ['디저트 케이터링 업체 후보 비교'],
  },
  {
    title: '셀프웨딩촬영 장소 및 콘셉트 확정',
    agent: 'design-director',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_now',
    focusNow: true,
    ...monthRange('2026-10', '2026-11'),
    sortOrder: 40,
    description:
      '12월 18일부터 22일까지 진행할 셀프웨딩촬영의 장소, 분위기, 의상, 촬영 콘셉트 및 필요한 소품을 확정한다.',
    notes: '관련 일정: 신혼여행 및 셀프웨딩촬영',
  },
  {
    title: '셀프웨딩촬영 준비물 체크',
    agent: 'operations',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_selfshoot',
    date: '2026-12-10',
    sortOrder: 210,
    description:
      '촬영에 필요한 의상, 신발, 액세서리, 부케 또는 소품, 촬영 장비, 삼각대, 배터리 및 기타 준비물을 최종 확인한다.',
    dependsOnTitles: ['셀프웨딩촬영 장소 및 콘셉트 확정'],
  },
  {
    title: '셀프웨딩촬영 최종 준비',
    agent: 'operations',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_selfshoot',
    date: '2026-12-15',
    sortOrder: 220,
    description: '출발 전 촬영 의상, 소품, 장비와 촬영 계획을 최종 점검한다.',
  },
  {
    title: '셀프웨딩 사진 셀렉 및 보정',
    agent: 'design-director',
    priority: 'medium',
    status: 'todo',
    category: 'wedding_phase_invite',
    ...monthRange('2027-01'),
    sortOrder: 310,
    description: '12월 셀프웨딩촬영 결과에서 청첩장 및 개인 보관용 사진을 셀렉하고 필요한 보정을 진행한다.',
    dependsOnTitles: ['신혼여행 및 셀프웨딩촬영'],
  },
  {
    title: '모바일 청첩장용 사진 확정',
    agent: 'design-director',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_invite',
    ...monthRange('2027-01'),
    sortOrder: 320,
    description: '모바일 청첩장에 사용할 대표 사진과 섹션별 사진을 최종 확정한다.',
    dependsOnTitles: ['셀프웨딩 사진 셀렉 및 보정'],
  },
  {
    title: '모바일 청첩장 최종 제작',
    agent: 'web-developer',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_invite',
    ...monthRange('2027-01', '2027-02'),
    sortOrder: 330,
    description: '최종 사진, 문구, 장소, 일정 및 RSVP 정보를 반영하여 모바일 청첩장을 완성한다.',
    dependsOnTitles: ['모바일 청첩장용 사진 확정'],
  },
  {
    title: 'Wedding RSVP 최종 테스트',
    agent: 'web-developer',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_invite',
    ...monthRange('2027-02'),
    sortOrder: 335,
    description:
      '참석 여부, 참석자 이름, 식사 세션, 애프터 참석, 잔여석 표시 규칙 및 Wedding Admin 관리 기능을 최종 테스트한다.',
    dependsOnTitles: ['모바일 청첩장 최종 제작'],
  },
  {
    title: '하객 1차 리스트 정리',
    agent: 'operations',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_rsvp',
    ...monthRange('2027-02'),
    sortOrder: 410,
    description: '초대 대상과 예상 참석자를 정리하고 RSVP 발송 준비를 한다.',
  },
  {
    title: '모바일 청첩장 발송 및 RSVP 시작',
    agent: 'operations',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_rsvp',
    ...monthRange('2027-03'),
    sortOrder: 420,
    description: '모바일 청첩장을 발송하고 참석 여부, 식사 및 애프터 참석 정보를 수집하기 시작한다.',
    dependsOnTitles: ['Wedding RSVP 최종 테스트'],
  },
  {
    title: '미응답 하객 1차 확인',
    agent: 'sales-cs',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_rsvp',
    date: '2027-04-05',
    sortOrder: 430,
    description: 'RSVP 미응답 하객을 확인하고 참석 및 식사 여부를 확인한다.',
    dependsOnTitles: ['모바일 청첩장 발송 및 RSVP 시작'],
  },
  {
    title: 'RSVP 최종 마감',
    agent: 'operations',
    priority: 'urgent',
    status: 'todo',
    category: 'wedding_phase_rsvp',
    date: '2027-04-10',
    sortOrder: 440,
    description: '도동산방 최종 인원 전달을 위해 RSVP를 사실상 마감하고 남아 있는 미확정 참석자를 정리한다.',
    dependsOnTitles: ['미응답 하객 1차 확인'],
  },
  {
    title: '식사 인원 최종 검수',
    agent: 'operations',
    priority: 'urgent',
    status: 'todo',
    category: 'wedding_phase_headcount',
    date: null,
    startDate: '2027-04-11',
    endDate: '2027-04-14',
    sortOrder: 510,
    description:
      'RSVP 결과를 기준으로 총 식사 인원과 세션별 인원을 최종 검수한다. 중복, 누락, 동반 참석자 및 식사 미참석자를 확인한다.',
    dependsOnTitles: ['RSVP 최종 마감'],
  },
  {
    title: '도동산방 최종 인원 전달',
    agent: 'operations',
    priority: 'urgent',
    status: 'todo',
    category: 'wedding_phase_headcount',
    date: '2027-04-15',
    sortOrder: 520,
    description:
      '도동산방에 결혼식 식사 최종 인원을 전달한다. 결혼식 한 달 전까지 전달해야 하는 확정 마감 일정이다.',
    notes: '한 달 전 최종 인원 전달 마감',
    dependsOnTitles: ['식사 인원 최종 검수'],
    linkExistingMilestoneTitle: '도동산방 최종 인원 전달',
  },
  {
    title: '애프터 참석 인원 최종 확정',
    agent: 'operations',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_headcount',
    ...monthRange('2027-04'),
    sortOrder: 530,
    description: 'RSVP 기준으로 애프터 참석 인원을 최종 확정하고 필요한 예약 및 운영 정보를 정리한다.',
  },
  {
    title: '예식 전체 진행 순서 확정',
    agent: 'chief-of-staff',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_final',
    ...monthRange('2027-04'),
    sortOrder: 610,
    description: '예식 시작부터 식사 및 이후 일정까지 전체 타임테이블을 최종 확정한다.',
  },
  {
    title: '음악 및 음향 최종 확정',
    agent: 'operations',
    priority: 'medium',
    status: 'todo',
    category: 'wedding_phase_final',
    ...monthRange('2027-04'),
    sortOrder: 620,
    description: '입장, 식중 또는 기타 필요한 음악과 스피커·음향 사용 조건을 최종 정리한다.',
  },
  {
    title: '웨딩 업체 전체 최종 확인',
    agent: 'operations',
    priority: 'urgent',
    status: 'todo',
    category: 'wedding_phase_final',
    date: null,
    startDate: '2027-05-01',
    endDate: '2027-05-08',
    sortOrder: 630,
    description:
      '스냅, 디저트 케이터링, 식사, 공간, 플라워, 음향 및 기타 예약 업체의 날짜, 도착시간, 담당자, 비용 및 준비사항을 최종 확인한다.',
    dependsOnTitles: ['디저트 케이터링 예약 확정'],
  },
  {
    title: '본식 작가에게 최종 일정 및 동선 전달',
    agent: 'operations',
    priority: 'high',
    status: 'todo',
    category: 'wedding_phase_final',
    date: null,
    startDate: '2027-05-01',
    endDate: '2027-05-08',
    sortOrder: 640,
    description:
      '스냅 또는 영상 촬영 작가에게 최종 예식 시간, 장소, 가족 및 주요 촬영 장면, 식사 및 이동 동선을 전달한다.',
    dependsOnTitles: ['본식 스냅 작가 최종 예약'],
  },
  {
    title: '웨딩 당일 타임테이블 최종본 작성',
    agent: 'chief-of-staff',
    priority: 'urgent',
    status: 'todo',
    category: 'wedding_phase_final',
    date: '2027-05-08',
    sortOrder: 650,
    description: '예식, 촬영, 식사, 업체 도착 및 기타 운영 일정을 하나의 최종 타임테이블로 정리한다.',
    dependsOnTitles: ['예식 전체 진행 순서 확정'],
  },
  {
    title: '웨딩 준비물 최종 체크',
    agent: 'operations',
    priority: 'urgent',
    status: 'todo',
    category: 'wedding_phase_final',
    date: '2027-05-12',
    sortOrder: 660,
    description: '의상, 반지, 신발, 소품, 서류, 하객 관련 자료 및 기타 당일 준비물을 최종 점검한다.',
  },
]

const EXTRA_DEPS = [
  ['본식 작가에게 최종 일정 및 동선 전달', ['본식 스냅 작가 최종 예약']],
  ['Wedding Day', ['본식 작가에게 최종 일정 및 동선 전달', '웨딩 업체 전체 최종 확인', '도동산방 최종 인원 전달', '웨딩 당일 타임테이블 최종본 작성']],
  ['웨딩 업체 전체 최종 확인', ['디저트 케이터링 예약 확정']],
  ['셀프웨딩촬영 준비물 체크', ['셀프웨딩촬영 장소 및 콘셉트 확정']],
  ['신혼여행 및 셀프웨딩촬영', ['셀프웨딩촬영 준비물 체크']],
  ['셀프웨딩 사진 셀렉 및 보정', ['신혼여행 및 셀프웨딩촬영']],
  ['모바일 청첩장용 사진 확정', ['셀프웨딩 사진 셀렉 및 보정']],
  ['모바일 청첩장 최종 제작', ['모바일 청첩장용 사진 확정']],
  ['Wedding RSVP 최종 테스트', ['모바일 청첩장 최종 제작']],
  ['모바일 청첩장 발송 및 RSVP 시작', ['Wedding RSVP 최종 테스트']],
  ['미응답 하객 1차 확인', ['모바일 청첩장 발송 및 RSVP 시작']],
  ['RSVP 최종 마감', ['미응답 하객 1차 확인']],
  ['식사 인원 최종 검수', ['RSVP 최종 마감']],
  ['도동산방 최종 인원 전달', ['식사 인원 최종 검수']],
  ['웨딩 당일 타임테이블 최종본 작성', ['예식 전체 진행 순서 확정']],
  ['본식 스냅 작가 예약 완료', ['본식 스냅 작가 최종 예약']],
  ['모바일 청첩장 및 RSVP 오픈', ['모바일 청첩장 발송 및 RSVP 시작']],
  ['RSVP 사실상 마감', ['RSVP 최종 마감']],
]

function normTitle(t) {
  return String(t || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function findExistingTask(tasks, title) {
  const n = normTitle(title)
  return tasks.find((t) => t.projectId === PROJECT_ID && normTitle(t.title) === n)
}

function findExistingSchedule(schedule, title) {
  const n = normTitle(title)
  return schedule.find((s) => s.projectId === PROJECT_ID && normTitle(s.title) === n)
}

export async function ensureWeddingScheduleV1() {
  const markerPath = path.join(DATA_DIR, MARKER)
  try {
    await fs.access(markerPath)
    return { skipped: true, reason: 'already_imported' }
  } catch {
    // continue
  }

  const result = await importWeddingScheduleV1()
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(
    markerPath,
    `${JSON.stringify({ importedAt: new Date().toISOString(), ...result }, null, 2)}\n`,
    'utf8',
  )
  return { skipped: false, ...result }
}

export async function importWeddingScheduleV1() {
  try {
    await office.updateProject(PROJECT_ID, { currentGoal: GOAL })
  } catch {
    // project may be missing in empty envs
  }

  let tasks = await office.getTasks()
  let schedule = await getScheduleItems()

  const createdTasks = []
  const skippedTasks = []
  const createdMilestones = []
  const skippedMilestones = []
  const createdSchedule = []
  const skippedSchedule = []

  // —— Milestones ——
  for (const m of MILESTONES) {
    if (findExistingSchedule(schedule, m.title)) {
      skippedMilestones.push(m.title)
      continue
    }
    const [sch] = await createManyScheduleItems([
      {
        projectId: PROJECT_ID,
        title: m.title,
        description: m.description,
        type: m.type,
        date: m.date ?? null,
        startDate: m.startDate ?? null,
        endDate: m.endDate ?? null,
        status: m.status,
        priority: m.priority,
        isMilestone: true,
        category: m.category,
        sortOrder: m.sortOrder,
        notes: m.notes || '',
      },
    ])
    if (sch) {
      createdMilestones.push(m.title)
      createdSchedule.push(m.title)
      schedule = await getScheduleItems()
    }
  }

  // —— Tasks + schedule ——
  for (const item of WORK_ITEMS) {
    let task = findExistingTask(tasks, item.title)
    if (task) {
      skippedTasks.push(item.title)
    } else {
      task = await office.createTask({
        projectId: PROJECT_ID,
        assignedAgentId: item.agent,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.status,
        dueDate: item.date || null,
        mode: 'queue',
        force: true,
      })
      createdTasks.push(item.title)
      tasks = await office.getTasks()
    }

    // If milestone already covers this title (도동산방), link task only
    if (item.linkExistingMilestoneTitle) {
      const mile = findExistingSchedule(await getScheduleItems(), item.linkExistingMilestoneTitle)
      if (mile && task && !mile.relatedTaskId) {
        await updateScheduleItem(mile.id, { relatedTaskId: task.id })
        try {
          await office.updateTask(task.id, { scheduleId: mile.id, force: true })
        } catch {
          // ignore
        }
      }
      skippedSchedule.push(`${item.title} (마일스톤에 연결)`)
      continue
    }

    if (findExistingSchedule(await getScheduleItems(), item.title)) {
      skippedSchedule.push(item.title)
      continue
    }

    const [sch] = await createManyScheduleItems([
      {
        projectId: PROJECT_ID,
        title: item.title,
        description: item.description,
        type: 'task',
        date: item.date ?? null,
        startDate: item.startDate ?? null,
        endDate: item.endDate ?? null,
        status: 'upcoming',
        priority: item.priority,
        assignedAgentId: item.agent,
        relatedTaskId: task?.id || null,
        isMilestone: false,
        category: item.focusNow ? 'wedding_phase_now' : item.category,
        sortOrder: item.sortOrder,
        notes: item.notes || (item.focusNow ? '현재 우선 준비' : ''),
      },
    ])
    if (sch) {
      createdSchedule.push(sch.title)
      if (task) {
        try {
          await office.updateTask(task.id, {
            scheduleId: sch.id,
            dueDate: item.date || task.dueDate || null,
            force: true,
          })
        } catch {
          // ignore
        }
      }
    }
  }

  // —— Dependencies ——
  schedule = await getScheduleItems()
  const byTitle = new Map(
    schedule.filter((s) => s.projectId === PROJECT_ID).map((s) => [normTitle(s.title), s]),
  )

  const depPairs = [
    ...WORK_ITEMS.filter((w) => w.dependsOnTitles?.length).map((w) => [w.title, w.dependsOnTitles]),
    ...EXTRA_DEPS,
  ]

  const wired = []
  for (const [title, deps] of depPairs) {
    const item = byTitle.get(normTitle(title))
    if (!item) continue
    const dependsOn = deps.map((t) => byTitle.get(normTitle(t))?.id).filter(Boolean)
    if (!dependsOn.length) continue
    const merged = [...new Set([...(item.dependsOn || []), ...dependsOn])]
    await updateScheduleItem(item.id, { dependsOn: merged })
    wired.push({ title, dependsOn: deps })
  }

  return {
    createdTasks,
    skippedTasks: [...new Set(skippedTasks)],
    createdMilestones,
    skippedMilestones,
    createdSchedule: [...new Set(createdSchedule)],
    skippedSchedule: [...new Set(skippedSchedule)],
    dependencies: wired,
  }
}

const isDirect =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirect) {
  ensureWeddingScheduleV1()
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
