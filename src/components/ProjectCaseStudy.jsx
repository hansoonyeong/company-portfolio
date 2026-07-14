import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { isVideoSrc } from '../lib/media'
import { getProjectPath } from '../lib/projects'
import { buildProjectImageAlt, isLogoVariationSection } from '../lib/imageSeo'
import LogoVariationSwitcher from './LogoVariationSwitcher'
import OrderJourneyDemo from './OrderJourneyDemo'
import './ProjectCaseStudy.css'

const DEFAULT_SECTION_ORDER = [
  'overview',
  'challenge',
  'solution',
  'outcome',
  'process',
  'logo',
  'touchpoints',
  'businessCard',
  'quote',
]

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

  const lightboxSrc = mediaSrc

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

function FeatureVisual({ visual, project, onImageClick, t }) {
  if (!visual?.image && !visual?.images?.length && !visual?.video) return null

  const openImage = (src) => {
    if (onImageClick && src) onImageClick(src)
  }

  const layout = visual.layout || (visual.images?.length > 1 ? 'duo' : 'wide')
  const primarySrc = visual.video || visual.image || visual.images?.[0]
  const images = visual.images?.length
    ? visual.images
    : visual.image
      ? [visual.image]
      : []
  const isDuo = layout === 'duo' || layout === 'duo-scroll'
  const isScroll = layout === 'scroll' || layout === 'phone-scroll' || layout === 'duo-scroll'

  return (
    <figure className={`case-study__visual case-study__visual--${layout}`}>
      {isDuo ? (
        <div className="case-study__visual-duo">
          {images.map((src, index) => {
            const media = (
              <CaseStudyMedia
                src={src}
                alt={
                  visual.alt ||
                  buildProjectImageAlt({
                    title: project.title,
                    section: visual.caption || 'Visual',
                    tag: String(index + 1),
                  })
                }
                className={[
                  'case-study__visual-shot',
                  index > 0 ? 'case-study__visual-shot--secondary' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                assetVersion={project.assetVersion}
                onClick={onImageClick ? () => openImage(src) : undefined}
                label={t.projects.viewPhoto.replace('{n}', String(index + 1))}
              />
            )

            if (!isScroll) {
              return <div key={src}>{media}</div>
            }

            return (
              <div
                key={src}
                className={`case-study__device ${
                  index > 0 ? 'case-study__device--phone' : 'case-study__device--desktop'
                }`}
              >
                <div
                  className={`case-study__visual-scroll${
                    index > 0 ? ' case-study__visual-scroll--phone' : ''
                  }`}
                >
                  {media}
                </div>
              </div>
            )
          })}
        </div>
      ) : isScroll ? (
        <div
          className={`case-study__visual-scroll${
            layout === 'phone-scroll' ? ' case-study__visual-scroll--phone' : ''
          }`}
        >
          <CaseStudyMedia
            src={visual.image || images[0]}
            video={visual.video}
            poster={visual.poster}
            alt={
              visual.alt ||
              buildProjectImageAlt({
                title: project.title,
                section: visual.caption || 'Visual',
              })
            }
            className="case-study__visual-shot case-study__visual-shot--scroll"
            autoplay={Boolean(visual.video)}
            assetVersion={project.assetVersion}
            onClick={onImageClick ? () => openImage(primarySrc) : undefined}
            label={t.projects.viewPhoto.replace('{n}', '1')}
          />
        </div>
      ) : (
        <CaseStudyMedia
          src={visual.image || images[0]}
          video={visual.video}
          poster={visual.poster}
          alt={
            visual.alt ||
            buildProjectImageAlt({
              title: project.title,
              section: visual.caption || 'Visual',
            })
          }
          className={`case-study__visual-shot${
            layout === 'portrait' ? ' case-study__visual-shot--portrait' : ''
          }`}
          autoplay={Boolean(visual.video)}
          assetVersion={project.assetVersion}
          onClick={onImageClick ? () => openImage(primarySrc) : undefined}
          label={t.projects.viewPhoto.replace('{n}', '1')}
        />
      )}
      {visual.caption && <figcaption className="case-study__visual-caption">{visual.caption}</figcaption>}
    </figure>
  )
}

function StoryBlock({ section, fallbackLabel, project, onImageClick, t }) {
  if (!section?.paragraphs?.length && !section?.title && !section?.image) return null

  const openImage = (src) => {
    if (onImageClick && src) onImageClick(src)
  }

  const layout = section.layout || (section.image ? 'split' : 'text')
  const copy = (
    <>
      <p className="case-study__label">{section.label || fallbackLabel}</p>
      {section.title && <h2 className="case-study__title">{section.title}</h2>}
      {(section.paragraphs || []).length > 0 && (
        <div className="case-study__prose case-study__prose--story">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      )}
      {section.caption && <p className="case-study__caption">{section.caption}</p>}
    </>
  )

  if (layout === 'split' && section.image) {
    return (
      <section className="case-study__block case-study__block--story case-study__block--story-split">
        <div className="case-study__overview-layout">
          <div className="case-study__overview-copy">{copy}</div>
          <CaseStudyImage
            src={section.image}
            alt={
              section.alt ||
              buildProjectImageAlt({
                title: project.title,
                section: section.label || fallbackLabel,
              })
            }
            className="case-study__overview-image"
            onClick={onImageClick ? () => openImage(section.image) : undefined}
            label={t.projects.viewPhoto.replace('{n}', '1')}
            assetVersion={project.assetVersion}
          />
        </div>
      </section>
    )
  }

  if (layout === 'visual-first' && section.image) {
    return (
      <section className="case-study__block case-study__block--story">
        <CaseStudyImage
          src={section.image}
          alt={
            section.alt ||
            buildProjectImageAlt({
              title: project.title,
              section: section.label || fallbackLabel,
            })
          }
          className="case-study__story-follow-image"
          onClick={onImageClick ? () => openImage(section.image) : undefined}
          label={t.projects.viewPhoto.replace('{n}', '1')}
          assetVersion={project.assetVersion}
        />
        <div className="case-study__story-follow">{copy}</div>
      </section>
    )
  }

  return (
    <section
      className={`case-study__block case-study__block--story${
        layout === 'stack' ? ' case-study__block--story-stack' : ' case-study__block--story-compact'
      }`}
    >
      {layout === 'stack' ? (
        <div className="case-study__story-stack">
          <p className="case-study__label">{section.label || fallbackLabel}</p>
          {section.title && <h2 className="case-study__title">{section.title}</h2>}
          <div className="case-study__prose case-study__prose--story">
            {(section.paragraphs || []).map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        </div>
      ) : (
        <div className="case-study__two-col case-study__two-col--compact">
          <div>
            <p className="case-study__label">{section.label || fallbackLabel}</p>
            {section.title && <h2 className="case-study__title">{section.title}</h2>}
          </div>
          <div className="case-study__prose case-study__prose--story">
            {(section.paragraphs || []).map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function resolveSectionOrder(cs) {
  if (cs.sectionOrder?.length) return cs.sectionOrder

  const order = [...DEFAULT_SECTION_ORDER]
  const visuals = cs.featureVisuals || []

  visuals.forEach((visual) => {
    const placement = visual.placement || ''
    const match = placement.match(/^after:(.+)$/)
    if (!match) return
    const afterKey = match[1]
    const insertAt = order.indexOf(afterKey)
    if (insertAt === -1) return
    order.splice(insertAt + 1, 0, `feature:${visual.id}`)
  })

  return order
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

  const businessCard = cs.businessCard?.mainImage || cs.businessCard?.mainVideo ? cs.businessCard : null
  const usesPrintLayout = businessCard?.layout === 'split' || businessCard?.layout === 'finale'
  const heroVariant = cs.hero?.variant || (cs.hero?.video ? 'dominant' : '')
  const sectionOrder = resolveSectionOrder(cs)
  const featureMap = Object.fromEntries((cs.featureVisuals || []).map((visual) => [visual.id, visual]))

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
          alt={buildProjectImageAlt({
            title: project.title,
            section: businessCard.title,
          })}
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
            alt={buildProjectImageAlt({
              title: project.title,
              section: businessCard.title,
            })}
            className="case-study__card-shot"
            onClick={onImageClick ? () => openImage(src) : undefined}
            label={t.projects.viewPhoto.replace('{n}', String(cs.media.indexOf(src) + 1))}
          />
        ))}
      </div>
    </section>
  )

  const renderBusinessCardPrint = () => {
    const layoutClass =
      businessCard.layout === 'finale'
        ? 'case-study__print-layout case-study__print-layout--finale'
        : 'case-study__print-layout'

    return (
      <section
        className={`case-study__block case-study__block--print${
          businessCard.layout === 'finale' ? ' case-study__block--finale' : ''
        }`}
      >
        <div className={layoutClass}>
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
              alt={buildProjectImageAlt({
                title: project.title,
                section: businessCard.title,
              })}
              className={`case-study__print-shot${
                businessCard.layout === 'finale' ? ' case-study__print-shot--finale' : ''
              }`}
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
                alt={buildProjectImageAlt({
                  title: project.title,
                  section: businessCard.title,
                })}
                className="case-study__print-shot"
                onClick={onImageClick ? () => openImage(src) : undefined}
                label={t.projects.viewPhoto.replace('{n}', String(cs.media.indexOf(src) + 1))}
              />
            ))}
          </div>
        </div>
      </section>
    )
  }

  const renderOverview = () => {
    if (!cs.overview) return null
    const hasImage = Boolean(cs.overview.image)

    const copy = (
      <div className={hasImage ? 'case-study__overview-copy' : 'case-study__story-stack'}>
        <p className="case-study__label">{cs.overview.label}</p>
        <h2 className="case-study__title">{cs.overview.title}</h2>
        <div className="case-study__prose">
          {cs.overview.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </div>
    )

    return (
      <section className="case-study__block case-study__block--overview">
        {hasImage ? (
          <div className="case-study__overview-layout">
            {copy}
            <CaseStudyImage
              src={cs.overview.image}
              alt={
                cs.overview.alt ||
                buildProjectImageAlt({
                  title: project.title,
                  subtitle: project.subtitle,
                  section: cs.overview.label,
                })
              }
              className="case-study__overview-image"
              onClick={onImageClick ? () => openImage(cs.overview.image) : undefined}
              label={t.projects.viewPhoto.replace('{n}', '1')}
              assetVersion={project.assetVersion}
            />
          </div>
        ) : (
          copy
        )}
      </section>
    )
  }

  const renderProcess = () => {
    if (!cs.process?.steps?.length) return null
    return (
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
    )
  }

  const renderLogo = () => {
    if (!cs.logo?.cells?.length) return null
    return (
      <section className="case-study__block case-study__block--logo">
        <p className="case-study__label">{cs.logo.label}</p>
        <h2 className="case-study__title">{cs.logo.title}</h2>
        {cs.logo.text && <p className="case-study__intro">{cs.logo.text}</p>}

        {isLogoVariationSection(cs.logo) ? (
          <LogoVariationSwitcher
            variations={cs.logo.cells.map((cell) => ({
              id: cell.tag,
              label: cell.tag,
              image: cell.image,
              alt:
                cell.alt ||
                buildProjectImageAlt({
                  title: project.title,
                  section: 'Logo',
                  tag: cell.tag,
                }),
              variant: cell.variant,
              background: cell.background,
              swatchColor: cell.swatchColor,
            }))}
            onImageClick={onImageClick ? openImage : undefined}
            assetVersion={project.assetVersion}
          />
        ) : (
          <div className="case-study__logo-grid">
            {cs.logo.cells.map((cell) => (
              <div key={cell.tag} className={`case-study__logo-cell case-study__logo-cell--${cell.variant}`}>
                <CaseStudyMedia
                  src={cell.image}
                  video={cell.video}
                  poster={cell.poster}
                  alt={
                    cell.alt ||
                    buildProjectImageAlt({
                      title: project.title,
                      section: cs.logo.label,
                      tag: cell.tag,
                    })
                  }
                  className="case-study__img"
                  autoplay={Boolean(cell.video)}
                  assetVersion={project.assetVersion}
                  onClick={onImageClick ? () => openImage(cell.video || cell.image) : undefined}
                  label={cell.tag}
                />
                <span className="case-study__cell-tag">{cell.tag}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    )
  }

  const renderTouchpoints = () => {
    if (!cs.touchpoints) return null
    const layout = cs.touchpoints.layout || 'cards'
    const hasVisual = cs.touchpoints.cards?.some((card) => card.image || card.images?.length)

    return (
      <section
        className={`case-study__block case-study__block--touchpoints case-study__block--touchpoints-${layout}`}
      >
        <p className="case-study__label">{cs.touchpoints.label}</p>
        <h2 className="case-study__title">{cs.touchpoints.title}</h2>
        {cs.touchpoints.text && <p className="case-study__intro">{cs.touchpoints.text}</p>}

        {cs.touchpoints.cards?.length > 0 && (
          <div
            className={`case-study__service-row ${hasVisual ? 'case-study__service-row--visual' : ''}`}
          >
            {cs.touchpoints.cards.map((card) => {
              const previewSrc = card.image || card.images?.[0]
              const isScrollPreview = card.preview === 'scroll' || card.preview === 'mobile'

              return (
                <article
                  key={card.title}
                  className={`case-study__service-card ${
                    previewSrc ? 'case-study__service-card--media' : 'case-study__service-card--text'
                  }`}
                >
                  {previewSrc && (
                    <div
                      className={`case-study__service-media${
                        isScrollPreview ? ' case-study__service-media--scroll' : ''
                      }`}
                    >
                      <CaseStudyMedia
                        src={previewSrc}
                        alt={
                          card.imageAlt ||
                          buildProjectImageAlt({
                            title: project.title,
                            section: card.title,
                          })
                        }
                        className="case-study__service-shot"
                        assetVersion={project.assetVersion}
                        onClick={onImageClick ? () => openImage(previewSrc) : undefined}
                        label={card.title}
                      />
                    </div>
                  )}
                  <div className="case-study__service-body">
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
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    )
  }

  const renderSection = (key) => {
    if (key.startsWith('feature:')) {
      const visual = featureMap[key.slice('feature:'.length)]
      return visual ? (
        <FeatureVisual
          key={key}
          visual={visual}
          project={project}
          onImageClick={onImageClick}
          t={t}
        />
      ) : null
    }

    switch (key) {
      case 'overview':
        return <div key={key}>{renderOverview()}</div>
      case 'challenge':
        return (
          <StoryBlock
            key={key}
            section={cs.challenge}
            fallbackLabel={t.projects.challenge}
            project={project}
            onImageClick={onImageClick}
            t={t}
          />
        )
      case 'solution':
        if (project.slug === 'kimchi-house-au') {
          return (
            <OrderJourneyDemo
              key={key}
              section={cs.solution}
              fallbackLabel={t.projects.solution}
              accent={cs.accent || '#123524'}
            />
          )
        }
        return (
          <StoryBlock
            key={key}
            section={cs.solution}
            fallbackLabel={t.projects.solution}
            project={project}
            onImageClick={onImageClick}
            t={t}
          />
        )
      case 'outcome':
        return (
          <StoryBlock
            key={key}
            section={cs.outcome}
            fallbackLabel={t.projects.outcome}
            project={project}
            onImageClick={onImageClick}
            t={t}
          />
        )
      case 'process':
        return <div key={key}>{renderProcess()}</div>
      case 'logo':
        return <div key={key}>{renderLogo()}</div>
      case 'businessCard':
        if (!businessCard) return null
        return (
          <div key={key}>
            {usesPrintLayout ? renderBusinessCardPrint() : renderBusinessCardCards()}
          </div>
        )
      case 'touchpoints':
        return <div key={key}>{renderTouchpoints()}</div>
      case 'quote':
        if (!cs.quote?.text) return null
        return (
          <blockquote key={key} className="case-study__quote">
            <p>{cs.quote.text}</p>
            {cs.quote.cite && <cite>{cs.quote.cite}</cite>}
          </blockquote>
        )
      default:
        return null
    }
  }

  return (
    <article
      className={`case-study${project.slug ? ` case-study--${project.slug}` : ''}`}
      style={{ '--case-accent': cs.accent }}
    >
      <div className="container case-study__inner">
        <Link to="/works" className="case-study__back">
          ← {w.backToList}
        </Link>

        <header className={`case-study__hero${heroVariant ? ` case-study__hero--${heroVariant}` : ''}`}>
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

          {(cs.hero.video || cs.hero.image) && (
            <div className="case-study__hero-stage">
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
                <CaseStudyImage
                  src={cs.hero.image}
                  alt={buildProjectImageAlt({
                    title: project.title,
                    subtitle: project.subtitle,
                    section: 'Hero',
                  })}
                  className="case-study__hero-image"
                  onClick={onImageClick ? () => openImage(cs.hero.image) : undefined}
                  label={t.projects.viewPhoto.replace('{n}', '1')}
                />
              )}
            </div>
          )}
        </header>

        {sectionOrder.map((key) => renderSection(key))}

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
