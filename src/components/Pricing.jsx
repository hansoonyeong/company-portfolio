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
            <h4 className="pricing__plan-name">{plan.name}</h4>
            {plan.desc && <p className="pricing__plan-desc">{plan.desc}</p>}
            <p className="pricing__plan-price">
              {plan.price}
              {plan.unit && <span className="pricing__plan-unit">{plan.unit}</span>}
            </p>
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
  )
}

function ServiceGroup({ group, pillarTitle, includesLabel, onAdd, hasItem, labels }) {
  const section = pillarTitle
  const category = group.title

  return (
    <div className="pricing__group">
      <h4 className="pricing__group-title">{group.title}</h4>
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
    </div>
  )
}

export default function Pricing() {
  const { t } = useTranslation()
  const services = t.servicesPage
  const labels = services.cart
  const cart = useQuoteCart()
  const navigate = useNavigate()

  const goToQuote = () => {
    navigate(CART_CONTACT_PATH)
  }

  return (
    <section className={`pricing section ${cart.count > 0 ? 'pricing--has-cart' : ''}`}>
      <div className="container">
        <div className="pricing__header">
          <p className="pricing__year">{services.yearLabel}</p>
          <h2>{services.title}</h2>
          <p>{services.subtitle}</p>
        </div>

        {services.pillars.map((pillar) => (
          <article key={pillar.id} className="pricing__pillar">
            <header className="pricing__pillar-head">
              <h3 className="pricing__pillar-title">{pillar.title}</h3>
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
            </header>

            {pillar.plans && (
              <PlanCards
                plans={pillar.plans}
                section={pillar.title}
                category=""
                includesLabel={services.includesLabel}
                onAdd={cart.addItem}
                hasItem={cart.hasItem}
                labels={labels}
              />
            )}

            {pillar.groups?.map((group) => (
              <ServiceGroup
                key={group.id}
                group={group}
                pillarTitle={pillar.title}
                includesLabel={services.includesLabel}
                onAdd={cart.addItem}
                hasItem={cart.hasItem}
                labels={labels}
              />
            ))}
          </article>
        ))}

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
