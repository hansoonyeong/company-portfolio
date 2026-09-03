import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { applyPageSeo } from '../../lib/seo.js'
import { weddingConfig } from '../config/weddingConfig.js'
import WeddingEntryGate, { getWeddingEntered } from '../components/WeddingEntryGate.jsx'
import WeddingMusic from '../components/WeddingMusic.jsx'
import WeddingNav from '../components/WeddingNav.jsx'
import WeddingRsvpWidget from '../components/WeddingRsvpWidget.jsx'
import { WeddingMusicProvider } from '../context/WeddingMusicContext.jsx'
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

function WeddingPageContent() {
  const [params, setParams] = useSearchParams()
  const editToken = params.get('rsvp') || ''
  const [rsvpOpen, setRsvpOpen] = useState(Boolean(editToken))
  const [entered, setEntered] = useState(() => getWeddingEntered() || Boolean(editToken))

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
    if (editToken) {
      setRsvpOpen(true)
      setEntered(true)
    }
  }, [editToken])

  const handleTokenChange = (token) => {
    setParams({ rsvp: token }, { replace: true })
  }

  const openRsvp = () => setRsvpOpen(true)

  return (
    <>
      {!entered ? <WeddingEntryGate onEnter={() => setEntered(true)} /> : null}
      <div className={`wedding-page${entered ? ' is-entered' : ''}`}>
        <a className="visually-hidden" href="#rsvp">
          Skip to RSVP
        </a>
        {entered ? <WeddingNav onRsvpClick={openRsvp} /> : null}
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
        {entered ? <WeddingMusic /> : null}
        <WeddingRsvpWidget
          open={rsvpOpen}
          onOpenChange={setRsvpOpen}
          editToken={editToken}
          onTokenChange={handleTokenChange}
        />
      </div>
    </>
  )
}

export default function WeddingPage() {
  return (
    <WeddingMusicProvider>
      <WeddingPageContent />
    </WeddingMusicProvider>
  )
}
