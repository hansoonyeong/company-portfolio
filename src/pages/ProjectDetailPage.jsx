import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { useProjects } from '../context/ProjectsContext'
import { isVideoSrc } from '../lib/media'
import { useQuoteCart } from '../context/QuoteCartContext'
import { usePageSeo } from '../lib/usePageSeo.js'
import ProjectLightbox from '../components/ProjectLightbox'
import ProjectCaseStudy from '../components/ProjectCaseStudy'
import JustifiedGallery from '../components/JustifiedGallery'
import {
  findProject,
  getProjectPath,
  getProjectNeighbors,
  projectCartId,
  projectToCartItem,
} from '../lib/projects'
import { buildProjectImageAlt } from '../lib/imageSeo'
import './ProjectDetailPage.css'

function getProjectMedia(project) {
  const gallery = project.gallery ?? []
  if (!project.thumb) return gallery
  return [project.thumb, ...gallery.filter((src) => src !== project.thumb)]
}

function ProjectMediaItem({ src, className, loading, alt }) {
  if (isVideoSrc(src)) {
    return (
      <video
        src={src}
        className={className}
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
    )
  }

  return <img src={src} alt={alt} className={className} loading={loading} />
}

export default function ProjectDetailPage() {
  const { slug } = useParams()
  const { t, lang } = useTranslation()
  const { projects, quotePriceLabel, loading } = useProjects()
  const cart = useQuoteCart()
  const w = t.worksPage
  const project = findProject(projects, slug)
  const { prev: prevProject, next: nextProject } = getProjectNeighbors(projects, slug)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const pageSeo = useMemo(() => {
    if (!project) return null

    const path = getProjectPath(project)
    const description =
      project.description?.[lang] ||
      project.description?.en ||
      project.subtitle ||
      t.meta.description
    const image =
      project.thumb ||
      (project.gallery ?? []).find((src) => !isVideoSrc(src)) ||
      '/logo.png'

    return {
      title: `${project.title} | soono`,
      description,
      path,
      image,
      type: 'article',
    }
  }, [project, lang, t.meta.description])

  usePageSeo(pageSeo)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [slug])

  if (loading) {
    return (
      <div className="project-detail project-detail--loading">
        <div className="container">
          <p>{t.projects.loading}</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return <Navigate to="/works" replace />
  }

  const canonicalPath = getProjectPath(project)
  if (slug !== project.slug) {
    return <Navigate to={canonicalPath} replace />
  }

  const cartId = projectCartId(project.id)
  const inCart = cart.hasItem(cartId)
  const media = project.caseStudy?.media?.length
    ? project.caseStudy.media
    : getProjectMedia(project)
  const heroSrc = project.thumb ?? media.find((src) => !isVideoSrc(src)) ?? media[0] ?? null
  const gridMedia = heroSrc ? media.filter((src) => src !== heroSrc) : media

  const openLightbox = (src) => {
    const index = media.indexOf(src)
    if (index >= 0) setLightboxIndex(index)
  }

  const handleAddToQuote = () => {
    cart.addItem(projectToCartItem(project, quotePriceLabel))
  }

  if (project.caseStudy) {
    return (
      <>
        <ProjectCaseStudy
          project={project}
          prevProject={prevProject}
          nextProject={nextProject}
          inCart={inCart}
          onAddToQuote={handleAddToQuote}
          onImageClick={openLightbox}
        />

        {lightboxIndex !== null && (
          <ProjectLightbox
            items={media}
            index={lightboxIndex}
            labels={t.projects.lightbox}
            onClose={() => setLightboxIndex(null)}
            onChange={setLightboxIndex}
          />
        )}
      </>
    )
  }

  return (
    <article className="project-detail">
      <div className="container">
        <Link to="/works" className="project-detail__back">
          ← {w.backToList}
        </Link>

        <div className="project-detail__hero">
          {heroSrc && (
            <div className="project-detail__hero-visual">
              <button
                type="button"
                className={`project-detail__hero-btn ${isVideoSrc(heroSrc) ? 'project-detail__hero-btn--video' : ''}`}
                onClick={() => openLightbox(heroSrc)}
                aria-label={t.projects.viewPhoto.replace('{n}', '1')}
              >
                <ProjectMediaItem
                  src={heroSrc}
                  alt={buildProjectImageAlt({
                    title: project.title,
                    subtitle: project.subtitle,
                    section: 'Hero',
                  })}
                />
              </button>
            </div>
          )}

          <div className="project-detail__info">
            <p className="project-detail__tag">{project.tag}</p>
            <h1>{project.subtitle || project.title}</h1>
            <p className="project-detail__client">{project.title}</p>

            <dl className="project-detail__meta">
              <div>
                <dt>{w.dateLabel}</dt>
                <dd>{project.date}</dd>
              </div>
              <div>
                <dt>{w.locationLabel}</dt>
                <dd>{project.location}</dd>
              </div>
            </dl>

            <div className="project-detail__section">
              <h2>{t.projects.overview}</h2>
              <p>{project.description}</p>
            </div>

            <div className="project-detail__section">
              <h2>{t.projects.scopeLabel}</h2>
              <ul>
                {project.scope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className={`project-detail__quote-btn ${inCart ? 'project-detail__quote-btn--added' : ''}`}
              onClick={handleAddToQuote}
              disabled={inCart}
            >
              {inCart ? t.projects.addedToQuote : t.projects.addToQuote}
            </button>
          </div>
        </div>

        {gridMedia.length > 0 && (
          <section className="project-detail__photos" aria-label={t.projects.galleryLabel}>
            <JustifiedGallery
              items={gridMedia}
              rowHeight={360}
              gap={12}
              onItemClick={openLightbox}
              getItemLabel={(src) =>
                buildProjectImageAlt({
                  title: project.title,
                  subtitle: project.subtitle,
                  section: t.projects.galleryLabel,
                  index: media.indexOf(src),
                })
              }
            />
          </section>
        )}

        {(prevProject || nextProject) && (
          <nav className="project-detail__nav" aria-label={w.title}>
            {prevProject ? (
              <Link to={getProjectPath(prevProject)} className="project-detail__nav-link project-detail__nav-link--prev">
                <span className="project-detail__nav-label">← {w.prevProject}</span>
                <span className="project-detail__nav-title">{prevProject.subtitle || prevProject.title}</span>
              </Link>
            ) : (
              <span className="project-detail__nav-spacer" aria-hidden="true" />
            )}
            {nextProject ? (
              <Link to={getProjectPath(nextProject)} className="project-detail__nav-link project-detail__nav-link--next">
                <span className="project-detail__nav-label">{w.nextProject} →</span>
                <span className="project-detail__nav-title">{nextProject.subtitle || nextProject.title}</span>
              </Link>
            ) : (
              <span className="project-detail__nav-spacer" aria-hidden="true" />
            )}
          </nav>
        )}
      </div>

      {lightboxIndex !== null && (
        <ProjectLightbox
          items={media}
          index={lightboxIndex}
          labels={t.projects.lightbox}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}
    </article>
  )
}
