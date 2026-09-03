import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { weddingConfig } from '../config/weddingConfig.js'

const WeddingMusicContext = createContext(null)

export function WeddingMusicProvider({ children }) {
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

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return false
    try {
      await audio.play()
      return true
    } catch {
      setPlaying(false)
      return false
    }
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) await play()
    else pause()
  }, [play, pause])

  return (
    <WeddingMusicContext.Provider value={{ playing, ready, play, pause, toggle, hasMusic: Boolean(music?.src) }}>
      {music?.src ? (
        <audio ref={audioRef} src={music.src} preload="metadata" playsInline />
      ) : null}
      {children}
    </WeddingMusicContext.Provider>
  )
}

export function useWeddingMusic() {
  const ctx = useContext(WeddingMusicContext)
  if (!ctx) throw new Error('useWeddingMusic must be used within WeddingMusicProvider')
  return ctx
}
