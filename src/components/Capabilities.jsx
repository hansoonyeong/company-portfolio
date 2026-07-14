import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import './Capabilities.css'

export default function Capabilities() {
  const { t } = useTranslation()
  const copy = t.home.capabilities

  return (
    <section className="capabilities section section--calm" id="capabilities">
      <div className="container">
        <div className="section-header">
          <div>
            <p className="capabilities__label">{copy.label}</p>
            <h2>{copy.title}</h2>
          </div>
          <Link to="/services">{copy.more}</Link>
        </div>

        <ul className="capabilities__list">
          {copy.items.map((item) => (
            <li key={item.title} className="capabilities__item">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
