import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import './StudioIntro.css'

export default function StudioIntro({ showPageHeading = false }) {
  const { t } = useTranslation()
  const copy = t.home.studio

  return (
    <section className="studio-intro section section--calm" id="studio">
      <div className="container">
        {showPageHeading ? (
          <h1 className="page-heading studio-intro__page-title">{t.about.title}</h1>
        ) : (
          <p className="studio-intro__label">{copy.label}</p>
        )}
        <div className="studio-intro__grid">
          <h2 className="studio-intro__title">{copy.title}</h2>
          <div className="studio-intro__body">
            {copy.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
            {!showPageHeading && (
              <Link to="/about" className="studio-intro__link">
                {copy.cta}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
