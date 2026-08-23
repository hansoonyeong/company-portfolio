import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createOfficeConversation,
  createOfficeTask,
  deleteOfficeConversation,
  executeAiWork,
  updateOfficeConversation,
} from '../../lib/officeApi'
import { useOfficeData } from '../OfficeDataContext'
import { buildProjectBrief, copyText } from './briefBuilder'
import AiResultModal from './AiResultModal'

export default function AiChatPanel({
  lockedProjectId = null,
  initialAgentId = 'auto',
  compact = false,
}) {
  const {
    agents,
    activeProjects,
    conversations,
    memory,
    tasks,
    notes,
    refresh,
    isManualMode,
  } = useOfficeData()
  const [projectId, setProjectId] = useState(lockedProjectId || '')
  const [agentId, setAgentId] = useState(initialAgentId)
  const [activeId, setActiveId] = useState(null)
  const [message, setMessage] = useState('')
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [handledBy, setHandledBy] = useState('')
  const [resultTaskId, setResultTaskId] = useState(null)
  const [busy, setBusy] = useState(null)
  const [hint, setHint] = useState('')
  const titleId = useId()

  useEffect(() => {
    if (lockedProjectId) setProjectId(lockedProjectId)
  }, [lockedProjectId])

  const projectConversations = useMemo(() => {
    const list = conversations || []
    if (lockedProjectId) return list.filter((c) => c.projectId === lockedProjectId)
    return list
  }, [conversations, lockedProjectId])

  const active = projectConversations.find((c) => c.id === activeId) || null
  const project = activeProjects.find((p) => p.id === (projectId || lockedProjectId))

  async function startNew() {
    const created = await createOfficeConversation({
      projectId: projectId || lockedProjectId || null,
      agentId,
      title: '새 대화',
    })
    await refresh()
    setActiveId(created.id)
    setHandledBy('')
    setError('')
  }

  async function renameConversation(id) {
    const current = conversations.find((c) => c.id === id)
    const next = window.prompt('대화 이름', current?.title || '')
    if (!next?.trim()) return
    await updateOfficeConversation(id, { title: next.trim() })
    await refresh()
  }

  async function removeConversation(id) {
    if (!window.confirm('이 대화를 삭제할까요?')) return
    await deleteOfficeConversation(id)
    if (activeId === id) setActiveId(null)
    await refresh()
  }

  async function copyProjectBrief() {
    const text = buildProjectBrief({
      project,
      memory,
      tasks,
      notes,
    })
    const ok = await copyText(text)
    setHint(ok ? 'Project brief copied' : '복사에 실패했습니다')
    if (!ok) window.prompt('Copy brief:', text)
  }

  async function createTaskFromComposer() {
    const text = message.trim()
    if (!text) return
    await createOfficeTask({
      projectId: projectId || lockedProjectId || null,
      assignedAgentId: agentId === 'auto' ? null : agentId,
      title: text.slice(0, 80),
      description: text,
      mode: 'queue',
    })
    setMessage('')
    setHint('Task created')
    await refresh()
  }

  async function send(force = false) {
    if (isManualMode) {
      setError('')
      return
    }
    const text = message.trim()
    if (!text) return
    setError('')
    setStage('요청 이해 중…')
    try {
      setStage('프로젝트 컨텍스트 준비 중…')
      const result = await executeAiWork({
        projectId: projectId || lockedProjectId || null,
        agentId,
        message: text,
        conversationId: active?.id || null,
        force,
      })
      setStage('마무리 중…')
      setMessage('')
      setActiveId(result.conversationId)
      const agent = agents.find((a) => a.id === result.agentId)
      setHandledBy(agent ? `${agent.name} AI가 처리` : result.agentId)
      await refresh()
      setResultTaskId(result.taskId)
      setStage('')
      setBusy(null)
    } catch (err) {
      setStage('')
      if (err.code === 'MANUAL_MODE' || err.code === 'OPENAI_NOT_CONFIGURED') {
        setError('')
        setHint('AI generation is off. Create a task or copy a project brief instead.')
        return
      }
      if (err.code === 'AGENT_BUSY') {
        setBusy(err.conflict)
        return
      }
      setError(err.message || '요청 실패')
      await refresh()
    }
  }

  if (isManualMode) {
    return (
      <div className={`ai-chat ai-chat--manual${compact ? ' ai-chat--compact' : ''}`}>
        <div className="office-card" style={{ width: '100%' }}>
          <h3>AI generation is off</h3>
          <p>
            You can still use this project workspace to prepare briefs and save results.
            Tasks, Notes, and Project Memory remain fully available.
          </p>
          {!lockedProjectId ? (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{ marginTop: 10 }}
            >
              <option value="">프로젝트 선택</option>
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="office-badge" style={{ marginTop: 10 }}>
              {project?.name || 'Project'}
            </p>
          )}
          <div className="office-modal__actions" style={{ marginTop: 14, flexWrap: 'wrap' }}>
            <button type="button" className="office-btn office-btn--primary" onClick={createTaskFromComposer}>
              Create Task
            </button>
            <button type="button" className="office-btn" onClick={copyProjectBrief} disabled={!project}>
              Copy Project Brief
            </button>
            <Link className="office-btn" to="/admin/notes">
              Open Notes
            </Link>
            <Link
              className="office-btn"
              to={project ? `/admin/projects/${project.id}?tab=memory` : '/admin/projects'}
            >
              Open Memory
            </Link>
          </div>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional: type a task title then Create Task"
            style={{ width: '100%', marginTop: 12 }}
          />
          {hint ? <p className="office-form__hint">{hint}</p> : null}
        </div>
      </div>
    )
  }

  return (
    <div className={`ai-chat${compact ? ' ai-chat--compact' : ''}`}>
      <aside className="ai-chat__sidebar" aria-labelledby={titleId}>
        <div className="ai-chat__sidebar-head">
          <h3 id={titleId}>대화</h3>
          <button type="button" className="office-btn office-btn--primary" onClick={startNew}>
            New Chat
          </button>
        </div>
        <ul className="ai-chat__list">
          {projectConversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={activeId === c.id ? 'is-active' : ''}
                onClick={() => setActiveId(c.id)}
              >
                {c.title}
              </button>
              <div className="ai-chat__list-actions">
                <button type="button" onClick={() => renameConversation(c.id)}>
                  이름
                </button>
                <button type="button" onClick={() => removeConversation(c.id)}>
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <div className="ai-chat__main">
        <div className="ai-chat__toolbar">
          {!lockedProjectId ? (
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">프로젝트 선택</option>
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="office-badge">
              {activeProjects.find((p) => p.id === lockedProjectId)?.name || '프로젝트'}
            </span>
          )}
          <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            <option value="auto">Agent: Auto</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {handledBy ? <span className="office-badge">{handledBy}</span> : null}
        </div>

        <div className="ai-chat__messages">
          {(active?.messages || []).map((m) => (
            <div key={m.id} className={`ai-chat__msg ai-chat__msg--${m.role}`}>
              <strong>{m.role === 'user' ? 'You' : agents.find((a) => a.id === m.agentId)?.name || 'AI'}</strong>
              <pre>{m.content}</pre>
              {m.taskId && m.role === 'assistant' ? (
                <button type="button" className="office-btn" onClick={() => setResultTaskId(m.taskId)}>
                  결과 보기
                </button>
              ) : null}
            </div>
          ))}
          {!active ? <p className="ai-chat__empty">대화를 선택하거나 New Chat을 시작하세요.</p> : null}
        </div>

        {stage ? <p className="ai-chat__stage">{stage}</p> : null}
        {error ? <p style={{ color: '#8b3a3a' }}>{error}</p> : null}
        {busy ? (
          <div className="office-card" style={{ marginBottom: 10 }}>
            <p>
              {(busy.agent?.name || '에이전트')}이(가) 현재 작업 중:
              <br />
              <strong>{busy.currentTask?.title || '다른 작업'}</strong>
            </p>
            <div className="office-modal__actions">
              <button
                type="button"
                className="office-btn"
                onClick={async () => {
                  await createOfficeTask({
                    projectId: projectId || lockedProjectId || null,
                    assignedAgentId: busy.agent?.id,
                    title: message.slice(0, 80),
                    description: message,
                    mode: 'queue',
                  })
                  setBusy(null)
                  setMessage('')
                  await refresh()
                }}
              >
                Add to Queue
              </button>
              <button type="button" className="office-btn" onClick={() => setAgentId('auto')}>
                Choose Another AI
              </button>
              <button type="button" className="office-btn" onClick={() => setBusy(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <form
          className="ai-chat__composer"
          onSubmit={(e) => {
            e.preventDefault()
            send(false)
          }}
        >
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="무엇을 시킬까요?"
            disabled={Boolean(stage)}
          />
          <button type="submit" className="office-btn office-btn--primary" disabled={Boolean(stage)}>
            {stage ? '실행 중…' : '보내기'}
          </button>
        </form>
      </div>

      {resultTaskId ? (
        <AiResultModal taskId={resultTaskId} onClose={() => setResultTaskId(null)} onChanged={refresh} />
      ) : null}
    </div>
  )
}
