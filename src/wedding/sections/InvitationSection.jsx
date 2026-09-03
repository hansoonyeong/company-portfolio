import { weddingConfig } from '../config/weddingConfig.js'
import { weddingImages } from '../config/weddingImages.js'
import LookbookFrame from '../components/LookbookFrame.jsx'
import Reveal from '../components/Reveal.jsx'

export default function InvitationSection() {
  return (
    <section className="w-invite" id="about">
      <Reveal className="w-copy">
        <p className="w-eyebrow">Invitation</p>
        <blockquote className="w-pullquote">{weddingConfig.invitation.headline.ko}</blockquote>
        <p className="w-body">{weddingConfig.invitation.body.ko}</p>
      </Reveal>
      <LookbookFrame image={weddingImages.invitation} ratio="3 / 4" />
    </section>
  )
}
