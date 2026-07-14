import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { company } from '../data/config'
import './HomeCta.css'

export default function HomeCta() {
  const { t } = useTranslation()
  const copy = t.home.cta

  return (
    <section className="home-cta section section--calm" id="start">
      <div className="container">
        <div className="home-cta__panel">
          <h2 className="home-cta__title">{copy.title}</h2>
          <div>
            <p className="home-cta__text">{copy.text}</p>
            <div className="home-cta__actions">
              <Link to="/contact" className="home-cta__primary">
                {copy.primary}
              </Link>
              <a href={`mailto:${company.email}`} className="home-cta__secondary">
                {copy.secondary}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
