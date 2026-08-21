import Reveal from '../components/Reveal.jsx'

export default function RSVPSection({ onOpenRsvp }) {
  return (
    <section className="w-rsvp" id="rsvp">
      <Reveal className="w-copy w-rsvp__intro">
        <p className="w-eyebrow">RSVP</p>
        <h2 className="w-display">Will you be there?</h2>
        <p className="w-caption">We’d love to have you with us.</p>
      </Reveal>
      <div className="w-rsvp__action">
        <button type="button" className="wedding-btn wedding-btn--fill w-rsvp__start" onClick={onOpenRsvp}>
          RSVP
        </button>
      </div>
    </section>
  )
}
