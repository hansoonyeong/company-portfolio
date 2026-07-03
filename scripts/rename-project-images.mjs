import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const publicRoot = path.join(root, 'public')

const RENAMES = [
  ['/projects/kimchi-house-au/1782856260445--.jpg', '/projects/kimchi-house-au/kimchi-house-au-branding.jpg'],
  ['/projects/choi-co/1782861097244-d.jpg', '/projects/choi-co/choi-co-group-primary-logo.jpg'],
  ['/projects/peekabrew/1782865427474-43.jpg', '/projects/peekabrew/peekabrew-brand-campaign.jpg'],
  ['/projects/bornga/1782848100445--2026-07-01-5.34.37.png', '/projects/bornga/bornga-menu-spread-1.png'],
  ['/projects/bornga/1782848155060--2026-07-01-5.30.51.png', '/projects/bornga/bornga-menu-spread-2.png'],
  ['/projects/gmgp-kiosk/1782843539167--2026-07-01-4.17.19.png', '/projects/gmgp-kiosk/gmgp-kiosk-pamphlet-cover.png'],
  ['/projects/gmgp-kiosk/1782843107772--2026-06-30-4.22.51.png', '/projects/gmgp-kiosk/gmgp-kiosk-pamphlet-spread-1.png'],
  ['/projects/gmgp-kiosk/1782843539171--2026-07-01-4.17.40.png', '/projects/gmgp-kiosk/gmgp-kiosk-pamphlet-spread-2.png'],
  ['/projects/gmgp-kiosk/1782843539176--2026-07-01-4.17.51.png', '/projects/gmgp-kiosk/gmgp-kiosk-pamphlet-spread-3.png'],
  ['/projects/bornga-gift-voucher/1782844213255--2026-07-01-4.29.02.png', '/projects/bornga-gift-voucher/bornga-gift-voucher-front.png'],
  ['/projects/bornga-gift-voucher/1782844213262--2026-07-01-4.28.21.png', '/projects/bornga-gift-voucher/bornga-gift-voucher-detail-1.png'],
  ['/projects/bornga-gift-voucher/1782844213266--2026-07-01-4.28.40.png', '/projects/bornga-gift-voucher/bornga-gift-voucher-detail-2.png'],
  ...Array.from({ length: 17 }, (_, index) => {
    const num = String(index + 1).padStart(2, '0')
    return [
      `/projects/dos-taekwondo/${num}.jpg`,
      `/projects/dos-taekwondo/dos-taekwondo-tournament-${num}.jpg`,
    ]
  }),
]

function toDisk(webPath) {
  return path.join(publicRoot, webPath.replace(/^\/projects\//, 'projects/'))
}

for (const [from, to] of RENAMES) {
  const source = toDisk(from)
  const target = toDisk(to)
  if (!fs.existsSync(source)) {
    console.warn(`[skip] missing source: ${from}`)
    continue
  }
  fs.mkdirSync(path.dirname(target), { recursive: true })
  if (fs.existsSync(target)) {
    console.warn(`[skip] target exists: ${to}`)
    continue
  }
  fs.renameSync(source, target)
  console.log(`[rename] ${from} -> ${to}`)
}

const jsonFiles = [
  path.join(root, 'server/data/projects.json'),
  path.join(root, 'server/data-seed/projects.json'),
]

for (const file of jsonFiles) {
  let raw = fs.readFileSync(file, 'utf-8')
  for (const [from, to] of RENAMES) {
    raw = raw.split(from).join(to)
  }
  fs.writeFileSync(file, raw)
  console.log(`[json] updated ${path.relative(root, file)}`)
}
