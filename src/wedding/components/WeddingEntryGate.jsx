import { useState } from 'react'
import { weddingConfig } from '../config/weddingConfig.js'
import { weddingImages } from '../config/weddingImages.js'
import { useWeddingMusic } from '../context/WeddingMusicContext.jsx'

const STORAGE_KEY = 'wedding-entered'

export function getWeddingEntered() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setWeddingEntered() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // ignore
  }
}

export default function WeddingEntryGate({ onEnter }) {
  const { play, hasMusic } = useWeddingMusic()
  const [leaving, setLeaving] = useState(false)
  const entry = weddingConfig.entry

  const handleEnter = async (withSound) => {
    if (leaving) return
    setLeaving(true)
    if (withSound && hasMusic) await play()
    setWeddingEntered()
    window.setTimeout(() => onEnter?.(), 480)
  }

  return (
    <div className={`w-entry${leaving ? ' is-leaving' : ''}`} role="dialog" aria-label="Welcome">
      <div className="w-entry__inner">
        <img className="w-entry__mark" src={weddingImages.doodles.mark} alt="" width={56} height={56} />
        <p className="w-entry__welcome">{entry.welcome}</p>
        <div className="w-entry__actions">
          {hasMusic ? (
            <button type="button" className="w-entry__btn w-entry__btn--primary" onClick={() => handleEnter(true)}>
              {entry.withSound}
            </button>
          ) : null}
          <button
            type="button"
            className={`w-entry__btn${hasMusic ? ' w-entry__btn--ghost' : ' w-entry__btn--primary'}`}
            onClick={() => handleEnter(false)}
          >
            {hasMusic ? entry.withoutSound : entry.enter}
          </button>
        </div>
      </div>
    </div>
  )
}
