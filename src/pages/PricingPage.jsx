import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import SubPageLayout from '../components/SubPageLayout'
import Pricing from '../components/Pricing'

export default function PricingPage() {
  const { t } = useTranslation()

  return (
    <SubPageLayout backLabel={t.servicesPage.back}>
      <Pricing />
    </SubPageLayout>
  )
}
