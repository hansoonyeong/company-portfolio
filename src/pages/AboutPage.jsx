import { useTranslation } from '../i18n/LanguageContext'
import SubPageLayout from '../components/SubPageLayout'
import StudioIntro from '../components/StudioIntro'
import Capabilities from '../components/Capabilities'
import Process from '../components/Process'
import ClientsBand from '../components/ClientsBand'
import Testimonials from '../components/Testimonials'
import HomeCta from '../components/HomeCta'

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <SubPageLayout backLabel={t.aboutPage.back}>
      <StudioIntro showPageHeading />
      <Capabilities />
      <Process />
      <ClientsBand />
      <Testimonials />
      <HomeCta />
    </SubPageLayout>
  )
}
