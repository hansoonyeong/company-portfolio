import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { CART_CONTACT_PATH } from '../lib/cartNavigation'
import './QuoteCartBar.css'

export default function QuoteCartBar({ items }) {
  const { t } = useTranslation()
  const c = t.servicesPage.cart

  if (items.length === 0) return null

  return (
    <div className="quote-cart-bar">
      <div className="quote-cart-bar__inner container">
        <div className="quote-cart-bar__summary">
          <p className="quote-cart-bar__count">{c.itemCount.replace('{n}', items.length)}</p>
          <ul className="quote-cart-bar__items">
            {items.map((item) => (
              <li key={item.id} className="quote-cart-bar__item">
                <span className="quote-cart-bar__item-name">{item.name}</span>
                <span className="quote-cart-bar__item-price">{item.price}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link to={CART_CONTACT_PATH} className="quote-cart-bar__btn">
          {c.openCart} →
        </Link>
      </div>
    </div>
  )
}
