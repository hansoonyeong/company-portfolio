import { useEffect } from 'react'
import { useTranslation } from '../i18n/LanguageContext'
import QuoteRequestForm from './QuoteRequestForm'
import './QuoteCartModal.css'

export default function QuoteCartModal({ items, open, onClose, onSubmitted, onRemoveItem }) {
  const { t } = useTranslation()
  const c = t.servicesPage.cart

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="quote-cart-modal" role="dialog" aria-modal="true" aria-labelledby="quote-cart-title">
      <button type="button" className="quote-cart-modal__close" onClick={onClose} aria-label={c.close}>
        ×
      </button>
      <div className="quote-cart-modal__backdrop" onClick={onClose} aria-hidden="true" />

      <div className="quote-cart-modal__panel">
        <header className="quote-cart-modal__header">
          <h2 id="quote-cart-title">{c.modalTitle}</h2>
          <p>{c.modalDesc}</p>
        </header>

        <div className="quote-cart-modal__body">
          <QuoteRequestForm
            cartItems={items}
            inModal
            onRemoveItem={onRemoveItem}
            onSuccess={() => {
              onSubmitted?.()
              onClose()
            }}
          />
        </div>
      </div>
    </div>
  )
}
