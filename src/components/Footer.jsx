import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { company } from '../data/config'
import InstagramIcon from './InstagramIcon'
import './Footer.css'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__main">
          <div className="footer__identity">
            <a
              href={company.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="footer__instagram"
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>

            <div className="footer__contact">
              <a href={`mailto:${company.email}`} className="footer__email">
                {company.email}
              </a>
              <p className="footer__location">{company.location}</p>
              <Link to="/contact" className="footer__cta">
                {t.footer.quoteRequest}
              </Link>
            </div>
          </div>

          <nav className="footer__legal" aria-label="Legal">
            <Link to="/privacy">{t.footer.privacyPolicy}</Link>
            <Link to="/terms">{t.footer.terms}</Link>
          </nav>
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
