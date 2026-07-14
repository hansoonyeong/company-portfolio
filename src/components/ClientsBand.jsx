import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useProjects } from '../context/ProjectsContext'
import { useTranslation } from '../i18n/LanguageContext'
import { getUniqueClients } from '../data/clientLogos'
import ClientLogoMarquee from './ClientLogoMarquee'
import './ClientsBand.css'

export default function ClientsBand() {
  const { t } = useTranslation()
  const { projects } = useProjects()
  const clients = useMemo(() => getUniqueClients(projects), [projects])
  const copy = t.home.clients

  if (clients.length === 0) return null

  return (
    <section className="clients-band section section--calm" id="clients">
      <div className="container">
        <div className="section-header clients-band__header">
          <div>
            <p className="clients-band__label">{copy.label}</p>
            <h2>{copy.title}</h2>
          </div>
          <Link to="/works">{t.aboutPage.clientsMore}</Link>
        </div>
        <ClientLogoMarquee clients={clients} />
      </div>
    </section>
  )
}
