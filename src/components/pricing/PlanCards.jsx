import { planPriceLabel } from './pricingCart'
import PricingAddButton from './PricingAddButton'

export default function PlanCards({
  plans,
  section,
  category,
  includesLabel,
  onAdd,
  hasItem,
  labels,
}) {
  return (
    <ul className="pricing__plans">
      {plans.map((plan) => (
        <li
          key={plan.id}
          className={`pricing__plan ${plan.highlighted ? 'pricing__plan--highlighted' : ''}`}
        >
          {plan.desc && <p className="pricing__plan-badge">{plan.desc}</p>}
          <h4 className="pricing__plan-name">{plan.name}</h4>
          <p className="pricing__plan-price">
            {plan.price}
            {plan.unit && <span className="pricing__plan-unit">{plan.unit}</span>}
          </p>
          <div className="pricing__plan-divider" aria-hidden="true" />
          <p className="pricing__plan-includes">{includesLabel}</p>
          <ul className="pricing__plan-features">
            {plan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          {plan.footnote && <p className="pricing__plan-footnote">{plan.footnote}</p>}
          <PricingAddButton
            section={section}
            category={category}
            itemKey={plan.id}
            name={plan.name}
            price={planPriceLabel(plan)}
            labels={labels}
            onAdd={onAdd}
            hasItem={hasItem}
          />
        </li>
      ))}
    </ul>
  )
}
