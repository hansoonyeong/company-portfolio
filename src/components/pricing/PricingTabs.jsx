export default function PricingTabs({ pillars, activePillarId, panelId, onSelect, ariaLabel }) {
  return (
    <div className="pricing__tabs" role="tablist" aria-label={ariaLabel}>
      {pillars.map((pillar) => {
        const selected = pillar.id === activePillarId

        return (
          <button
            key={pillar.id}
            type="button"
            role="tab"
            id={`pricing-tab-${pillar.id}`}
            data-pillar={pillar.id}
            className={`pricing__tab ${selected ? 'pricing__tab--active' : ''}`}
            aria-selected={selected}
            aria-controls={panelId}
            onClick={() => onSelect(pillar.id)}
          >
            <span className="pricing__tab-title">{pillar.title}</span>
            <span className="pricing__tab-tagline">{pillar.tagline}</span>
          </button>
        )
      })}
    </div>
  )
}
