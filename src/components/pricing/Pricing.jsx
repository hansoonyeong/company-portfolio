import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../i18n/LanguageContext'
import { useQuoteCart } from '../../context/QuoteCartContext'
import { CART_CONTACT_PATH } from '../../lib/cartNavigation'
import PillarPanel from './PillarPanel'
import PricingCustomSection from './PricingCustomSection'
import PricingTabs from './PricingTabs'
import '../Pricing.css'

export default function Pricing() {
  const { t } = useTranslation()
  const services = t.servicesPage
  const labels = services.cart
  const cart = useQuoteCart()
  const navigate = useNavigate()
  const pillars = services.pillars
  const [activePillarId, setActivePillarId] = useState(pillars[0]?.id ?? 'brand')

  const activePillar = useMemo(
    () => pillars.find((pillar) => pillar.id === activePillarId) ?? pillars[0],
    [pillars, activePillarId],
  )

  const panelId = `pricing-panel-${activePillar.id}`
  const catalogProps = {
    onAdd: cart.addItem,
    hasItem: cart.hasItem,
    labels,
  }

  return (
    <section className={`pricing section ${cart.count > 0 ? 'pricing--has-cart' : ''}`}>
      <div className="container">
        <div className="pricing__header">
          <p className="pricing__year">{services.yearLabel}</p>
          <h2>{services.title}</h2>
          <p>{services.subtitle}</p>
        </div>

        <p className="pricing__tab-hint">{services.tabHint}</p>

        <div className="pricing__sheet">
          <PricingTabs
            pillars={pillars}
            activePillarId={activePillarId}
            panelId={panelId}
            onSelect={setActivePillarId}
            ariaLabel={services.title}
          />

          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={`pricing-tab-${activePillar.id}`}
            data-pillar={activePillar.id}
            className="pricing__tabpanel"
          >
            <PillarPanel
              pillar={activePillar}
              includesLabel={services.includesLabel}
              {...catalogProps}
            />
          </div>
        </div>

        <PricingCustomSection custom={services.custom} onQuote={() => navigate(CART_CONTACT_PATH)} />

        <ul className="pricing__notes">
          {services.notes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
