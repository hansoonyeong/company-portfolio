import { useState } from 'react'
import { countByState } from './officeData'

function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return '좋은 아침이에요'
  if (hour < 17) return '좋은 오후예요'
  return '좋은 저녁이에요'
}

export default function OfficeCommandBar({
  agents,
  projects,
  projectFilter,
  onProjectFilter,
  onAssignWork,
  onStartMeeting,
  onCommandSubmit,
  isManualMode,
  busyLabel,
  handledBy,
}) {
  const { working, waiting, available } = countByState(agents)
  const [message, setMessage] = useState('')

  return (
    <header className="office-command">
      <div className="office-command__copy">
        <h1 className="office-command__greeting">{getGreeting()}, Lucy</h1>
        <p className="office-command__sub">
          {isManualMode ? '팀을 배정하고 작업을 진행하세요.' : 'AI 팀이 일하고 있어요.'}
        </p>
      </div>

      <label className="office-command__filter">
        <span className="visually-hidden">프로젝트 필터</span>
        <select value={projectFilter} onChange={(e) => onProjectFilter?.(e.target.value)}>
          <option value="all">전체 프로젝트</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <ul className="office-command__counts" aria-label="팀 상태">
        <li>
          <strong>{working}</strong> 작업 중
        </li>
        <li>
          <strong>{waiting}</strong> 대기
        </li>
        <li>
          <strong>{available}</strong> 가능
        </li>
      </ul>

      <form
        className="office-command__ai"
        onSubmit={(e) => {
          e.preventDefault()
          const text = message.trim()
          if (!text || busyLabel) return
          onCommandSubmit?.(text)
          setMessage('')
        }}
      >
        <label className="visually-hidden" htmlFor="office-ai-input">
          작업 지시
        </label>
        <input
          id="office-ai-input"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isManualMode ? 'What are we working on?' : 'What do you want the AI team to work on?'
          }
          disabled={Boolean(busyLabel)}
        />
        <button type="submit" className="office-btn office-btn--primary" disabled={Boolean(busyLabel)}>
          {busyLabel || (isManualMode ? 'Assign' : 'Run')}
        </button>
      </form>
      {handledBy ? <p className="office-command__handled">{handledBy}</p> : null}

      <div className="office-command__actions">
        <button type="button" className="office-btn office-btn--primary" onClick={onAssignWork}>
          작업 배정
        </button>
        <button type="button" className="office-btn" onClick={onStartMeeting}>
          미팅 시작
        </button>
      </div>
    </header>
  )
}
