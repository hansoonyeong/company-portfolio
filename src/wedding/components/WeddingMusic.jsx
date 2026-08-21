import { useEffect, useRef, useState } from 'react'

import { weddingConfig } from '../config/weddingConfig.js'

export default function WeddingMusic() {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const music = weddingConfig.music

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !music?.src) return undefined

    audio.volume = music.volume ?? 0.4
    audio.loop = music.loop !== false

    const onCanPlay = () => setReady(true)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false)

    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [music?.src, music?.volume, music?.loop])

  if (!music?.src) return null

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (audio.paused) {
        await audio.play()
      } else {
        audio.pause()
      }
    } catch {
      setPlaying(false)
    }
  }

  return (
    <div className="w-music">
      <audio ref={audioRef} src={music.src} preload="metadata" playsInline />
      <button
        type="button"
        className={`w-music__fab${playing ? ' is-playing' : ''}`}
        onClick={toggle}
        disabled={!ready && !playing}
        aria-label={playing ? '음악 일시정지' : '음악 재생'}
        title={music.title || (playing ? 'Pause' : 'Play')}
      >
        {playing ? (
          <span className="w-music__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </span>
        ) : (
          <span className="w-music__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.5v13l11-6.5L8 5.5z" />
            </svg>
          </span>
        )}
      </button>
    </div>
  )
}
