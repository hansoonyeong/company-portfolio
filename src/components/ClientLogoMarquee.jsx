import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getProjectPath } from '../lib/projects'
import './ClientLogoMarquee.css'

function ClientLogoItem({ client }) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(client.logo) && !failed

  return (
    <Link
      to={getProjectPath(client)}
      className={`client-marquee__link${client.logoStyle?.maxWidth ? ' client-marquee__link--wide' : ''}`}
      aria-label={client.name}
      style={{
        '--logo-scale': client.logoScale ?? 1,
        ...(client.logoStyle?.maxWidth ? { '--logo-max-w': client.logoStyle.maxWidth } : {}),
        ...(client.logoStyle?.maxHeight ? { '--logo-max-h': client.logoStyle.maxHeight } : {}),
      }}
    >
      {showImage ? (
        <img
          src={client.logo}
          alt=""
          className="client-marquee__logo"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="client-marquee__fallback">{client.name}</span>
      )}
    </Link>
  )
}

export default function ClientLogoMarquee({ clients }) {
  if (!clients.length) return null

  const loop = [...clients, ...clients, ...clients]

  return (
    <div className="client-marquee" aria-hidden={false}>
      <div className="client-marquee__viewport">
        <ul className="client-marquee__track">
          {loop.map((client, index) => (
            <li key={`${client.name}-${index}`} className="client-marquee__item">
              <ClientLogoItem client={client} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
