import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  createOfficeMemory,
  createOfficeNote,
  createOfficeTask,
  deleteOfficeMemory,
  deleteOfficeNote,
  executeAiWork,
  updateOfficeProject,
  updateOfficeSchedule,
  updateOfficeTask,
} from '../../lib/officeApi'
import {
  AGENT_STATE_LABEL,
  MEMORY_CATEGORY_LABEL,
  PRIORITY_LABEL,
  PROJECT_STATUS_LABEL,
  TASK_STATUS_LABEL,
  useOfficeData,
} from '../OfficeDataContext'
import KimchiRoundModal from '../office/KimchiRoundModal'
import ScheduleAddModal from '../office/ScheduleAddModal'
import { buildProjectBrief, copyText } from '../office/briefBuilder'
import {
  SCHEDULE_STATUS_LABEL,
  SCHEDULE_TYPE_LABEL,
  formatKoreanDate,
  itemEffectiveDate,
} from '../office/scheduleUtils'
import TimelinePage from './TimelinePage'
import '../office/office.css'
import '../office/schedule.css'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'memory', label: 'Memory' },
  { id: 'notes', label: 'Notes' },
]

function isKimchiProject(project) {
  if (!project) return false
  return project.id === 'proj-kimchi' || /kimchi|김치/i.test(project.name || '')
}

export default function OfficeProjectPage() {
  const { id } = useParams()
  const { projects, tasks, notes, memory, agents, activity, schedule, refresh, loading, isManualMode } =
    useOfficeData()
  const [tab, setTab] = useState('overview')
  const [memoryFilter, setMemoryFilter] = useState('all')
  const [memoryQuery, setMemoryQuery] = useState('')
  const [roundOpen, setRoundOpen] = useState(false)
  const [addScheduleOpen, setAddScheduleOpen] = useState(false)

  const project = projects.find((p) => p.id === id)

  const projectTasks = useMemo(() => tasks.filter((t) => t.projectId === id), [tasks, id])
  const projectNotes = useMemo(() => notes.filter((n) => n.projectId === id), [notes, id])
  const projectMemory = useMemo(() => memory.filter((m) => m.projectId === id), [memory, id])
  const projectSchedule = useMemo(
    () =>
      (schedule || [])
        .filter((s) => s.projectId === id)
        .slice()
        .sort((a, b) => String(itemEffectiveDate(a) || '9999').localeCompare(String(itemEffectiveDate(b) || '9999'))),
    [schedule, id],
  )
  const projectActivity = useMemo(
    () => activity.filter((a) => a.projectId === id).slice(0, 12),
    [activity, id],
  )
  const assignedAgents = useMemo(
    () => agents.filter((a) => a.currentProjectId === id),
    [agents, id],
  )

  const importantMemory = projectMemory.filter((m) =>
    ['important', 'critical'].includes(m.importance),
  )

  const filteredMemory = projectMemory.filter((m) => {
    if (memoryFilter !== 'all' && m.category !== memoryFilter) return false
    if (memoryQuery.trim()) {
      const q = memoryQuery.toLowerCase()
      return (
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q)
      )
    }
    return true
  })

  const currentRound = useMemo(() => {
    const withRound = projectSchedule.filter((s) => s.roundId)
    if (!withRound.length) return null
    const latest = withRound.reduce((acc, item) => {
      if (!acc || String(item.createdAt) > String(acc.createdAt)) return item
      return acc
    }, null)
    return latest?.roundId
      ? {
          id: latest.roundId,
          name: latest.roundName,
          steps: withRound
            .filter((s) => s.roundId === latest.roundId)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
        }
      : null
  }, [projectSchedule])

  if (loading && !project) return <p>불러오는 중…</p>
  if (!project) {
    return (
      <div className="office-page">
        <p>프로젝트를 찾을 수 없습니다.</p>
        <Link to="/admin/projects">목록으로</Link>
      </div>
    )
  }

  return (
    <div className="office-page">
      <p className="office-page__eyebrow">프로젝트</p>
      <h2 className="office-page__title">{project.name}</h2>
      <p className="office-page__lead">{project.description}</p>
      <p>
        <span className="office-badge">{PROJECT_STATUS_LABEL[project.status] || project.status}</span>
        {' · '}
        목표: {project.currentGoal || '—'}
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button
          type="button"
          className="office-btn"
          onClick={async () => {
            const text = buildProjectBrief({
              project,
              memory: projectMemory,
              tasks: projectTasks,
              notes: projectNotes,
            })
            const ok = await copyText(text)
            if (!ok) window.prompt('Copy Project Brief:', text)
            else window.alert('Project brief copied')
          }}
        >
          Copy Project Brief
        </button>
        {isKimchiProject(project) ? (
          <button type="button" className="office-btn office-btn--primary" onClick={() => setRoundOpen(true)}>
            새 차수 만들기
          </button>
        ) : null}
      </div>

      <div className="office-topbar__switch" style={{ margin: '18px 0', display: 'inline-flex', flexWrap: 'wrap' }}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`office-topbar__switch-btn${tab === item.id ? ' is-active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="office-card-grid">
          <section className="office-card">
            <h3>작업 현황</h3>
            <p>
              열림 {projectTasks.filter((t) => t.status !== 'done').length} · 진행{' '}
              {projectTasks.filter((t) => t.status === 'in_progress').length} · 대기{' '}
              {projectTasks.filter((t) => t.status === 'waiting').length}
            </p>
          </section>
          <section className="office-card">
            <h3>일정</h3>
            <p>활성 일정 {projectSchedule.filter((s) => s.status !== 'completed').length}건</p>
            <button type="button" className="office-btn" onClick={() => setTab('schedule')}>
              Schedule 보기
            </button>
          </section>
          {isKimchiProject(project) && currentRound ? (
            <section className="office-card">
              <h3>현재 차수</h3>
              <p>{currentRound.name}</p>
              <ol className="sch-round-steps">
                {currentRound.steps.map((step) => (
                  <li key={step.id}>
                    <span>
                      {step.title} · {SCHEDULE_STATUS_LABEL[step.status] || step.status}
                    </span>
                    <span>{itemEffectiveDate(step) || '미정'}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          <section className="office-card">
            <h3>배정된 AI</h3>
            {assignedAgents.length === 0 ? (
              <p>없음</p>
            ) : (
              <ul>
                {assignedAgents.map((a) => (
                  <li key={a.id}>
                    {a.name} · {AGENT_STATE_LABEL[a.state] || a.state}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="office-card">
            <h3>중요 정보</h3>
            {importantMemory.length === 0 ? (
              <p>중요/긴급 메모리 없음</p>
            ) : (
              <ul>
                {importantMemory.slice(0, 5).map((m) => (
                  <li key={m.id}>
                    <strong>{m.title}</strong> — {m.content.slice(0, 80)}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="office-card">
            <h3>최근 노트</h3>
            {projectNotes.length === 0 ? (
              <p>없음</p>
            ) : (
              <ul>
                {projectNotes.slice(0, 5).map((n) => (
                  <li key={n.id}>{n.title}</li>
                ))}
              </ul>
            )}
          </section>
          <section className="office-card">
            <h3>최근 활동</h3>
            <ul>
              {projectActivity.map((a) => (
                <li key={a.id}>{a.message}</li>
              ))}
            </ul>
          </section>
          <section className="office-card">
            <h3>목표 수정</h3>
            <GoalEditor project={project} onSaved={refresh} />
          </section>
        </div>
      )}

      {tab === 'tasks' && (
        <ProjectTasksTab
          projectId={id}
          tasks={projectTasks}
          agents={agents}
          onChanged={refresh}
          isManualMode={isManualMode}
        />
      )}

      {tab === 'schedule' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              className="office-btn office-btn--primary"
              onClick={() => setAddScheduleOpen(true)}
            >
              + 일정 추가
            </button>
            {isKimchiProject(project) ? (
              <button type="button" className="office-btn" onClick={() => setRoundOpen(true)}>
                새 차수 만들기
              </button>
            ) : null}
          </div>
          {projectSchedule.length === 0 ? <p className="sch-empty">일정 없음</p> : null}
          {projectSchedule.map((item) => (
            <article key={item.id} className="sch-row">
              <div className="sch-row__main">
                <strong className="sch-row__title">{item.title}</strong>
                <div className="sch-row__meta">
                  <span>
                    {itemEffectiveDate(item)
                      ? formatKoreanDate(itemEffectiveDate(item))
                      : '날짜 미정'}
                  </span>
                  <span>{SCHEDULE_TYPE_LABEL[item.type] || item.type}</span>
                  <span>{SCHEDULE_STATUS_LABEL[item.status] || item.status}</span>
                  {item.roundName ? <span>{item.roundName}</span> : null}
                </div>
              </div>
              <div className="sch-row__actions">
                {item.status !== 'completed' ? (
                  <button
                    type="button"
                    className="office-btn"
                    onClick={async () => {
                      await updateOfficeSchedule(item.id, { status: 'completed' })
                      await refresh()
                    }}
                  >
                    완료
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'timeline' && <TimelinePage lockedProjectId={id} />}

      {tab === 'notes' && (
        <ProjectNotesTab projectId={id} notes={projectNotes} onChanged={refresh} />
      )}
      {tab === 'memory' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <select value={memoryFilter} onChange={(e) => setMemoryFilter(e.target.value)}>
              <option value="all">전체 카테고리</option>
              {Object.entries(MEMORY_CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              value={memoryQuery}
              onChange={(e) => setMemoryQuery(e.target.value)}
              placeholder="메모리 검색"
            />
          </div>
          <ProjectMemoryTab
            projectId={id}
            memory={filteredMemory}
            onChanged={refresh}
          />
        </div>
      )}

      {roundOpen ? (
        <KimchiRoundModal
          projectId={id}
          onClose={() => setRoundOpen(false)}
          onSaved={refresh}
        />
      ) : null}
      {addScheduleOpen ? (
        <ScheduleAddModal
          onClose={() => setAddScheduleOpen(false)}
          onSaved={refresh}
          initialProjectId={id}
        />
      ) : null}
    </div>
  )
}

function GoalEditor({ project, onSaved }) {
  const [goal, setGoal] = useState(project.currentGoal || '')
  const [saving, setSaving] = useState(false)
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        await updateOfficeProject(project.id, { currentGoal: goal })
        await onSaved()
        setSaving(false)
      }}
    >
      <input value={goal} onChange={(e) => setGoal(e.target.value)} style={{ width: '100%' }} />
      <button type="submit" className="office-btn" style={{ marginTop: 8 }} disabled={saving}>
        저장
      </button>
    </form>
  )
}

function ProjectTasksTab({ projectId, tasks, agents, onChanged, isManualMode }) {
  const [form, setForm] = useState({
    title: '',
    assignedAgentId: '',
    priority: 'medium',
    mode: 'queue',
  })
  const [runningId, setRunningId] = useState('')

  return (
    <div>
      <form
        className="office-card"
        style={{ marginBottom: 14 }}
        onSubmit={async (e) => {
          e.preventDefault()
          await createOfficeTask({
            ...form,
            projectId,
            assignedAgentId: form.assignedAgentId || null,
          })
          setForm({ title: '', assignedAgentId: '', priority: 'medium', mode: 'queue' })
          await onChanged()
        }}
      >
        <h3>작업 추가</h3>
        <div className="office-form" style={{ marginTop: 10 }}>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="작업 제목"
            required
          />
          <select
            value={form.assignedAgentId}
            onChange={(e) => setForm((f) => ({ ...f, assignedAgentId: e.target.value }))}
          >
            <option value="">에이전트 없음</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          >
            {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}>
            <option value="queue">대기열</option>
            <option value="start">바로 시작</option>
          </select>
          <button type="submit" className="office-btn office-btn--primary">
            추가
          </button>
        </div>
      </form>

      <div className="office-list">
        {tasks.map((task) => (
          <div key={task.id} className="office-list__row">
            <strong>{task.title}</strong>
            <span>{TASK_STATUS_LABEL[task.status] || task.status}</span>
            <span>{PRIORITY_LABEL[task.priority] || task.priority}</span>
            <span>{agents.find((a) => a.id === task.assignedAgentId)?.name || '—'}</span>
            <select
              value={task.status}
              onChange={async (e) => {
                try {
                  await updateOfficeTask(task.id, { status: e.target.value })
                  await onChanged()
                } catch (err) {
                  window.alert(err.message)
                }
              }}
            >
              {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {task.assignedAgentId &&
            (task.status === 'todo' || task.status === 'waiting' || task.status === 'inbox') ? (
              <button
                type="button"
                className="office-btn office-btn--primary"
                disabled={runningId === task.id}
                onClick={async () => {
                  setRunningId(task.id)
                  try {
                    if (isManualMode) {
                      await updateOfficeTask(task.id, {
                        status: 'in_progress',
                        force: true,
                        errorMessage: null,
                        aiGenerated: false,
                      })
                    } else {
                      await executeAiWork({
                        projectId,
                        agentId: task.assignedAgentId,
                        taskId: task.id,
                        message: task.description || task.title,
                      })
                    }
                    await onChanged()
                  } catch (err) {
                    if (err.code === 'MANUAL_MODE') {
                      await updateOfficeTask(task.id, {
                        status: 'in_progress',
                        force: true,
                        errorMessage: null,
                      })
                      await onChanged()
                    } else {
                      window.alert(err.message)
                      await onChanged()
                    }
                  } finally {
                    setRunningId('')
                  }
                }}
              >
                {runningId === task.id
                  ? '실행 중…'
                  : isManualMode
                    ? 'Start Work'
                    : task.status === 'waiting'
                      ? 'Retry'
                      : 'Start AI Task'}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProjectNotesTab({ projectId, notes, onChanged }) {
  const [form, setForm] = useState({ title: '', content: '' })
  return (
    <div>
      <form
        className="office-card"
        style={{ marginBottom: 14 }}
        onSubmit={async (e) => {
          e.preventDefault()
          await createOfficeNote({ ...form, projectId })
          setForm({ title: '', content: '' })
          await onChanged()
        }}
      >
        <h3>노트 추가</h3>
        <div className="office-form" style={{ marginTop: 10 }}>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="제목"
            required
          />
          <textarea
            rows={4}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="내용"
          />
          <button type="submit" className="office-btn office-btn--primary">
            저장
          </button>
        </div>
      </form>
      {notes.map((note) => (
        <div key={note.id} className="office-card" style={{ marginBottom: 10 }}>
          <h3>{note.title}</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
          <button
            type="button"
            className="office-btn"
            onClick={async () => {
              if (!window.confirm('노트를 삭제할까요?')) return
              await deleteOfficeNote(note.id)
              await onChanged()
            }}
          >
            삭제
          </button>
        </div>
      ))}
    </div>
  )
}

function ProjectMemoryTab({ projectId, memory, onChanged }) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'business_info',
    importance: 'normal',
  })

  return (
    <div>
      <form
        className="office-card"
        style={{ marginBottom: 14 }}
        onSubmit={async (e) => {
          e.preventDefault()
          await createOfficeMemory({ ...form, projectId })
          setForm({ title: '', content: '', category: 'business_info', importance: 'normal' })
          await onChanged()
        }}
      >
        <h3>메모리 추가</h3>
        <div className="office-form" style={{ marginTop: 10 }}>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="제목"
            required
          />
          <textarea
            rows={3}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="내용"
            required
          />
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {Object.entries(MEMORY_CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={form.importance}
            onChange={(e) => setForm((f) => ({ ...f, importance: e.target.value }))}
          >
            <option value="normal">보통</option>
            <option value="important">중요</option>
            <option value="critical">긴급</option>
          </select>
          <button type="submit" className="office-btn office-btn--primary">
            추가
          </button>
        </div>
      </form>

      {memory.map((item) => (
        <div key={item.id} className="office-card" style={{ marginBottom: 10 }}>
          <p className="office-badge">{MEMORY_CATEGORY_LABEL[item.category] || item.category}</p>
          <h3>{item.title}</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
          <p>중요도: {item.importance}</p>
          <button
            type="button"
            className="office-btn"
            onClick={async () => {
              if (!window.confirm('메모리를 삭제할까요?')) return
              await deleteOfficeMemory(item.id)
              await onChanged()
            }}
          >
            삭제
          </button>
        </div>
      ))}
    </div>
  )
}
