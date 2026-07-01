import { useTranslation } from '../i18n/LanguageContext'
import { company } from '../data/config'
import Logo from './Logo'
import InstagramIcon from './InstagramIcon'
import './Footer.css'
import './Logo.css'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Logo animated showTagline className="logo logo--footer" />
          </div>

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

        <div className="footer__bottom">
          <p>
            &copy; {new Date().getFullYear()} {company.name}. {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}
