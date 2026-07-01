import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { useQuoteCart } from '../context/QuoteCartContext'
import { CART_CONTACT_PATH } from '../lib/cartNavigation'
import './Pricing.css'

function AddButton({ added, onClick, label, addedLabel }) {
  return (
    <button
      type="button"
      className={`pricing__add-btn ${added ? 'pricing__add-btn--added' : ''}`}
      onClick={onClick}
      disabled={added}
    >
      {added ? addedLabel : label}
    </button>
  )
}

function PlanCards({ plans, section, category, includesLabel, onAdd, hasItem, labels }) {
  return (
    <ul className="pricing__plans">
      {plans.map((plan) => {
        const id = `${section}::${category}::${plan.id}`
        const priceLabel = `${plan.price}${plan.unit || ''}`
        return (
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
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {plan.footnote && <p className="pricing__plan-footnote">{plan.footnote}</p>}
            <AddButton
              added={hasItem(id)}
              label={labels.add}
              addedLabel={labels.added}
              onClick={() =>
                onAdd({
                  id,
                  section,
                  category,
                  name: plan.name,
                  price: priceLabel,
                })
              }
            />
          </li>
        )
      })}
    </ul>
  )
}

function PriceTable({ headers, rows, section, category, onAdd, hasItem, labels }) {
  const hasNotes = headers.length > 2

  return (
    <>
      <ul className="pricing__item-cards">
        {rows.map((row) => {
          const id = `${section}::${category}::${row.name}`
          return (
            <li key={row.name} className="pricing__item-card">
              <h4 className="pricing__item-card-name">
                {row.name}
                {row.badge && <span className="pricing__badge">{row.badge}</span>}
              </h4>
              <p className="pricing__plan-price">{row.price}</p>
              <AddButton
                added={hasItem(id)}
                label={labels.add}
                addedLabel={labels.added}
                onClick={() =>
                  onAdd({
                    id,
                    section,
                    category,
                    name: row.name,
                    price: row.price,
                  })
                }
              />
            </li>
          )
        })}
      </ul>

      <div className="pricing__table-wrap">
      <table className="pricing__table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
            <th scope="col" className="pricing__table-action-col">
              {labels.action}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = `${section}::${category}::${row.name}`
            return (
              <tr key={row.name}>
                <th scope="row">
                  {row.name}
                  {row.badge && <span className="pricing__badge">{row.badge}</span>}
                </th>
                <td>{row.price}</td>
                {hasNotes && <td className="pricing__table-note">{row.note || '—'}</td>}
                <td className="pricing__table-action">
                  <AddButton
                    added={hasItem(id)}
                    label={labels.add}
                    addedLabel={labels.added}
                    onClick={() =>
                      onAdd({
                        id,
                        section,
                        category,
                        name: row.name,
                        price: row.price,
                      })
                    }
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </>
  )
}

function ServiceGroupPanel({ group, pillarTitle, includesLabel, onAdd, hasItem, labels }) {
  const section = pillarTitle
  const category = group.title

  return (
    <section className="pricing__group-block">
      <h3 className="pricing__group-title">{group.title}</h3>
      {group.intro && <p className="pricing__group-intro">{group.intro}</p>}

      {group.plans && (
        <PlanCards
          plans={group.plans}
          section={section}
          category={category}
          includesLabel={includesLabel}
          onAdd={onAdd}
          hasItem={hasItem}
          labels={labels}
        />
      )}

      {group.items && (
        <PriceTable
          headers={group.tableHeaders}
          rows={group.items}
          section={section}
          category={category}
          onAdd={onAdd}
          hasItem={hasItem}
          labels={labels}
        />
      )}
    </section>
  )
}

function PillarPanel({ pillar, includesLabel, onAdd, hasItem, labels }) {
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
          section={pillar.title}
          category=""
          includesLabel={includesLabel}
          onAdd={onAdd}
          hasItem={hasItem}
          labels={labels}
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

export default function Pricing() {
  const { t } = useTranslation()
  const services = t.servicesPage
  const labels = services.cart
  const cart = useQuoteCart()
  const navigate = useNavigate()
  const pillars = services.pillars
  const [activePillarId, setActivePillarId] = useState(pillars[0]?.id ?? 'brand')

  const activePillar = useMemo(
    () => pillars.find((p) => p.id === activePillarId) ?? pillars[0],
    [pillars, activePillarId],
  )

  const selectPillar = (id) => {
    setActivePillarId(id)
  }

  const goToQuote = () => {
    navigate(CART_CONTACT_PATH)
  }

  const panelId = `pricing-panel-${activePillar.id}`

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
          <div className="pricing__tabs" role="tablist" aria-label={services.title}>
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
                  onClick={() => selectPillar(pillar.id)}
                >
                  <span className="pricing__tab-title">{pillar.title}</span>
                  <span className="pricing__tab-tagline">{pillar.tagline}</span>
                </button>
              )
            })}
          </div>

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
              onAdd={cart.addItem}
              hasItem={cart.hasItem}
              labels={labels}
            />
          </div>
        </div>

        <div className="pricing__custom">
          <h3 className="pricing__custom-title">{services.custom.title}</h3>
          <p className="pricing__custom-desc">{services.custom.desc}</p>
          <button type="button" className="pricing__custom-cta" onClick={goToQuote}>
            {services.custom.cta} →
          </button>
        </div>

        <ul className="pricing__notes">
          {services.notes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
