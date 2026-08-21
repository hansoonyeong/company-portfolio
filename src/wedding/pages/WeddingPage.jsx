import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { applyPageSeo } from '../../lib/seo.js'
import { weddingConfig } from '../config/weddingConfig.js'
import WeddingMusic from '../components/WeddingMusic.jsx'
import WeddingNav from '../components/WeddingNav.jsx'
import WeddingRsvpWidget from '../components/WeddingRsvpWidget.jsx'
import AfterPartySection from '../sections/AfterPartySection.jsx'
import GallerySection from '../sections/GallerySection.jsx'
import InvitationSection from '../sections/InvitationSection.jsx'
import LocationSection from '../sections/LocationSection.jsx'
import RSVPSection from '../sections/RSVPSection.jsx'
import StorySection from '../sections/StorySection.jsx'
import VenueSection from '../sections/VenueSection.jsx'
import WeddingFooter from '../sections/WeddingFooter.jsx'
import WeddingHero from '../sections/WeddingHero.jsx'
import WeddingInfoSection from '../sections/WeddingInfoSection.jsx'

export default function WeddingPage() {
  const [params, setParams] = useSearchParams()
  const editToken = params.get('rsvp') || ''
  const [rsvpOpen, setRsvpOpen] = useState(Boolean(editToken))

  const seo = useMemo(
    () => ({
      title: weddingConfig.og.title,
      description: weddingConfig.og.description,
      path: '/wedding',
      image: weddingConfig.og.image,
      noindex: true,
    }),
    [],
  )

  useEffect(() => {
    applyPageSeo(seo)
  }, [seo])

  useEffect(() => {
    if (editToken) setRsvpOpen(true)
  }, [editToken])

  const handleTokenChange = (token) => {
    setParams({ rsvp: token }, { replace: true })
  }

  const openRsvp = () => setRsvpOpen(true)

  return (
    <div className="wedding-page">
      <a className="visually-hidden" href="#rsvp">
        Skip to RSVP
      </a>
      <WeddingNav overlay onRsvpClick={openRsvp} />
      <WeddingHero />
      <InvitationSection />
      <StorySection />
      <VenueSection />
      <WeddingInfoSection />
      <GallerySection />
      <LocationSection />
      <AfterPartySection />
      <RSVPSection onOpenRsvp={openRsvp} />
      <WeddingFooter />
      <WeddingMusic />
      <WeddingRsvpWidget
        open={rsvpOpen}
        onOpenChange={setRsvpOpen}
        editToken={editToken}
        onTokenChange={handleTokenChange}
      />
    </div>
  )
}
