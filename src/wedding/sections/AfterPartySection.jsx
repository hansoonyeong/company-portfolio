import { weddingConfig } from '../config/weddingConfig.js'
import { weddingImages } from '../config/weddingImages.js'
import LookbookFrame from '../components/LookbookFrame.jsx'
import Reveal from '../components/Reveal.jsx'

export default function AfterPartySection() {
  return (
    <section className="w-after" id="after-party">
      <Reveal className="w-copy">
        <p className="w-eyebrow">After party</p>
        <h2 className="w-display">{weddingConfig.afterParty.title}</h2>
        <p className="w-body">{weddingConfig.afterParty.description.ko}</p>
        <p className="w-caption">{weddingConfig.afterParty.tags}</p>
      </Reveal>
      <LookbookFrame image={weddingImages.afterParty} ratio="5 / 4" />
    </section>
  )
}
