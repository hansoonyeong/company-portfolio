import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { company } from '../data/config'
import { navItems } from '../i18n/translations'
import Logo from './Logo'
import InstagramIcon from './InstagramIcon'
import './Footer.css'
import './Logo.css'

export default function Footer() {
  const { t } = useTranslation()

  const companyLinks = navItems
    .filter((item) => item.key !== 'contact')
    .map((item) => ({
      label: t.nav[item.key],
      href: item.href,
    }))

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Logo animated showTagline className="logo logo--footer" />
          </div>

          <div className="footer__links">
            <div className="footer__group">
              <div className="footer__group-head">
                <h3>{t.footer.company}</h3>
              </div>
              <ul>
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer__group footer__group--contact">
              <div className="footer__group-head">
                <h3>{t.footer.contact}</h3>
                <a
                  href={company.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__instagram"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
              </div>
              <ul>
                <li>
                  <Link to={{ pathname: '/contact', hash: '#quote' }}>{t.footer.quoteRequest}</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            &copy; {new Date().getFullYear()} {company.name}. {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}
