import { useMemo } from 'react'
import { useProjects } from '../context/ProjectsContext'
import { useTranslation } from '../i18n/LanguageContext'
import './Testimonials.css'

export default function Testimonials() {
  const { t, lang } = useTranslation()
  const { rawProjects } = useProjects()
  const copy = t.home.testimonials

  const items = useMemo(() => {
    const pick = (field) => {
      if (field && typeof field === 'object' && (field.en || field.ko)) {
        return field[lang] || field.en || field.ko || ''
      }
      return field || ''
    }

    return (rawProjects || [])
      .filter((project) => project.caseStudy?.quote?.text)
      .map((project) => {
        const quote = project.caseStudy.quote
        return {
          id: project.id,
          text: pick(quote.text),
          cite: pick(quote.cite) || pick(project.title) || project.title,
        }
      })
      .filter((item) => item.text)
      .slice(0, 3)
  }, [rawProjects, lang])

  if (items.length === 0) return null

  return (
    <section className="testimonials section section--calm" id="voices">
      <div className="container">
        <p className="testimonials__label">{copy.label}</p>
        <h2 className="testimonials__title">{copy.title}</h2>

        <ul className="testimonials__list">
          {items.map((item) => (
            <li key={item.id} className="testimonials__item">
              <blockquote>
                <p>“{item.text}”</p>
                {item.cite && <cite>{item.cite}</cite>}
              </blockquote>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
