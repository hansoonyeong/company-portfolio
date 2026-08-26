import { AGENT_STATE_LABEL } from '../OfficeDataContext'
import { getZoneById } from './officeData'
import { formatKoreanDate, itemEffectiveDate, todayKey } from './scheduleUtils'

export default function AgentDetailsPanel({
  agent,
  onClose,
  onAssignWork,
  onViewTasks,
  onSetIdle,
  onMarkDone,
  onViewResult,
  isManualMode,
  tasks = [],
  schedule = [],
}) {
  if (!agent) return null

  const agentTasks = tasks.filter(
    (t) => t.assignedAgentId === agent.id && t.status !== 'done',
  )
  const upcoming = agentTasks
    .filter((t) => t.dueDate)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
    .slice(0, 3)
  const waiting = agentTasks.filter((t) => t.status === 'waiting')
  const agentSchedule = (schedule || [])
    .filter(
      (s) =>
        s.assignedAgentId === agent.id &&
        s.status !== 'completed' &&
        s.status !== 'cancelled',
    )
    .sort((a, b) =>
      String(itemEffectiveDate(a) || '9999').localeCompare(String(itemEffectiveDate(b) || '9999')),
    )
    .slice(0, 3)

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
          <dt>현재 담당 업무</dt>
          <dd>{agent.currentTask || agentTasks[0]?.title || '—'}</dd>
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

      <div className="office-details__block">
        <h3>다가오는 마감</h3>
        {upcoming.length === 0 && agentSchedule.length === 0 ? <p>—</p> : null}
        <ul>
          {upcoming.map((t) => (
            <li key={t.id}>
              {t.title}
              {t.dueDate ? ` · ${formatKoreanDate(String(t.dueDate).slice(0, 10))}` : ''}
              {String(t.dueDate || '').slice(0, 10) === todayKey() ? ' (오늘)' : ''}
            </li>
          ))}
          {agentSchedule.map((s) => (
            <li key={s.id}>
              {s.title}
              {itemEffectiveDate(s) ? ` · ${formatKoreanDate(itemEffectiveDate(s))}` : ''}
            </li>
          ))}
        </ul>
      </div>

      <div className="office-details__block">
        <h3>대기 업무</h3>
        {waiting.length === 0 ? <p>—</p> : null}
        <ul>
          {waiting.map((t) => (
            <li key={t.id}>
              {t.title}
              {t.waitingFor ? ` · ${t.waitingFor}` : ''}
            </li>
          ))}
        </ul>
      </div>

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
          Manual Mode — 캐릭터 상태는 실제 배정 업무·대기·마감에서 파생됩니다.
        </p>
      ) : null}
    </aside>
  )
}
