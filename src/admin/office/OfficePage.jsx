import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createOfficeMeeting,
  createOfficeTask,
  executeAiWork,
  updateOfficeAgent,
  updateOfficeMeeting,
  updateOfficeTask,
} from '../../lib/officeApi'
import { useOfficeData, AGENT_STATE_LABEL } from '../OfficeDataContext'
import OfficeCommandBar from './OfficeCommandBar'
import OfficeFloor from './OfficeFloor'
import AgentCharacter from './AgentCharacter'
import AgentDetailsPanel from './AgentDetailsPanel'
import AssignWorkModal from './AssignWorkModal'
import MeetingModal from './MeetingModal'
import MeetingPanel from './MeetingPanel'
import AiResultModal from './AiResultModal'
import { enrichAgent, getZoneById } from './officeData'
import './office.css'

function usePrefersReducedMotion() {
  const [reduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  return reduced
}

function useIsMobileOffice(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches
  })
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const onChange = () => setIsMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [breakpoint])
  return isMobile
}

export default function OfficePage() {
  const navigate = useNavigate()
  const { agents, projects, tasks, meetings, loading, error, refresh, activeProjects } =
    useOfficeData()
  const [selectedId, setSelectedId] = useState(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignPrefillId, setAssignPrefillId] = useState(null)
  const [meetingOpen, setMeetingOpen] = useState(false)
  const [projectFilter, setProjectFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [busyWarning, setBusyWarning] = useState('')
  const [aiStage, setAiStage] = useState('')
  const [handledBy, setHandledBy] = useState('')
  const [resultTaskId, setResultTaskId] = useState(null)
  const [aiBusy, setAiBusy] = useState(null)
  const [pendingAiMessage, setPendingAiMessage] = useState('')

  const reducedMotion = usePrefersReducedMotion()
  const isMobile = useIsMobileOffice()

  const enrichedAgents = useMemo(
    () => agents.map((a) => enrichAgent(a, { projects, tasks })),
    [agents, projects, tasks],
  )

  const selectedAgent = enrichedAgents.find((a) => a.id === selectedId) || null
  const activeMeeting = meetings.find((m) => m.status === 'active') || null
  const meetingProject = projects.find((p) => p.id === activeMeeting?.projectId)

  const hasActiveAi = agents.some((a) => a.state === 'thinking' || a.state === 'working')

  useEffect(() => {
    if (!hasActiveAi) return undefined
    const id = window.setInterval(() => {
      refresh()
    }, 4000)
    return () => window.clearInterval(id)
  }, [hasActiveAi, refresh])

  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(null), 2600)
  }

  function openAssign(forAgentId) {
    setBusyWarning('')
    setAssignPrefillId(forAgentId || selectedId || null)
    setAssignOpen(true)
  }

  async function handleAssign(payload) {
    try {
      await createOfficeTask(payload)
      setAssignOpen(false)
      setAssignPrefillId(null)
      setBusyWarning('')
      await refresh()
      showToast(`「${payload.title}」 배정됨`)
    } catch (err) {
      if (err.code === 'AGENT_BUSY') {
        const name = err.conflict?.agent?.name || '에이전트'
        const taskTitle = err.conflict?.currentTask?.title || '다른 작업'
        setBusyWarning(`${name}이(가) 현재 「${taskTitle}」을(를) 진행 중입니다.`)
      }
      throw err
    }
  }

  async function runAi(message, { force = false, agentId = 'auto' } = {}) {
    setPendingAiMessage(message)
    setAiStage('Thinking')
    setAiBusy(null)
    try {
      setAiStage('Preparing project context')
      const result = await executeAiWork({
        projectId: projectFilter === 'all' ? null : projectFilter,
        agentId,
        message,
        force,
      })
      setAiStage('Finalising')
      const agent = agents.find((a) => a.id === result.agentId)
      setHandledBy(agent ? `Handled by ${agent.name} AI` : result.agentId)
      await refresh()
      setResultTaskId(result.taskId)
      setSelectedId(result.agentId)
      setAiStage('')
      showToast('AI 작업 완료')
    } catch (err) {
      setAiStage('')
      await refresh()
      if (err.code === 'AGENT_BUSY') {
        setAiBusy(err.conflict)
        return
      }
      if (err.taskId) setResultTaskId(err.taskId)
      showToast(err.message || 'AI 요청 실패')
    }
  }

  async function handleStartMeeting(payload) {
    await createOfficeMeeting(payload)
    setMeetingOpen(false)
    await refresh()
    showToast(`미팅 시작: ${payload.topic}`)
  }

  async function handleEndMeeting() {
    if (!activeMeeting) return
    await updateOfficeMeeting(activeMeeting.id, { status: 'completed' })
    await refresh()
    showToast('미팅이 종료되었습니다')
  }

  async function handleSetIdle() {
    if (!selectedAgent) return
    await updateOfficeAgent(selectedAgent.id, { state: 'idle' })
    await refresh()
    showToast(`${selectedAgent.name} → 대기`)
  }

  async function handleMarkDone() {
    if (!selectedAgent?.currentTaskId) return
    await updateOfficeTask(selectedAgent.currentTaskId, { status: 'done' })
    await refresh()
    showToast('작업을 완료 처리했습니다')
  }

  if (loading && agents.length === 0) {
    return <p className="office-page__lead">오피스 불러오는 중…</p>
  }

  if (error) {
    return (
      <div className="office-page">
        <p className="office-page__lead" style={{ color: '#8b3a3a' }}>
          {error}
        </p>
        <button type="button" className="office-btn" onClick={refresh}>
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className={`office-page${isMobile ? ' office-page--mobile' : ''}`}>
      <OfficeCommandBar
        agents={enrichedAgents}
        projects={activeProjects}
        projectFilter={projectFilter}
        onProjectFilter={setProjectFilter}
        onAssignWork={() => openAssign()}
        onStartMeeting={() => setMeetingOpen(true)}
        onAiSubmit={(text) => runAi(text)}
        aiStage={aiStage}
        handledBy={handledBy}
      />

      {aiBusy ? (
        <div className="office-card" style={{ margin: '0 0 12px' }}>
          <p>
            {(aiBusy.agent?.name || '에이전트')} is currently working on:
            <br />
            <strong>{aiBusy.currentTask?.title || 'another task'}</strong>
          </p>
          <div className="office-modal__actions">
            <button
              type="button"
              className="office-btn"
              onClick={async () => {
                await createOfficeTask({
                  projectId: projectFilter === 'all' ? null : projectFilter,
                  assignedAgentId: aiBusy.agent?.id,
                  title: pendingAiMessage.slice(0, 80),
                  description: pendingAiMessage,
                  mode: 'queue',
                })
                setAiBusy(null)
                await refresh()
                showToast('대기열에 추가됨')
              }}
            >
              Add to Queue
            </button>
            <button type="button" className="office-btn" onClick={() => openAssign()}>
              Choose Another AI
            </button>
            <button type="button" className="office-btn" onClick={() => setAiBusy(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {activeMeeting && (
        <MeetingPanel
          meeting={activeMeeting}
          agents={enrichedAgents}
          projectName={meetingProject?.name}
          onEnd={handleEndMeeting}
          onChanged={refresh}
        />
      )}

      <div className="office-page__body">
        {!isMobile ? (
          <OfficeFloor
            agents={enrichedAgents}
            selectedId={selectedId}
            onSelect={setSelectedId}
            reducedMotion={reducedMotion}
            projectFilter={projectFilter}
          />
        ) : (
          <div className="office-mobile-list" role="list" aria-label="AI 팀">
            {enrichedAgents.map((agent) => {
              const dimmed =
                projectFilter !== 'all' &&
                agent.currentProjectId &&
                agent.currentProjectId !== projectFilter
              return (
                <button
                  key={agent.id}
                  type="button"
                  className={`office-mobile-card${selectedId === agent.id ? ' is-selected' : ''}${dimmed ? ' is-dimmed' : ''}`}
                  role="listitem"
                  aria-label={
                    agent.currentTask
                      ? `${agent.name} AI, ${AGENT_STATE_LABEL[agent.state] || agent.state}, ${agent.currentTask}`
                      : `${agent.name} AI, ${AGENT_STATE_LABEL[agent.state] || agent.state}`
                  }
                  onClick={() => setSelectedId(agent.id)}
                >
                  <AgentCharacter
                    agent={agent}
                    selected={selectedId === agent.id}
                    reducedMotion={reducedMotion}
                    compact
                  />
                  <div className="office-mobile-card__copy">
                    <strong>{agent.name}</strong>
                    <span data-state={agent.state}>
                      {AGENT_STATE_LABEL[agent.state] || agent.state}
                    </span>
                    <p>{agent.currentTask || agent.statusMessage || '—'}</p>
                    <em>{agent.project || getZoneById(agent.zone).label}</em>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {selectedAgent && (
          <AgentDetailsPanel
            agent={selectedAgent}
            onClose={() => setSelectedId(null)}
            onAssignWork={() => openAssign(selectedAgent.id)}
            onViewTasks={() => navigate('/admin/tasks')}
            onSetIdle={handleSetIdle}
            onMarkDone={handleMarkDone}
            onViewResult={
              selectedAgent.currentTaskId
                ? () => setResultTaskId(selectedAgent.currentTaskId)
                : undefined
            }
          />
        )}
      </div>

      {assignOpen && (
        <AssignWorkModal
          agents={enrichedAgents}
          projects={activeProjects}
          initialAgentId={assignPrefillId}
          busyWarning={busyWarning}
          onAssign={handleAssign}
          onClose={() => {
            setAssignOpen(false)
            setAssignPrefillId(null)
            setBusyWarning('')
          }}
        />
      )}

      {meetingOpen && (
        <MeetingModal
          agents={enrichedAgents}
          projects={activeProjects}
          onStartMeeting={handleStartMeeting}
          onClose={() => setMeetingOpen(false)}
        />
      )}

      {resultTaskId ? (
        <AiResultModal
          taskId={resultTaskId}
          onClose={() => setResultTaskId(null)}
          onChanged={refresh}
        />
      ) : null}

      {toast && (
        <div className="office-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
