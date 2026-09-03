import { useWeddingMusic } from '../context/WeddingMusicContext.jsx'

export default function WeddingMusic() {
  const { playing, ready, toggle, hasMusic } = useWeddingMusic()

  if (!hasMusic) return null

  return (
    <div className="w-music">
      <button
        type="button"
        className={`w-music__fab${playing ? ' is-playing' : ''}`}
        onClick={toggle}
        disabled={!ready && !playing}
        aria-label={playing ? '음악 일시정지' : '음악 재생'}
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
