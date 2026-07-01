import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjects } from '../context/ProjectsContext'
import { useTranslation } from '../i18n/LanguageContext'
import { getProjectFilterKey } from '../lib/projects'
import './WorksPage.css'

const FILTER_KEYS = ['all', 'marketing', 'design', 'content', 'photography']

export default function WorksPage() {
  const { t } = useTranslation()
  const { projects: items } = useProjects()
  const [activeFilter, setActiveFilter] = useState('all')
  const w = t.worksPage

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return items
    return items.filter((p) => getProjectFilterKey(p.tag) === activeFilter)
  }, [items, activeFilter])

  return (
    <div className="works-page">
      <div className="works-page__head">
        <div className="container works-page__head-inner">
          <h1>{w.title}</h1>
          <p className="works-page__count">
            {w.count.replace('{n}', String(filtered.length))}
          </p>
        </div>
      </div>

      <div className="works-page__body">
        <div className="container">
          <ul className="works-page__filters" role="tablist">
            {FILTER_KEYS.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === key}
                  className={`works-page__filter ${activeFilter === key ? 'works-page__filter--active' : ''}`}
                  onClick={() => setActiveFilter(key)}
                >
                  {w.filters[key]}
                </button>
              </li>
            ))}
          </ul>

          <ul className="works-page__grid">
            {filtered.map((project) => (
              <li key={project.id}>
                <Link to={`/works/${project.id}`} className="works-page__card">
                  <div className="works-page__cover">
                    {project.thumb ? (
                      <img src={project.thumb} alt="" />
                    ) : (
                      <span className="works-page__cover-placeholder">{project.title.charAt(0)}</span>
                    )}
                  </div>
                  <div className="works-page__meta">
                    <p className="works-page__meta-top">
                      <span>{project.tag}</span>
                      <span>{project.date}</span>
                    </p>
                    <h2>{project.subtitle || project.title}</h2>
                    <p className="works-page__client">{project.title}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
