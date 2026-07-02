import { Link } from 'react-router-dom'
import PlanCards from './PlanCards'
import ServiceGroupPanel from './ServiceGroupPanel'

export default function PillarPanel({ pillar, includesLabel, onAdd, hasItem, labels }) {
  const catalogProps = { section: pillar.title, onAdd, hasItem, labels }

  return (
    <div className="pricing__panel">
      <div className="pricing__panel-head">
        <p className="pricing__pillar-tagline">{pillar.tagline}</p>
        <p className="pricing__pillar-intro">{pillar.intro}</p>
        {pillar.newsLink && (
          <Link className="pricing__download" to={pillar.newsLink.href}>
            <span className="pricing__download-label">{pillar.newsLink.label}</span>
            {pillar.newsLink.desc && (
              <span className="pricing__download-desc">{pillar.newsLink.desc}</span>
            )}
          </Link>
        )}
      </div>

      {pillar.plans && (
        <PlanCards
          plans={pillar.plans}
          category=""
          includesLabel={includesLabel}
          {...catalogProps}
        />
      )}

      {pillar.groups?.length > 0 && (
        <div className="pricing__group-stack">
          {pillar.groups.map((group) => (
            <ServiceGroupPanel
              key={group.id}
              group={group}
              pillarTitle={pillar.title}
              includesLabel={includesLabel}
              onAdd={onAdd}
              hasItem={hasItem}
              labels={labels}
            />
          ))}
        </div>
      )}
    </div>
  )
}
