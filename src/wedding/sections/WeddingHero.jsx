import { weddingConfig } from '../config/weddingConfig.js'
import { weddingImages } from '../config/weddingImages.js'
import HeroSlideshow from '../components/HeroSlideshow.jsx'

export default function WeddingHero() {
  const { groom, bride } = weddingConfig.couple
  const { en, weekday } = weddingConfig.dateDisplay

  return (
    <section className="w-hero" id="top" aria-label="Cover">
      <HeroSlideshow images={weddingImages.hero} ratio="3 / 4" />
      <div className="w-copy w-copy--hero">
        <h1 className="w-hero__title">
          {groom} & {bride}
        </h1>
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
