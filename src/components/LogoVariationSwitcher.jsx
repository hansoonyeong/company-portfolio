import { useState } from 'react'
import { LOGO_VARIANT_BACKGROUNDS, withAssetVersion } from '../lib/imageSeo'
import './LogoVariationSwitcher.css'

const FADE_MS = 300

function getBackground(variation) {
  if (variation.background) return variation.background
  return LOGO_VARIANT_BACKGROUNDS[variation.variant] || LOGO_VARIANT_BACKGROUNDS.light
}

function getSwatchStyle(variation) {
  if (variation.swatchColor) {
    return { background: variation.swatchColor }
  }

  if (variation.variant === 'dark') {
    return { background: '#1a1214' }
  }

  if (variation.variant === 'accent') {
    return { background: 'var(--case-accent, #7a1115)' }
  }

  return { background: '#f3f3f3' }
}

export default function LogoVariationSwitcher({
  variations,
  onImageClick,
  assetVersion = '',
  className = '',
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  if (!variations?.length) return null

  const active = variations[activeIndex] ?? variations[0]

  const selectVariation = (index) => {
    if (index === activeIndex) return

    setVisible(false)
    window.setTimeout(() => {
      setActiveIndex(index)
      setVisible(true)
    }, FADE_MS)
  }

  const preview = (
    <img
      src={withAssetVersion(active.image, assetVersion)}
      alt={active.alt}
      className={`logo-switcher__image ${visible ? 'logo-switcher__image--visible' : ''}`}
      loading="lazy"
      decoding="async"
    />
  )

  return (
    <div className={`logo-switcher ${className}`.trim()}>
      <div
        className="logo-switcher__preview"
        style={{ background: getBackground(active) }}
      >
        {onImageClick ? (
          <button
            type="button"
            className="logo-switcher__preview-btn"
            onClick={() => onImageClick(active.image)}
            aria-label={active.alt}
          >
            {preview}
          </button>
        ) : (
          preview
        )}
        <p className="logo-switcher__active-label">{active.label}</p>
      </div>

      <div className="logo-switcher__swatches" role="tablist" aria-label="Logo variations">
        {variations.map((variation, index) => {
          const selected = index === activeIndex
          return (
            <button
              key={variation.id || variation.label}
              type="button"
              role="tab"
              className={`logo-switcher__swatch ${selected ? 'logo-switcher__swatch--active' : ''}`}
              aria-selected={selected}
              aria-label={variation.label}
              onClick={() => selectVariation(index)}
            >
              <span className="logo-switcher__swatch-ring" aria-hidden="true">
                <span className="logo-switcher__swatch-core" style={getSwatchStyle(variation)} />
              </span>
              <span className="logo-switcher__swatch-label">{variation.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
