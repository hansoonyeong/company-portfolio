import { weddingConfig } from '../config/weddingConfig.js'
import Reveal from '../components/Reveal.jsx'

export default function WeddingInfoSection() {
  return (
    <section className="w-day" id="day">
      <Reveal className="w-copy">
        <p className="w-eyebrow">Wedding day</p>
        <h2 className="w-display">{weddingConfig.dateDisplay.en}</h2>
        <p className="w-caption">{weddingConfig.dateDisplay.weekday}</p>

        <dl className="w-day__facts">
          <div>
            <dt>Ceremony</dt>
            <dd>{weddingConfig.ceremonyTime || weddingConfig.ceremonyTimeDisplay}</dd>
          </div>
          <div>
            <dt>Place</dt>
            <dd>
              {weddingConfig.venue.englishName}
              <span>{weddingConfig.location.city}</span>
            </dd>
          </div>
        </dl>

        <div className="w-day__note">
          <h3>{weddingConfig.seating.label}</h3>
          <p className="w-body">{weddingConfig.seating.description.ko}</p>
        </div>
      </Reveal>
    </section>
  )
}
