import AgentCharacter from './AgentCharacter'
import { ZONES, getAgentFloorPosition } from './officeData'

export default function OfficeFloor({
  agents,
  selectedId,
  onSelect,
  reducedMotion,
  projectFilter = 'all',
}) {
  return (
    <div className="office-floor" role="region" aria-label="가상 오피스">
      <div className="office-floor__grid" aria-hidden="true" />

      {ZONES.map((zone) => (
        <div
          key={zone.id}
          className={`office-zone office-zone--${zone.id}`}
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.w}%`,
            height: `${zone.h}%`,
          }}
        >
          <span className="office-zone__label">{zone.label}</span>
          {zone.id === 'meeting' && <span className="office-zone__table" aria-hidden="true" />}
          {zone.id === 'coffee' && <span className="office-zone__coffee" aria-hidden="true" />}
        </div>
      ))}

      {agents.map((agent) => {
        const pos = getAgentFloorPosition(agent, agents)
        const related =
          projectFilter === 'all' ||
          !agent.currentProjectId ||
          agent.currentProjectId === projectFilter
        return (
          <div
            key={agent.id}
            className={`office-agent-slot${related ? '' : ' is-dimmed'}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <AgentCharacter
              agent={agent}
              selected={selectedId === agent.id}
              onSelect={onSelect}
              reducedMotion={reducedMotion}
            />
          </div>
        )
      })}
    </div>
  )
}
