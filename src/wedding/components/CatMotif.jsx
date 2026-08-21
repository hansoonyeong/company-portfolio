import { weddingConfig } from '../config/weddingConfig.js'
import { weddingImages } from '../config/weddingImages.js'

export default function CatMotif({ who = 'welssi', className = '' }) {
  const cat = weddingConfig.cats[who]
  const src = weddingImages.doodles[who]
  if (!cat || !src) return null

  return (
    <figure className={`w-cat ${className}`.trim()}>
      <img src={src} alt="" />
      <figcaption>
        {cat.name}
        <span>{cat.description}</span>
      </figcaption>
    </figure>
  )
}
