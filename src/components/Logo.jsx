import { company } from '../data/config'
import './Logo.css'

export default function Logo({ variant = 'dark', showTagline = false, animated = false, className = '' }) {
  if (animated && company.logoGif) {
    return (
      <img
        src={company.logoGif}
        alt={company.name}
        className={`logo logo--full logo--animated ${className}`}
      />
    )
  }

  const src = variant === 'light' && company.logoLight ? company.logoLight : company.logoSrc

  return (
    <img
      src={src}
      alt={company.name}
      className={`logo ${showTagline ? 'logo--full' : 'logo--mark'} ${className}`}
    />
  )
}
