import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from '../i18n/LanguageContext'
import { submitQuote } from '../lib/api'
import './QuoteRequestForm.css'

const initialForm = {
  name: '',
  email: '',
  company: '',
  service: '',
  budget: '',
  timeline: '',
  message: '',
}

export default function QuoteRequestForm({
  cartItems = [],
  onSuccess,
  onRemoveItem,
  inModal = false,
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setError('')

    const hasCart = cartItems.length > 0
    if (!form.message.trim() && !hasCart) {
      setStatus('error')
      setError(t.contactPage.form.messageRequired)
      return
    }

    try {
      await submitQuote({
        ...form,
        items: cartItems.map(({ id, section, category, name, price }) => ({
          id,
          section,
          category,
          name,
          price,
        })),
      })
      setForm(initialForm)
      onSuccess?.()
      if (!inModal) {
        setStatus('success')
      }
    } catch {
      setStatus('error')
      setError(t.contactPage.form.error)
    }
  }

  const f = t.contactPage.form
  const c = t.servicesPage?.cart

  return (
    <div className={`quote-form ${inModal ? 'quote-form--modal' : ''}`} id="quote">
      {!inModal && (
        <>
          <h2 className="quote-form__title">{f.title}</h2>
          <p className="quote-form__desc">{f.desc}</p>
        </>
      )}

      {cartItems.length > 0 ? (
        <div className="quote-form__cart">
          <div className="quote-form__cart-head">
            <h3 className="quote-form__cart-title">{c?.selectedItems ?? 'Selected items'}</h3>
            <span className="quote-form__cart-count">
              {c?.itemCount?.replace('{n}', cartItems.length) ?? cartItems.length}
            </span>
          </div>
          <ul className="quote-form__cart-list">
            {cartItems.map((item) => (
              <li key={item.id} className="quote-form__cart-item">
                <div className="quote-form__cart-item-info">
                  <span className="quote-form__cart-item-name">{item.name}</span>
                  {(item.section || item.category) && (
                    <span className="quote-form__cart-item-meta">
                      {[item.section, item.category].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
                <span className="quote-form__cart-item-price">{item.price}</span>
                {onRemoveItem && (
                  <button
                    type="button"
                    className="quote-form__cart-remove"
                    onClick={() => onRemoveItem(item.id)}
                    aria-label={c?.remove}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        !inModal && (
          <p className="quote-form__cart-empty">
            {c?.emptyCart ?? 'No items yet.'}{' '}
            <Link to="/services">{t.nav?.services ?? 'Services'}</Link>
          </p>
        )
      )}

      {status === 'success' ? (
        <div className="quote-form__success" role="status">
          <p>{f.success}</p>
          {!inModal && (
            <button type="button" className="quote-form__reset" onClick={() => setStatus('idle')}>
              {f.newRequest}
            </button>
          )}
        </div>
      ) : (
        <form className="quote-form__fields" onSubmit={handleSubmit}>
          <div className="quote-form__row">
            <label className="quote-form__field">
              <span>{f.name} *</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </label>
            <label className="quote-form__field">
              <span>{f.email} *</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </label>
          </div>

          <label className="quote-form__field">
            <span>{f.company}</span>
            <input
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              autoComplete="organization"
            />
          </label>

          <div className="quote-form__row">
            <label className="quote-form__field">
              <span>{f.service}</span>
              <select name="service" value={form.service} onChange={handleChange}>
                <option value="">{f.servicePlaceholder}</option>
                {f.serviceOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="quote-form__field">
              <span>{f.budget}</span>
              <select name="budget" value={form.budget} onChange={handleChange}>
                <option value="">{f.budgetPlaceholder}</option>
                {f.budgetOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="quote-form__field">
            <span>{f.timeline}</span>
            <input type="text" name="timeline" value={form.timeline} onChange={handleChange} />
          </label>

          <label className="quote-form__field">
            <span>
              {f.message}
              {cartItems.length === 0 ? ' *' : ` (${f.optional})`}
            </span>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required={cartItems.length === 0}
              rows={4}
              placeholder={cartItems.length > 0 ? f.messageOptionalPlaceholder : f.messagePlaceholder}
            />
          </label>

          {status === 'error' && <p className="quote-form__error">{error}</p>}

          <button type="submit" className="quote-form__submit" disabled={status === 'loading'}>
            {status === 'loading' ? f.submitting : f.submit}
          </button>
        </form>
      )}
    </div>
  )
}
