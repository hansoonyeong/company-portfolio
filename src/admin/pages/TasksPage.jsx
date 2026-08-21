import { useMemo, useState } from 'react'
import {
  createOfficeTask,
  deleteOfficeTask,
  executeAiWork,
  updateOfficeTask,
} from '../../lib/officeApi'
import {
  PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  useOfficeData,
} from '../OfficeDataContext'
import AiResultModal from '../office/AiResultModal'
import '../office/office.css'

export default function TasksPage() {
  const { tasks, projects, agents, refresh, loading, error } = useOfficeData()
  const [projectFilter, setProjectFilter] = useState('all')
  const [agentFilter, setAgentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [aiOnly, setAiOnly] = useState(false)
  const [resultTaskId, setResultTaskId] = useState(null)
  const [runningId, setRunningId] = useState('')
  const [form, setForm] = useState({
    title: '',
    projectId: '',
    assignedAgentId: '',
    priority: 'medium',
    dueDate: '',
    mode: 'queue',
  })

  const filtered = useMemo(
    () =>
      tasks.filter((task) => {
        if (projectFilter !== 'all' && task.projectId !== projectFilter) return false
        if (agentFilter !== 'all' && task.assignedAgentId !== agentFilter) return false
        if (statusFilter !== 'all' && task.status !== statusFilter) return false
        if (aiOnly && !task.aiGenerated) return false
        return true
      }),
    [tasks, projectFilter, agentFilter, statusFilter, aiOnly],
  )

  async function startAi(task) {
    setRunningId(task.id)
    try {
      const result = await executeAiWork({
        projectId: task.projectId,
        agentId: task.assignedAgentId || 'auto',
        taskId: task.id,
        message: task.description || task.title,
        conversationId: task.conversationId || null,
      })
      await refresh()
      setResultTaskId(result.taskId)
    } catch (err) {
      await refresh()
      window.alert(err.message)
      if (err.taskId) setResultTaskId(err.taskId)
    } finally {
      setRunningId('')
    }
  }

  return (
    <div className="office-page">
      <p className="office-page__eyebrow">워크스페이스</p>
      <h2 className="office-page__title">작업</h2>
      <p className="office-page__lead">프로젝트 · 에이전트 · 상태별로 필터링할 수 있습니다.</p>
      {error ? <p style={{ color: '#8b3a3a' }}>{error}</p> : null}
      {loading ? <p>불러오는 중…</p> : null}

      <form
        className="office-card"
        style={{ marginBottom: 16 }}
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await createOfficeTask({
              ...form,
              projectId: form.projectId || null,
              assignedAgentId: form.assignedAgentId || null,
              dueDate: form.dueDate || null,
            })
            setForm({
              title: '',
              projectId: '',
              assignedAgentId: '',
              priority: 'medium',
              dueDate: '',
              mode: 'queue',
            })
            await refresh()
          } catch (err) {
            window.alert(err.message)
          }
        }}
      >
        <h3>작업 만들기</h3>
        <div className="office-form" style={{ marginTop: 10 }}>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="제목"
            required
          />
          <select
            value={form.projectId}
            onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
          >
            <option value="">프로젝트 없음</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
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
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          />
          <select value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}>
            <option value="queue">대기열에 추가</option>
            <option value="start">바로 시작</option>
          </select>
          <button type="submit" className="office-btn office-btn--primary">
            추가
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="all">전체 프로젝트</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
          <option value="all">전체 에이전트</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">전체 상태</option>
          {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="office-check">
          <input type="checkbox" checked={aiOnly} onChange={(e) => setAiOnly(e.target.checked)} />
          <span>Completed by AI</span>
        </label>
      </div>

      <div className="office-list">
        <div className="office-list__row office-list__head">
          <span>작업</span>
          <span>프로젝트</span>
          <span>에이전트</span>
          <span>상태</span>
          <span>액션</span>
        </div>
        {filtered.map((task) => (
          <div key={task.id} className="office-list__row">
            <div>
              <strong>{task.title}</strong>
              <div style={{ color: '#888', fontSize: 12 }}>
                {PRIORITY_LABEL[task.priority]}
                {task.dueDate ? ` · ~${task.dueDate}` : ''}
                {task.aiGenerated ? ' · AI generated' : ''}
              </div>
            </div>
            <span>{projects.find((p) => p.id === task.projectId)?.name || '—'}</span>
            <span>{agents.find((a) => a.id === task.assignedAgentId)?.name || '—'}</span>
            <select
              value={task.status}
              onChange={async (e) => {
                try {
                  await updateOfficeTask(task.id, { status: e.target.value })
                  await refresh()
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
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {task.assignedAgentId && (task.status === 'todo' || task.status === 'inbox') ? (
                <button
                  type="button"
                  className="office-btn office-btn--primary"
                  disabled={runningId === task.id}
                  onClick={() => startAi(task)}
                >
                  {runningId === task.id ? '실행 중…' : 'Start AI Task'}
                </button>
              ) : null}
              {task.status === 'waiting' && task.errorMessage ? (
                <button
                  type="button"
                  className="office-btn"
                  disabled={runningId === task.id}
                  onClick={() => startAi(task)}
                >
                  Retry
                </button>
              ) : null}
              {(task.result || task.aiGenerated) && (
                <button type="button" className="office-btn" onClick={() => setResultTaskId(task.id)}>
                  결과
                </button>
              )}
              <button
                type="button"
                className="office-btn"
                onClick={async () => {
                  if (!window.confirm('작업을 삭제할까요?')) return
                  await deleteOfficeTask(task.id)
                  await refresh()
                }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {resultTaskId ? (
        <AiResultModal taskId={resultTaskId} onClose={() => setResultTaskId(null)} onChanged={refresh} />
      ) : null}
    </div>
  )
}
