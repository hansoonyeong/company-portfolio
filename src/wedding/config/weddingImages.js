/**
 * 웨딩 페이지 이미지 — 여기만 바꾸면 됩니다.
 * placeholder는 같은 톤(sat/con) + 같은 룩북 비율로 통일했습니다.
 */
const TONE = '&sat=-35&con=-8&brightness=4'

const unsplash = (id, extra = '') =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=75${TONE}${extra}`

function photo(id, alt, { w = 1400, h, ratio = 3 / 4 } = {}) {
  const height = h || Math.round(w * ratio)
  const srcFor = (width) => {
    const hAt = Math.round(width * (height / w))
    return unsplash(id, `&w=${width}&h=${hAt}`)
  }

  return {
    src: srcFor(w),
    srcSet: [640, 1080, 1600].map((width) => `${srcFor(width)} ${width}w`).join(', '),
    alt,
    ratio: `${Math.round(ratio * 1000) / 1000}`,
  }
}

/** 같은 wedding editorial 톤 — minimal couple / wedding */
const couple = {
  a: photo('photo-1519741497674-611481863552', 'Couple walking', { w: 1400, ratio: 3 / 4 }),
  b: photo('photo-1522673607200-164d1b6ce486', 'Couple portrait', { w: 1400, ratio: 3 / 4 }),
  c: photo('photo-1465495976277-4387d4b0b4c6', 'Bride portrait', { w: 1400, ratio: 3 / 4 }),
  d: photo('photo-1583939003579-730e3918a45a', 'Wedding detail', { w: 1400, ratio: 3 / 4 }),
}

/** Sydney — cool grey-blue, same processing */
const sydney = {
  a: photo('photo-1506973035872-a4ec16b8e8d9', 'Sydney Opera House', { w: 1600, ratio: 5 / 4 }),
  b: photo('photo-1528072164453-f4e8ef0d475a', 'Sydney Harbour', { w: 1400, ratio: 3 / 4 }),
}

/** Architecture — white concrete interior/exterior */
const architecture = {
  a: photo('photo-1600585154340-be6161a56a0c', 'MIGIUI exterior', { w: 1600, ratio: 5 / 4 }),
  b: photo('photo-1600607687939-ce8a6c25118c', 'Interior light', { w: 1400, ratio: 3 / 4 }),
}

export const weddingImages = {
  /** 메인 히어로 — 순서대로 크로스페이드 */
  hero: [couple.a, couple.b, couple.c, couple.d],
  cover: couple.a,
  invitation: couple.b,
  story: [sydney.a, sydney.b],
  venue: [architecture.a, architecture.b],
  gallery: [couple.c, couple.d, couple.b],
  afterParty: photo('photo-1470337458703-46ad1756a187', 'Champagne', { w: 1600, ratio: 5 / 4 }),
  ending: couple.b,
  doodles: {
    mark: '/wedding/doodles/mark.svg',
    line: '/wedding/doodles/line.svg',
    welssi: '/wedding/doodles/welssi.svg',
    caessi: '/wedding/doodles/caessi.svg',
  },
  og: '/wedding/og/og.svg',
}
