import { weddingConfig } from '../config/weddingConfig.js'
import { weddingImages } from '../config/weddingImages.js'
import HighlightText from '../components/HighlightText.jsx'
import HeroSlideshow from '../components/HeroSlideshow.jsx'
import Reveal from '../components/Reveal.jsx'

export default function WeddingHero() {
  const { groom, bride } = weddingConfig.couple
  const { en, weekday } = weddingConfig.dateDisplay

  return (
    <section className="w-hero" id="top" aria-label="Cover">
      <div className="w-hero__visual">
        <HeroSlideshow images={weddingImages.hero} ratio="3 / 4" />
        <div className="w-hero__overlay">
          <Reveal className="w-hero__overlay-inner">
            <h1 className="w-hero__headline">
              <HighlightText
                segments={[
                  { text: groom, tone: 'dark' },
                  { text: ' & ', tone: 'none' },
                  { text: bride, tone: 'blue' },
                  { text: ' — ', tone: 'none' },
                  { text: 'beginning a new chapter', tone: 'blue' },
                  { text: ' together', tone: 'none' },
                ]}
              />
            </h1>
          </Reveal>
        </div>
      </div>
      <div className="w-copy w-copy--hero">
        <p className="w-hero__meta">
          <span>{en}</span>
          <span>{weekday}</span>
          <span>
            {weddingConfig.venue.englishName}, {weddingConfig.location.city}
          </span>
        </p>
      </div>
    </section>
  )
}
