import { useTranslation } from '../i18n/LanguageContext'
import SubPageLayout from '../components/SubPageLayout'
import About from '../components/About'

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <SubPageLayout backLabel={t.aboutPage.back}>
      <About full />
    </SubPageLayout>
  )
}
