import { useTranslation } from '../i18n/LanguageContext'
import './Process.css'

export default function Process() {
  const { t } = useTranslation()
  const copy = t.home.process

  return (
    <section className="process section section--calm" id="process">
      <div className="container">
        <p className="process__label">{copy.label}</p>
        <h2 className="process__title">{copy.title}</h2>

        <ol className="process__steps">
          {copy.steps.map((step) => (
            <li key={step.title} className="process__step">
              <span className="process__tag">{step.tag}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
