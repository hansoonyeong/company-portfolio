import { useEffect } from 'react'
import { applyPageSeo } from './seo.js'

export function usePageSeo(seo) {
  useEffect(() => {
    if (!seo) return
    applyPageSeo(seo)
  }, [seo])
}
