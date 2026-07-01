import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { navItems } from '../i18n/translations'
import Logo from './Logo'
import HeaderCart from './HeaderCart'
import './Header.css'
import './Logo.css'

export default function Header() {
  const { lang, setLang, t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="header">
      <div className="header__inner container">
        <Link to="/" className="header__logo" onClick={closeMenu}>
          <Logo animated className="logo logo--header" />
        </Link>

        <nav className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
          <ul>
            {navItems.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.href}
                  onClick={closeMenu}
                  className={location.pathname === item.href ? 'header__link--active' : undefined}
                >
                  {t.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          <HeaderCart />
          <div className="header__lang" role="group" aria-label={t.a11y.langSwitch}>
            <button
              type="button"
              className={`header__lang-btn ${lang === 'ko' ? 'header__lang-btn--active' : ''}`}
              onClick={() => setLang('ko')}
            >
              KO
            </button>
            <button
              type="button"
              className={`header__lang-btn ${lang === 'en' ? 'header__lang-btn--active' : ''}`}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>
          <button
            className="header__menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t.a11y.menu}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}
