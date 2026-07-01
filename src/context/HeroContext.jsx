import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildDefaultHero } from '../data/defaultHero'
import { fetchHero } from '../lib/api'
import { localizeHero } from '../lib/hero'
import { useTranslation } from '../i18n/LanguageContext'

const HeroContext = createContext(null)

export function HeroProvider({ children }) {
  const { lang } = useTranslation()
  const [rawHero, setRawHero] = useState(buildDefaultHero)
  const [loading, setLoading] = useState(true)

  const loadHero = useCallback(async () => {
    try {
      const data = await fetchHero()
      if (data && Array.isArray(data.images)) {
        setRawHero(data)
      }
    } catch {
      setRawHero(buildDefaultHero())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHero()
  }, [loadHero])

  const hero = useMemo(() => localizeHero(rawHero, lang), [rawHero, lang])

  const value = useMemo(
    () => ({
      hero,
      rawHero,
      loading,
      refreshHero: loadHero,
      setRawHero,
    }),
    [hero, rawHero, loading, loadHero],
  )

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>
}

export function useHero() {
  const ctx = useContext(HeroContext)
  if (!ctx) throw new Error('useHero must be used within HeroProvider')
  return ctx
}
