export default function PricingItemName({ name, badge }) {
  return (
    <>
      {name}
      {badge && <span className="pricing__badge">{badge}</span>}
    </>
  )
}
