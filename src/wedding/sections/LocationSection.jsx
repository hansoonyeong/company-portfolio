import { weddingConfig } from '../config/weddingConfig.js'
import Reveal from '../components/Reveal.jsx'

export default function LocationSection() {
  return (
    <section className="w-location" id="location">
      <Reveal className="w-copy">
        <p className="w-eyebrow">Location</p>
        <h2 className="w-display w-display--sm">Ceremony & lunch</h2>
        <p className="w-body">
          {weddingConfig.venue.englishName}에서 {weddingConfig.meal.venue}까지, 같은 골목의 다음 문입니다.
        </p>
      </Reveal>

      <div className="w-route" aria-label="미지의와 도동산방 위치">
        <div className="w-route__item">
          <strong>MIGIUI</strong>
          <em>Ceremony</em>
        </div>
        <p className="w-route__walk">1 min walk</p>
        <div className="w-route__item">
          <strong>{weddingConfig.meal.venueEn}</strong>
          <em>{weddingConfig.meal.venue} · Lunch</em>
        </div>
      </div>

      <div className="w-map-links">
        {weddingConfig.maps.naver ? (
          <a className="wedding-btn" href={weddingConfig.maps.naver} target="_blank" rel="noreferrer">
            Naver map
          </a>
        ) : (
          <span className="wedding-btn is-muted">Naver map</span>
        )}
        {weddingConfig.maps.kakao ? (
          <a className="wedding-btn" href={weddingConfig.maps.kakao} target="_blank" rel="noreferrer">
            Kakao map
          </a>
        ) : (
          <span className="wedding-btn is-muted">Kakao map</span>
        )}
      </div>
    </section>
  )
}
