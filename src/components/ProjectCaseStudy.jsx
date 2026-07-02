import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { isVideoSrc } from '../lib/media'
import { getProjectPath } from '../lib/projects'
import './ProjectCaseStudy.css'

function CaseStudyMedia({
  src,
  video,
  poster,
  alt,
  className,
  onClick,
  label,
  autoplay = false,
  assetVersion = '',
}) {
  const mediaSrc = video || src
  const isVideo = isVideoSrc(mediaSrc)

  const withVersion = (path) => {
    if (!path) return path
    return assetVersion ? `${path}?v=${encodeURIComponent(assetVersion)}` : path
  }

  const content = isVideo ? (
    <video
      src={withVersion(mediaSrc)}
      poster={poster ? withVersion(poster) : undefined}
      autoPlay={autoplay}
      loop={autoplay}
      muted={autoplay}
      playsInline
      preload={autoplay ? 'auto' : 'metadata'}
      aria-label={alt}
    />
  ) : (
    <img src={withVersion(mediaSrc)} alt={alt} loading="lazy" />
  )

  const lightboxSrc = isVideo ? mediaSrc : mediaSrc

  if (onClick) {
    return (
      <button
        type="button"
        className={`case-study__img-btn ${isVideo ? 'case-study__img-btn--video' : ''} ${className ?? ''}`}
        onClick={() => onClick(lightboxSrc)}
        aria-label={label}
      >
        {content}
      </button>
    )
  }

  return (
    <div className={`case-study__img ${isVideo ? 'case-study__img--video' : ''} ${className ?? ''}`}>
      {content}
    </div>
  )
}

function CaseStudyImage(props) {
  return <CaseStudyMedia {...props} />
}

export default function ProjectCaseStudy({
  project,
  prevProject,
  nextProject,
  inCart,
  onAddToQuote,
  onImageClick,
}) {
  const { t } = useTranslation()
  const w = t.worksPage
  const cs = project.caseStudy

  if (!cs) return null

  const openImage = (src) => {
    if (onImageClick && src) onImageClick(src)
  }

  const businessCard = cs.businessCard?.mainImage ? cs.businessCard : null
  const isSplitPrint = businessCard?.layout === 'split'

  const renderBusinessCardCards = () => (
    <section className="case-study__block">
      <p className="case-study__label">{businessCard.label}</p>
      <h2 className="case-study__title">{businessCard.title}</h2>
      <p className="case-study__intro">{businessCard.text}</p>

      <div className="case-study__card-row">
        <CaseStudyMedia
          src={businessCard.mainImage}
          video={businessCard.mainVideo}
          poster={businessCard.mainPoster}
          alt={businessCard.title}
          className="case-study__card-shot"
          autoplay={Boolean(businessCard.mainVideo)}
          assetVersion={project.assetVersion}
          onClick={
            onImageClick
              ? () => openImage(businessCard.mainVideo || businessCard.mainImage)
              : undefined
          }
          label={businessCard.title}
        />
        {businessCard.miniImages?.map((src) => (
          <CaseStudyImage
            key={src}
            src={src}
            alt={businessCard.title}
            className="case-study__card-shot"
            onClick={onImageClick ? () => openImage(src) : undefined}
            label={t.projects.viewPhoto.replace('{n}', String(cs.media.indexOf(src) + 1))}
          />
        ))}
      </div>
    </section>
  )

  const renderBusinessCardPrint = () => (
    <section className="case-study__block case-study__block--print">
      <div className="case-study__print-layout">
        <div className="case-study__print-copy">
          <p className="case-study__label">{businessCard.label}</p>
          <h2 className="case-study__title">{businessCard.title}</h2>
          <p className="case-study__intro">{businessCard.text}</p>
        </div>

        <div className="case-study__print-media">
          <CaseStudyMedia
            src={businessCard.mainImage}
            video={businessCard.mainVideo}
            poster={businessCard.mainPoster}
            alt={businessCard.title}
            className="case-study__print-shot"
            autoplay={Boolean(businessCard.mainVideo)}
            assetVersion={project.assetVersion}
            onClick={
              onImageClick
                ? () => openImage(businessCard.mainVideo || businessCard.mainImage)
                : undefined
            }
            label={businessCard.title}
          />
          {businessCard.miniImages?.map((src) => (
            <CaseStudyImage
              key={src}
              src={src}
              alt={businessCard.title}
              className="case-study__print-shot"
              onClick={onImageClick ? () => openImage(src) : undefined}
              label={t.projects.viewPhoto.replace('{n}', String(cs.media.indexOf(src) + 1))}
            />
          ))}
        </div>
      </div>
    </section>
  )

  return (
    <article
      className={`case-study${project.slug ? ` case-study--${project.slug}` : ''}`}
      style={{ '--case-accent': cs.accent }}
    >
      <div className="container case-study__inner">
        <Link to="/works" className="case-study__back">
          ← {w.backToList}
        </Link>

        <header className="case-study__hero">
          {cs.hero.eyebrow && <p className="case-study__eyebrow">{cs.hero.eyebrow}</p>}
          <h1 className="case-study__headline">{cs.hero.headline}</h1>
          <p className="case-study__lead">{cs.hero.lead}</p>

          {cs.hero.meta.length > 0 && (
            <dl className="case-study__meta">
              {cs.hero.meta.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {cs.hero.video ? (
            <div className="case-study__hero-video">
              <video
                key={`${cs.hero.video}-${project.assetVersion || ''}`}
                src={
                  project.assetVersion
                    ? `${cs.hero.video}?v=${encodeURIComponent(project.assetVersion)}`
                    : cs.hero.video
                }
                poster={
                  project.assetVersion
                    ? `${cs.hero.poster}?v=${encodeURIComponent(project.assetVersion)}`
                    : cs.hero.poster
                }
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-label={project.title}
              />
            </div>
          ) : (
            cs.hero.image && (
              <CaseStudyImage
                src={cs.hero.image}
                alt={project.title}
                className="case-study__hero-image"
                onClick={onImageClick ? () => openImage(cs.hero.image) : undefined}
                label={t.projects.viewPhoto.replace('{n}', '1')}
              />
            )
          )}
        </header>

        <section className="case-study__block">
          <div className="case-study__two-col">
            <div>
              <p className="case-study__label">{cs.overview.label}</p>
              <h2 className="case-study__title">{cs.overview.title}</h2>
            </div>
            <div className="case-study__prose">
              {cs.overview.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="case-study__block case-study__block--process">
          <p className="case-study__label">{cs.process.label}</p>
          {cs.process.title && <h2 className="case-study__title">{cs.process.title}</h2>}

          <ol
            className="case-study__process"
            style={{ '--process-steps': cs.process.steps.length }}
          >
            {cs.process.steps.map((step) => (
              <li key={step.tag} className="case-study__process-step">
                <span className="case-study__process-tag">{step.tag}</span>
                {step.title && <h3>{step.title}</h3>}
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="case-study__block">
          <p className="case-study__label">{cs.logo.label}</p>
          <h2 className="case-study__title">{cs.logo.title}</h2>
          <p className="case-study__intro">{cs.logo.text}</p>

          <div className="case-study__logo-grid">
            {cs.logo.cells.map((cell) => (
              <div key={cell.tag} className={`case-study__logo-cell case-study__logo-cell--${cell.variant}`}>
                <CaseStudyMedia
                  src={cell.image}
                  video={cell.video}
                  poster={cell.poster}
                  alt={cell.tag}
                  autoplay={Boolean(cell.video)}
                  assetVersion={project.assetVersion}
                  onClick={onImageClick ? () => openImage(cell.video || cell.image) : undefined}
                  label={cell.tag}
                />
                <span className="case-study__cell-tag">{cell.tag}</span>
              </div>
            ))}
          </div>
        </section>

        {businessCard && !isSplitPrint && renderBusinessCardCards()}

        {cs.touchpoints && (
          <section className="case-study__block">
            <p className="case-study__label">{cs.touchpoints.label}</p>
            <h2 className="case-study__title">{cs.touchpoints.title}</h2>
            <p className="case-study__intro">{cs.touchpoints.text}</p>

            {cs.touchpoints.cards?.length > 0 && (
            <div className="case-study__service-row">
              {cs.touchpoints.cards.map((card) => (
                <article key={card.title} className="case-study__service-card">
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  {card.items?.length > 0 && (
                    <ul>
                      {card.items.map((item) => (
                        <li key={item.label + item.text}>
                          <b>{item.label}</b> {item.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {card.linkUrl && (
                    <a
                      className="case-study__service-link"
                      href={card.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {card.linkLabel}
                    </a>
                  )}
                </article>
              ))}
            </div>
            )}
          </section>
        )}

        {businessCard && isSplitPrint && renderBusinessCardPrint()}

        {cs.quote?.text && (
          <blockquote className="case-study__quote">
            <p>{cs.quote.text}</p>
            {cs.quote.cite && <cite>{cs.quote.cite}</cite>}
          </blockquote>
        )}

        <div className="case-study__actions">
          <button
            type="button"
            className={`case-study__quote-btn ${inCart ? 'case-study__quote-btn--added' : ''}`}
            onClick={onAddToQuote}
            disabled={inCart}
          >
            {inCart ? t.projects.addedToQuote : t.projects.addToQuote}
          </button>
        </div>

        {(prevProject || nextProject) && (
          <nav className="case-study__nav" aria-label={w.title}>
            {prevProject ? (
              <Link to={getProjectPath(prevProject)} className="case-study__nav-link case-study__nav-link--prev">
                <span className="case-study__nav-label">← {w.prevProject}</span>
                <span className="case-study__nav-title">{prevProject.subtitle || prevProject.title}</span>
              </Link>
            ) : (
              <span className="case-study__nav-spacer" aria-hidden="true" />
            )}
            {nextProject ? (
              <Link to={getProjectPath(nextProject)} className="case-study__nav-link case-study__nav-link--next">
                <span className="case-study__nav-label">{w.nextProject} →</span>
                <span className="case-study__nav-title">{nextProject.subtitle || nextProject.title}</span>
              </Link>
            ) : (
              <span className="case-study__nav-spacer" aria-hidden="true" />
            )}
          </nav>
        )}
      </div>
    </article>
  )
}
