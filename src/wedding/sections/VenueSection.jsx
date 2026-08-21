import { weddingConfig } from '../config/weddingConfig.js'
import { weddingImages } from '../config/weddingImages.js'
import LookbookFrame from '../components/LookbookFrame.jsx'
import Reveal from '../components/Reveal.jsx'

export default function VenueSection() {
  return (
    <section className="w-venue" id="place">
      <Reveal className="w-copy">
        <p className="w-eyebrow">The place</p>
        <h2 className="w-display">{weddingConfig.venue.englishName}</h2>
        <p className="w-caption">
          {weddingConfig.venue.addressEn} · {weddingConfig.dateDisplay.en}
        </p>
        <p className="w-body">{weddingConfig.venue.description.ko}</p>
      </Reveal>
      <div className="w-lookbook">
        {weddingImages.venue.map((image, index) => (
          <LookbookFrame
            key={image.src}
            image={image}
            ratio={index === 0 ? '5 / 4' : '3 / 4'}
          />
        ))}
      </div>
    </section>
  )
}
