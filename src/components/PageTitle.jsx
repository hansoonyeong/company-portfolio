import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { applyPageSeo } from '../lib/seo.js'
import { company } from '../data/config.js'

export default function PageTitle({ page = 'meta' }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  useEffect(() => {
    document.documentElement.lang = t.meta.lang

    const pageMeta = page === 'meta' ? t.meta : (t[page]?.meta ?? t.meta)
    const title = pageMeta.title ?? t.meta.title
    const description = pageMeta.description ?? t.meta.description

    applyPageSeo({
      title,
      description,
      path: pathname,
      image: company.logoSrc,
    })
  }, [t, page, pathname])

  return null
}
