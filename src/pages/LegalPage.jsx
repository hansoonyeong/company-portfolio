import { useMemo } from 'react'
import { useTranslation } from '../i18n/LanguageContext'
import { legalEn, legalKo } from '../i18n/legalContent'
import SubPageLayout from '../components/SubPageLayout'
import './LegalPage.css'

function LegalSection({ section }) {
  return (
    <section className="legal__section">
      <h2 className="legal__heading">{section.heading}</h2>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>{paragraph}</p>
      ))}
      {section.list?.length > 0 && (
        <ul className="legal__list">
          {section.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {section.afterList && <p>{section.afterList}</p>}
    </section>
  )
}

export default function LegalPage({ type }) {
  const { lang, t } = useTranslation()
  const content = useMemo(() => (lang === 'ko' ? legalKo : legalEn)[type], [lang, type])

  return (
    <SubPageLayout backLabel={t.aboutPage.back}>
      <article className="legal section">
        <div className="container legal__inner">
          <p className="legal__updated">{content.updated}</p>
          <h1 className="legal__title">{content.title}</h1>

          <div className="legal__body">
            {content.intro.split('\n\n').map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="legal__intro">
                {paragraph}
              </p>
            ))}

            {content.sections.map((section) => (
              <LegalSection key={section.heading} section={section} />
            ))}

            <section className="legal__section legal__section--contact">
              <h2 className="legal__heading">{content.contact.heading}</h2>
              <p>{content.contact.text}</p>
              <a href={`mailto:${content.contact.email}`} className="legal__email">
                {content.contact.email}
              </a>
            </section>
          </div>
        </div>
      </article>
    </SubPageLayout>
  )
}
