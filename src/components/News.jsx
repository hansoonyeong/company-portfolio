import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { defaultNews } from '../data/defaultNews'
import { fetchNews } from '../lib/api'
import { localizeNewsItem } from '../lib/news'
import './News.css'

const HOME_PREVIEW_LIMIT = 3

export default function News({ full = false, limit = full ? undefined : HOME_PREVIEW_LIMIT, showMore = false }) {
  const { lang, t } = useTranslation()
  const location = useLocation()
  const [items, setItems] = useState(defaultNews)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    let active = true

    fetchNews()
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setItems(data)
        }
      })
      .catch(() => {
        if (active) setItems(defaultNews)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!full) return

    const hashId = location.hash.replace(/^#/, '')
    if (!hashId) return

    setExpandedId(hashId)

    const scrollTarget = () => {
      document.getElementById(`news-${hashId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const timer = window.setTimeout(scrollTarget, 280)
    return () => window.clearTimeout(timer)
  }, [full, location.hash, items.length])

  const localized = items.map((item) => localizeNewsItem(item, lang))
  const visible = limit ? localized.slice(0, limit) : localized

  const toggleItem = (id) => {
    if (!full) return
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <section className="news section" id={full ? undefined : 'news'}>
      <div className="container">
        {full ? (
          <h1 className="page-heading news__page-title">{t.news.title}</h1>
        ) : (
          <div className="section-header">
            <h2>{t.news.title}</h2>
            {showMore && <Link to="/news">{t.news.more}</Link>}
          </div>
        )}

        <ul className="news__list">
          {visible.map((item) => {
            const hasContent = Boolean(item.content?.trim())
            const isExpanded = expandedId === item.id

            return (
              <li
                key={item.id}
                id={`news-${item.id}`}
                className={`news__row ${isExpanded ? 'news__row--expanded' : ''}`}
              >
                {full ? (
                  <>
                    <button
                      type="button"
                      className={`news__item news__item--expandable ${isExpanded ? 'news__item--open' : ''}`}
                      onClick={() => toggleItem(item.id)}
                      aria-expanded={isExpanded}
                    >
                      <span className="news__category">{item.category}</span>
                      <span className="news__title">{item.title}</span>
                      <span className="news__date">{item.date}</span>
                      <span className="news__chevron" aria-hidden="true">
                        {isExpanded ? '−' : '+'}
                      </span>
                    </button>

                    <div className={`news__panel ${isExpanded ? 'news__panel--open' : ''}`}>
                      <div className="news__content">
                        {hasContent ? (
                          <p>{item.content}</p>
                        ) : (
                          <p className="news__content-empty">{t.news.noContent}</p>
                        )}
                        {item.document?.href && (
                          <a
                            className="news__document"
                            href={item.document.href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.document.label} →
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link to={`/news#${item.id}`} className="news__item">
                    <span className="news__category">{item.category}</span>
                    <span className="news__title">{item.title}</span>
                    <span className="news__date">{item.date}</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
