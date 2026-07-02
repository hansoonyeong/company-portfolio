export default function PricingCustomSection({ custom, onQuote }) {
  return (
    <div className="pricing__custom">
      <h3 className="pricing__custom-title">{custom.title}</h3>
      <p className="pricing__custom-desc">{custom.desc}</p>
      <button type="button" className="pricing__custom-cta" onClick={onQuote}>
        {custom.cta} →
      </button>
    </div>
  )
}
