import { useTranslation } from '../i18n/LanguageContext'
import SubPageLayout from '../components/SubPageLayout'
import News from '../components/News'

export default function NewsPage() {
  const { t } = useTranslation()

  return (
    <SubPageLayout backLabel={t.newsPage.back}>
      <News full />
    </SubPageLayout>
  )
}
