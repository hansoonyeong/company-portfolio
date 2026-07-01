import { chromium } from 'playwright'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const outDir = path.join(rootDir, 'public/projects/peekabrew')
const projectsPath = path.join(rootDir, 'server/data/projects.json')

const REMOTE = {
  logo: 'https://images.squarespace-cdn.com/content/v1/67c9f7aa64e2e66eb29336fc/2b6de847-a18a-43ce-91ba-a2aae0d5c7f5/playcafe_logo_white.png?format=750w',
  posts: [
    'https://images.squarespace-cdn.com/content/v1/67c9f7aa64e2e66eb29336fc/52e17726-eed0-4c4f-ac15-2eae613754b2/Ms.+Rachel+.png',
    'https://images.squarespace-cdn.com/content/v1/67c9f7aa64e2e66eb29336fc/41a2c965-c179-4a3e-8cc9-a233b02a4557/Bley+and+Bingo.png',
    'https://images.squarespace-cdn.com/content/v1/67c9f7aa64e2e66eb29336fc/9846a4e7-a84a-458b-8f60-f60d6b3851f4/Princess+Ballet+Class.png',
    'https://images.squarespace-cdn.com/content/v1/67c9f7aa64e2e66eb29336fc/eb87b273-08b9-48cf-9492-6f560656b647/Ms.+Rachel+.png',
  ],
}

const RECORD_MS = 14000
const RECORD_FPS = 30
const LOOP_HOLD_MS = 900

function scrollProgress(t) {
  if (t < 0.18) return 0
  if (t < 0.58) return (t - 0.18) / 0.4
  if (t < 0.72) return 1
  if (t < 0.9) return 1 - (t - 0.72) / 0.18
  return 0
}

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buf)
  return dest
}

async function buildFeedStrip(postPaths) {
  const width = 390
  const header = await sharp({
    create: {
      width,
      height: 120,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer()

  const resized = await Promise.all(
    postPaths.map((file) =>
      sharp(file)
        .resize(width, null, { fit: 'cover' })
        .jpeg({ quality: 88 })
        .toBuffer(),
    ),
  )

  const metas = await Promise.all(resized.map((buf) => sharp(buf).metadata()))
  let totalHeight = 120
  for (const meta of metas) totalHeight += meta.height || 0

  let y = 0
  const composites = [{ input: header, top: 0, left: 0 }]
  y += 120
  for (let i = 0; i < resized.length; i += 1) {
    composites.push({ input: resized[i], top: y, left: 0 })
    y += metas[i].height || 0
  }

  const stripPath = path.join(outDir, 'mobile-strip.jpg')
  await sharp({
    create: {
      width,
      height: totalHeight,
      channels: 3,
      background: { r: 250, g: 247, b: 242 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(stripPath)

  return { stripPath, totalHeight, viewportWidth: width }
}

async function buildAdsStrip(postPaths) {
  const width = 896
  const cardWidth = 760
  const resized = await Promise.all(
    postPaths.slice(0, 3).map((file) =>
      sharp(file)
        .resize(cardWidth, null)
        .jpeg({ quality: 88 })
        .toBuffer(),
    ),
  )
  const metas = await Promise.all(resized.map((buf) => sharp(buf).metadata()))
  const gap = 28
  let totalHeight = 48
  for (const meta of metas) totalHeight += (meta.height || 0) + gap

  let y = 48
  const composites = []
  for (let i = 0; i < resized.length; i += 1) {
    composites.push({ input: resized[i], top: y, left: Math.round((width - cardWidth) / 2) })
    y += (metas[i].height || 0) + gap
  }

  const stripPath = path.join(outDir, 'desktop-strip.jpg')
  await sharp({
    create: {
      width,
      height: totalHeight,
      channels: 3,
      background: { r: 242, g: 244, b: 247 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(stripPath)

  return { stripPath, totalHeight, viewportWidth: width }
}

function stripScrollPx(captureHeight, viewportWidth, screen, scaleWidth) {
  const displayHeight = captureHeight * (scaleWidth / viewportWidth)
  return -Math.max(0, Math.round(displayHeight - screen.height))
}

function buildShowcaseHtml(desktopScrollPx, mobileScrollPx) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Peekabrew Showcase</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 1280px; height: 720px; overflow: hidden; background: #f3ebe3; }
    .showcase { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 32px 56px 32px 48px; }
    .device-wrap { position: relative; width: 920px; height: 576px; overflow: visible; }
    .laptop { width: 100%; height: 100%; background: #111; border-radius: 20px; padding: 12px; box-shadow: 0 24px 56px rgba(0,0,0,.14); }
    .screen, .phone-screen { overflow: hidden; background: #fff; }
    .screen { width: 100%; height: 100%; border-radius: 10px; }
    .screen-scroll, .phone-scroll { transform: translate3d(0, 0, 0); backface-visibility: hidden; }
    .screen-scroll img, .phone-scroll img { width: 100%; height: auto; display: block; pointer-events: none; user-select: none; }
    .phone { position: absolute; right: -52px; bottom: -24px; width: 168px; height: 344px; background: #111; border-radius: 26px; padding: 7px; box-shadow: 0 18px 40px rgba(0,0,0,.18); z-index: 2; }
    .phone-screen { width: 100%; height: 100%; border-radius: 20px; }
  </style>
</head>
<body>
  <main class="showcase">
    <section class="device-wrap">
      <div class="laptop">
        <div class="screen">
          <div class="screen-scroll" data-scroll-max="${desktopScrollPx}">
            <img src="desktop-strip.jpg" alt="" decoding="sync" />
          </div>
        </div>
      </div>
      <div class="phone">
        <div class="phone-screen">
          <div class="phone-scroll" data-scroll-max="${mobileScrollPx}">
            <img src="mobile-strip.jpg" alt="" decoding="sync" />
          </div>
        </div>
      </div>
    </section>
  </main>
</body>
</html>`
}

async function setScrollProgress(page, progress) {
  await page.evaluate((p) => {
    document.querySelectorAll('[data-scroll-max]').forEach((el) => {
      const max = Number(el.dataset.scrollMax || 0)
      el.style.transform = `translate3d(0, ${max * p}px, 0)`
    })
  }, progress)
}

async function recordFrames(page) {
  const totalFrames = Math.round((RECORD_MS / 1000) * RECORD_FPS)
  const holdFrames = Math.round((LOOP_HOLD_MS / 1000) * RECORD_FPS)
  for (let i = 0; i < totalFrames; i += 1) {
    const t = i / Math.max(1, totalFrames - 1)
    const active = i < holdFrames || i >= totalFrames - holdFrames ? 0 : (i - holdFrames) / Math.max(1, totalFrames - holdFrames * 2)
    await setScrollProgress(page, scrollProgress(active))
    await page.waitForTimeout(1000 / RECORD_FPS)
  }
}

async function makeLogoVariants(logoPath) {
  const darkBg = path.join(outDir, 'logo-dark.jpg')
  const lightBg = path.join(outDir, 'logo-light.jpg')
  const warmBg = path.join(outDir, 'logo-warm.jpg')

  await sharp(logoPath)
    .resize(900, 420, { fit: 'contain', background: { r: 47, g: 35, b: 28 } })
    .jpeg({ quality: 90 })
    .toFile(darkBg)

  await sharp(logoPath)
    .resize(900, 420, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 90 })
    .toFile(lightBg)

  await sharp(logoPath)
    .resize(900, 420, { fit: 'contain', background: { r: 243, g: 235, b: 227 } })
    .jpeg({ quality: 90 })
    .toFile(warmBg)

  return { darkBg, lightBg, warmBg }
}

function bumpProjectTimestamp() {
  const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'))
  const idx = projects.findIndex((p) => p.id === 3)
  if (idx >= 0) {
    projects[idx].updatedAt = new Date().toISOString()
    fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2))
  }
}

fs.mkdirSync(outDir, { recursive: true })

console.log('Downloading assets…')
const logoPath = await download(REMOTE.logo, path.join(outDir, 'logo-source.png'))
const postPaths = []
for (let i = 0; i < REMOTE.posts.length; i += 1) {
  postPaths.push(await download(REMOTE.posts[i], path.join(outDir, `post-${i + 1}.png`)))
}

console.log('Building strips…')
const mobile = await buildFeedStrip(postPaths)
const desktop = await buildAdsStrip(postPaths)

const LAPTOP_SCREEN = { width: 896, height: 552 }
const PHONE_SCREEN = { width: 154, height: 330 }
const desktopScrollPx = stripScrollPx(desktop.totalHeight, desktop.viewportWidth, LAPTOP_SCREEN, LAPTOP_SCREEN.width)
const mobileScrollPx = stripScrollPx(mobile.totalHeight, mobile.viewportWidth, PHONE_SCREEN, PHONE_SCREEN.width)

fs.writeFileSync(path.join(outDir, 'showcase.html'), buildShowcaseHtml(desktopScrollPx, mobileScrollPx))

console.log('Logo variants…')
const logos = await makeLogoVariants(logoPath)
await sharp(postPaths[0]).resize(1400, null).jpeg({ quality: 90 }).toFile(path.join(outDir, 'campaign-main.jpg'))
await sharp(postPaths[1]).resize(900, null).jpeg({ quality: 90 }).toFile(path.join(outDir, 'thumb.jpg'))

console.log('Recording hero…')
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
})
const page = await context.newPage()
const htmlPath = path.join(outDir, 'showcase.html')
await page.goto(`file://${htmlPath}`)
await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalHeight > 0))
await setScrollProgress(page, 0)
await page.waitForTimeout(700)
await page.screenshot({ path: path.join(outDir, 'hero-poster.jpg'), type: 'jpeg', quality: 88 })
await setScrollProgress(page, 0)
await page.waitForTimeout(200)
await recordFrames(page)
await context.close()
await browser.close()

const webmFile = fs
  .readdirSync(outDir)
  .filter((name) => name.endsWith('.webm'))
  .sort((a, b) => fs.statSync(path.join(outDir, b)).mtimeMs - fs.statSync(path.join(outDir, a)).mtimeMs)[0]

if (webmFile) {
  fs.renameSync(path.join(outDir, webmFile), path.join(outDir, 'hero.webm'))
  console.log('Saved hero.webm')
}

bumpProjectTimestamp()
console.log('Done.', logos)

const distDir = path.join(rootDir, 'dist/projects/peekabrew')
if (fs.existsSync(path.join(rootDir, 'dist'))) {
  fs.mkdirSync(distDir, { recursive: true })
  for (const name of fs.readdirSync(outDir)) {
    fs.copyFileSync(path.join(outDir, name), path.join(distDir, name))
  }
  console.log('Synced assets → dist/projects/peekabrew/')
}
