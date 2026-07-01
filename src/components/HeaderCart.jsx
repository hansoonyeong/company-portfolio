import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { useQuoteCart } from '../context/QuoteCartContext'
import { CART_CONTACT_PATH } from '../lib/cartNavigation'
import './HeaderCart.css'

function CartIcon() {
  return (
    <svg className="header-cart__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6h15l-1.5 9h-12L6 6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6 6 5 3H2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19" r="1.25" fill="currentColor" />
      <circle cx="17.5" cy="19" r="1.25" fill="currentColor" />
    </svg>
  )
}

export default function HeaderCart() {
  const { count } = useQuoteCart()
  const { t } = useTranslation()
  const label = t.servicesPage?.cart?.label ?? 'Cart'

  return (
    <Link
      to={CART_CONTACT_PATH}
      className="header-cart"
      aria-label={count > 0 ? `${label} ${count}` : label}
    >
      <CartIcon />
      {count > 0 && <span className="header-cart__badge">{count}</span>}
    </Link>
  )
}
