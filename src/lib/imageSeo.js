export function buildProjectImageAlt({ title, subtitle, tag, section, index }) {
  const parts = [title, subtitle || tag, section].filter(Boolean)
  if (typeof index === 'number') {
    parts.push(String(index + 1))
  }
  return parts.join(' — ')
}

export function withAssetVersion(path, assetVersion) {
  if (!path || !assetVersion) return path
  return `${path}?v=${encodeURIComponent(assetVersion)}`
}

export const LOGO_VARIANT_BACKGROUNDS = {
  dark: '#1a1214',
  light: '#fafafa',
  accent: 'linear-gradient(135deg, var(--case-accent, #111) 0%, #2a0c0d 100%)',
}

export function isLogoVariationSection(logo) {
  const cells = logo?.cells ?? []
  if (cells.length < 2) return false
  if (String(logo?.label || '').toLowerCase() !== 'logo') return false
  return cells.every((cell) => cell.image && !cell.video)
}
