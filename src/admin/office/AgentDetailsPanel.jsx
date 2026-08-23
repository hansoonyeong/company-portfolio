import { AGENT_STATE_LABEL } from '../OfficeDataContext'
import { getZoneById } from './officeData'

export default function AgentDetailsPanel({
  agent,
  onClose,
  onAssignWork,
  onViewTasks,
  onSetIdle,
  onMarkDone,
  onViewResult,
  isManualMode,
}) {
  if (!agent) return null

  return (
    <aside className="office-details" aria-label={`${agent.name} 상세`}>
      <div className="office-details__head">
        <div>
          <p className="office-details__eyebrow">AI 팀</p>
          <h2 className="office-details__title">{agent.name}</h2>
          <p className="office-details__role">{agent.role}</p>
        </div>
        <button type="button" className="office-details__close" onClick={onClose} aria-label="닫기">
          ×
        </button>
      </div>

      <dl className="office-details__meta">
        <div>
          <dt>상태</dt>
          <dd>
            <span className="office-pill" data-state={agent.state}>
              {AGENT_STATE_LABEL[agent.state] || agent.state}
            </span>
          </dd>
        </div>
        <div>
          <dt>프로젝트</dt>
          <dd>{agent.project || '—'}</dd>
        </div>
        <div>
          <dt>작업</dt>
          <dd>{agent.currentTask || '—'}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{agent.statusMessage || '—'}</dd>
        </div>
        <div>
          <dt>구역</dt>
          <dd>{getZoneById(agent.currentZone || agent.zone || agent.homeZone).label}</dd>
        </div>
      </dl>

      <div className="office-details__actions">
        <button type="button" className="office-btn office-btn--primary" onClick={onAssignWork}>
          작업 배정
        </button>
        <button type="button" className="office-btn" onClick={onViewTasks}>
          작업 보기
        </button>
        {onViewResult ? (
          <button type="button" className="office-btn" onClick={onViewResult}>
            Work Result
          </button>
        ) : null}
        {agent.state === 'done' || agent.currentTaskId ? (
          <button type="button" className="office-btn" onClick={onMarkDone}>
            Mark Done
          </button>
        ) : null}
        <button type="button" className="office-btn" onClick={onSetIdle}>
          Return to Idle
        </button>
      </div>

      {isManualMode ? (
        <p className="office-details__note">
          Manual Mode — characters show assigned work, not autonomous generation.
        </p>
      ) : null}
    </aside>
  )
}
