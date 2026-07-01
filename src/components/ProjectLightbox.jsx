import { useCallback, useEffect } from 'react'
import { isVideoSrc } from '../lib/media'
import './ProjectLightbox.css'

export default function ProjectLightbox({ items, index, labels, onClose, onChange }) {
  const total = items.length
  const current = items[index]

  const goPrev = useCallback(() => {
    onChange((index - 1 + total) % total)
  }, [index, total, onChange])

  const goNext = useCallback(() => {
    onChange((index + 1) % total)
  }, [index, total, onChange])

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [goNext, goPrev, onClose])

  useEffect(() => {
    let startX = 0

    const handleTouchStart = (event) => {
      startX = event.changedTouches[0].clientX
    }

    const handleTouchEnd = (event) => {
      const delta = event.changedTouches[0].clientX - startX
      if (Math.abs(delta) < 40) return
      if (delta > 0) goPrev()
      else goNext()
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [goNext, goPrev])

  if (!current) return null

  return (
    <div className="project-lightbox" role="dialog" aria-modal="true" aria-label={labels.title}>
      <button type="button" className="project-lightbox__backdrop" onClick={onClose} aria-label={labels.close} />
      <button type="button" className="project-lightbox__close" onClick={onClose} aria-label={labels.close}>
        ×
      </button>

      {total > 1 && (
        <>
          <button type="button" className="project-lightbox__nav project-lightbox__nav--prev" onClick={goPrev} aria-label={labels.prev}>
            ‹
          </button>
          <button type="button" className="project-lightbox__nav project-lightbox__nav--next" onClick={goNext} aria-label={labels.next}>
            ›
          </button>
        </>
      )}

      <div className="project-lightbox__stage">
        {isVideoSrc(current) ? (
          <video
            key={current}
            src={current}
            className="project-lightbox__media"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img src={current} alt="" className="project-lightbox__media" />
        )}
      </div>

      {total > 1 && (
        <p className="project-lightbox__counter">
          {labels.counter.replace('{current}', String(index + 1)).replace('{total}', String(total))}
        </p>
      )}
    </div>
  )
}
