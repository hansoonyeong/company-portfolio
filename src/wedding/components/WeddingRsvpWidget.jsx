import { useEffect, useState } from 'react'

import { weddingConfig } from '../config/weddingConfig.js'
import { weddingImages } from '../config/weddingImages.js'
import WeddingRsvpForm from './WeddingRsvpForm.jsx'

export default function WeddingRsvpWidget({ open, onOpenChange, editToken, onTokenChange }) {
  const [showForm, setShowForm] = useState(Boolean(editToken))
  const { couple } = weddingConfig
  const { greeting, intro, cta, fabAriaOpen, fabAriaClose } = weddingConfig.rsvpWidget
  const headerImage = weddingImages.hero?.[0] || weddingImages.cover
  const mark = `${couple.groom.slice(0, 1)} × ${couple.bride.slice(0, 1)}`

  useEffect(() => {
    if (editToken) {
      onOpenChange(true)
      setShowForm(true)
    }
  }, [editToken, onOpenChange])

  useEffect(() => {
    if (!open) setShowForm(Boolean(editToken))
  }, [open, editToken])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const toggle = () => onOpenChange(!open)

  const startForm = () => setShowForm(true)

  return (
    <div className={`w-rsvp-widget${open ? ' is-open' : ''}`}>
      {open && (
        <div
          className="w-rsvp-widget__backdrop"
          role="presentation"
          onClick={() => onOpenChange(false)}
        />
      )}

      {open && (
        <div
          className="w-rsvp-widget__panel"
          role="dialog"
          aria-modal="true"
          aria-label="참석 예약"
        >
          <div className="w-rsvp-widget__header">
            <img src={headerImage.src} alt="" className="w-rsvp-widget__header-img" />
            <div className="w-rsvp-widget__header-overlay" />
            <p className="w-rsvp-widget__header-mark">{mark}</p>
            <p className="w-rsvp-widget__header-names">
              {couple.groomKo} & {couple.brideKo}
            </p>
          </div>

          <div className="w-rsvp-widget__body">
            {!showForm ? (
              <div className="w-rsvp-widget__welcome">
                <div className="w-rsvp-widget__bubble">
                  <span className="w-rsvp-widget__avatar" aria-hidden="true">
                    {mark}
                  </span>
                  <div className="w-rsvp-widget__message">
                    <p className="w-rsvp-widget__greeting">{greeting}</p>
                    {intro ? <p className="w-rsvp-widget__intro">{intro}</p> : null}
                  </div>
                </div>
                <button type="button" className="w-rsvp-widget__cta" onClick={startForm}>
                  {cta}
                </button>
              </div>
            ) : (
              <div className="w-rsvp-widget__form">
                <WeddingRsvpForm editToken={editToken} onTokenChange={onTokenChange} />
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        className="w-rsvp-widget__fab"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? fabAriaClose : fabAriaOpen}
      >
        {open ? (
          <span className="w-rsvp-widget__fab-icon w-rsvp-widget__fab-icon--close" aria-hidden="true">
            ×
          </span>
        ) : (
          <span className="w-rsvp-widget__fab-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </button>
    </div>
  )
}
