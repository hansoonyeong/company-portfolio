import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useProjects } from '../context/ProjectsContext'
import { useTranslation } from '../i18n/LanguageContext'
import { getUniqueClients } from '../data/clientLogos'
import ClientLogoMarquee from './ClientLogoMarquee'
import './About.css'

export default function About({ full = false, showMore = false }) {
  const { t } = useTranslation()
  const { projects } = useProjects()
  const paragraphs = full ? t.aboutPage.paragraphs : t.about.paragraphs
  const clients = useMemo(() => getUniqueClients(projects), [projects])

  return (
    <section className="about section" id={full ? undefined : 'about'}>
      <div className="container">
        {showMore ? (
          <div className="section-header about__header">
            <h2>{t.about.title}</h2>
            <Link to="/about">{t.about.more}</Link>
          </div>
        ) : (
          <h1 className="page-heading about__title">{t.about.title}</h1>
        )}

        <div className={`about__inner ${full ? 'about__inner--full' : ''}`}>
          <div className="about__content">
            {paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          {full && t.aboutPage.services && (
            <div className="about__services">
              <h3>{t.aboutPage.servicesTitle}</h3>
              <ul className="about__service-list">
                {t.aboutPage.services.map((service) => (
                  <li key={service}>
                    <span className="about__service-chip">{service}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {full && clients.length > 0 && (
          <div className="about__clients">
            <h3>{t.aboutPage.clientsTitle}</h3>
            <ClientLogoMarquee clients={clients} />
            <Link to="/works" className="about__clients-more">
              {t.aboutPage.clientsMore}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
