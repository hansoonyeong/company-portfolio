import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { useQuoteCart } from '../context/QuoteCartContext'
import SubPageLayout from '../components/SubPageLayout'
import QuoteRequestForm from '../components/QuoteRequestForm'
import './ContactPage.css'

export default function ContactPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const cart = useQuoteCart()

  useEffect(() => {
    if (location.hash !== '#quote') return undefined

    const scrollToQuote = () => {
      document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const timer = window.setTimeout(scrollToQuote, 120)
    return () => window.clearTimeout(timer)
  }, [location.hash])

  return (
    <SubPageLayout backLabel={t.contactPage.back}>
      <section className="contact-page section">
        <div className="container">
          <h1 className="contact-page__title page-heading">{t.contactPage.title}</h1>
          <QuoteRequestForm
            cartItems={cart.items}
            onRemoveItem={cart.removeItem}
            onSuccess={cart.clearCart}
          />
        </div>
      </section>
    </SubPageLayout>
  )
}
