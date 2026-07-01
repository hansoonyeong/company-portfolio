import { useEffect } from 'react'
import { useTranslation } from '../i18n/LanguageContext'

export default function PageTitle({ page = 'meta' }) {
  const { t } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = t.meta.lang
    const title = page === 'meta' ? t.meta.title : (t[page]?.meta?.title ?? t.meta.title)
    document.title = title
  }, [t, page])

  return null
}
