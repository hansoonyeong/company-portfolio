import { chromium } from 'playwright'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const outDir = path.join(rootDir, 'public/projects/kimchi-house-au')
const projectsPath = path.join(rootDir, 'server/data/projects.json')
const orderUrl = 'https://kimchihouse-order.vercel.app/order.html'

const DESKTOP = { width: 1280, height: 800 }
const MOBILE = { width: 390, height: 835 }

const LAPTOP_SCREEN = { width: 896, height: 552 }
const PHONE_SCREEN = { width: 154, height: 330 }

const CROP_PADDING = 40
const RECORD_MS = 14000
const RECORD_FPS = 30
const LOOP_HOLD_MS = 900

function stripScrollPx(captureHeight, viewportWidth, screen, scaleWidth) {
  const displayHeight = captureHeight * (scaleWidth / viewportWidth)
  return -Math.max(0, Math.round(displayHeight - screen.height))
}

function scrollProgress(t) {
  if (t < 0.18) return 0
  if (t < 0.58) return (t - 0.18) / 0.4
  if (t < 0.72) return 1
  if (t < 0.9) return 1 - (t - 0.72) / 0.18
  return 0
}

async function injectCaptureStyles(page) {
  await page.addStyleTag({
    content: `
      .catalog-tabs,
      .checkout-stack {
        position: static !important;
        top: auto !important;
      }
      .sumbar {
        display: none !important;
      }
    `,
  })
}

async function preparePage(page) {
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const step = Math.max(window.innerHeight * 0.75, 400)
    const max = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)

    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y)
      await wait(250)
    }

    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(600)
}

async function findBestsellerCropHeight(page) {
  return page.evaluate((padding) => {
    const scrollHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
    )
    const titles = [...document.querySelectorAll('h3.section-title')]
    const bestIdx = titles.findIndex((title) => title.textContent.includes('베스트셀러'))

    if (bestIdx === -1) {
      return Math.min(scrollHeight, Math.round(window.innerHeight * 2.8))
    }

    const best = titles[bestIdx]
    const next = titles[bestIdx + 1]
    let bottom = best.getBoundingClientRect().bottom + window.scrollY

    let el = best.nextElementSibling
    while (el && el !== next) {
      const rect = el.getBoundingClientRect()
      if (rect.height > 0) {
        bottom = Math.max(bottom, rect.bottom + window.scrollY)
      }
      el = el.nextElementSibling
    }

    const padded = Math.ceil(bottom + padding)
    const nextTop = next
      ? next.getBoundingClientRect().top + window.scrollY - 8
      : padded

    return Math.min(scrollHeight, Math.min(padded, nextTop))
  }, CROP_PADDING)
}

async function captureVerticalStrip(page, viewportWidth, viewportHeight, totalHeight, outPath) {
  const cropPx = Math.round(totalHeight)
  const chunks = []

  for (let scrollY = 0; scrollY < cropPx; scrollY += viewportHeight) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY)
    await page.waitForTimeout(280)

    const chunkHeight = Math.min(viewportHeight, cropPx - scrollY)
    chunks.push(
      await page.screenshot({
        type: 'jpeg',
        quality: 88,
        clip: { x: 0, y: 0, width: viewportWidth, height: chunkHeight },
      }),
    )
  }

  await page.evaluate(() => window.scrollTo(0, 0))

  let offsetY = 0
  const layers = []

  for (const chunk of chunks) {
    const meta = await sharp(chunk).metadata()
    layers.push({ input: chunk, top: offsetY, left: 0 })
    offsetY += meta.height
  }

  await sharp({
    create: {
      width: viewportWidth,
      height: offsetY,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(layers)
    .jpeg({ quality: 88 })
    .toFile(outPath)

  return offsetY
}

async function captureStrip(page, viewport, stripName, mobile = false) {
  await page.setViewportSize(viewport)
  await page.goto(orderUrl, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await injectCaptureStyles(page)
  await preparePage(page)

  const cropHeight = Math.round(await findBestsellerCropHeight(page))
  const stripPath = path.join(outDir, stripName)
  const actualHeight = await captureVerticalStrip(
    page,
    viewport.width,
    viewport.height,
    cropHeight,
    stripPath,
  )

  return {
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    cropHeight: actualHeight,
    mobile,
  }
}

function buildShowcaseHtml(desktopScrollPx, mobileScrollPx) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kimchi House AU Showcase</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      width: 1280px;
      height: 720px;
      overflow: hidden;
      background: #f7f7f7;
    }

    .showcase {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 56px 32px 48px;
    }

    .device-wrap {
      position: relative;
      width: 920px;
      height: 576px;
      overflow: visible;
    }

    .laptop {
      width: 100%;
      height: 100%;
      background: #111;
      border-radius: 20px;
      padding: 12px;
      box-shadow: 0 24px 56px rgba(0, 0, 0, 0.14);
    }

    .screen,
    .phone-screen {
      overflow: hidden;
      background: #fff;
    }

    .screen {
      width: 100%;
      height: 100%;
      border-radius: 10px;
    }

    .screen-scroll,
    .phone-scroll {
      transform: translate3d(0, 0, 0);
      backface-visibility: hidden;
    }

    .screen-scroll img,
    .phone-scroll img {
      width: 100%;
      height: auto;
      display: block;
      pointer-events: none;
      user-select: none;
    }

    .phone {
      position: absolute;
      right: -52px;
      bottom: -24px;
      width: 168px;
      height: 344px;
      background: #111;
      border-radius: 26px;
      padding: 7px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
      z-index: 2;
    }

    .phone-screen {
      width: 100%;
      height: 100%;
      border-radius: 20px;
    }
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
</html>
`
}

async function setScrollProgress(page, progress) {
  await page.evaluate((value) => {
    for (const el of document.querySelectorAll('[data-scroll-max]')) {
      const max = Number(el.dataset.scrollMax)
      el.style.transform = `translate3d(0, ${Math.round(max * value)}px, 0)`
    }
  }, progress)
}

async function recordFrames(page) {
  const frameDelay = Math.round(1000 / RECORD_FPS)
  const totalFrames = Math.round(RECORD_MS / frameDelay) - 1
  const tailFrames = Math.round((LOOP_HOLD_MS / 1000) * RECORD_FPS)

  for (let frame = 0; frame <= totalFrames; frame += 1) {
    await setScrollProgress(page, scrollProgress(frame / totalFrames))
    await page.waitForTimeout(frameDelay)
  }

  for (let i = 0; i < tailFrames; i += 1) {
    await setScrollProgress(page, 0)
    await page.waitForTimeout(frameDelay)
  }
}

function bumpProjectTimestamp() {
  const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'))
  const idx = projects.findIndex((p) => p.slug === 'kimchi-house-au' || p.id === 7)
  if (idx === -1) return

  projects[idx].updatedAt = new Date().toISOString()
  fs.writeFileSync(projectsPath, `${JSON.stringify(projects, null, 2)}\n`)
  console.log(`Updated projects.json updatedAt → ${projects[idx].updatedAt}`)
}

function syncDistAssets() {
  const distDir = path.join(rootDir, 'dist/projects/kimchi-house-au')
  if (!fs.existsSync(distDir)) return

  for (const name of [
    'desktop-strip.jpg',
    'mobile-strip.jpg',
    'hero.webm',
    'hero-poster.jpg',
    'showcase.html',
  ]) {
    fs.copyFileSync(path.join(outDir, name), path.join(distDir, name))
  }
  console.log('Synced assets → dist/projects/kimchi-house-au/')
}

function cleanupTestFiles() {
  for (const name of ['_test-full.jpg', '_test-viewport0.jpg', '_test-scroll1600.jpg']) {
    const file = path.join(outDir, name)
    if (fs.existsSync(file)) fs.unlinkSync(file)
  }
}

const browser = await chromium.launch()

const desktopPage = await browser.newPage()
const desktopMetrics = await captureStrip(desktopPage, DESKTOP, 'desktop-strip.jpg')
await desktopPage.close()

const mobilePage = await browser.newPage({
  viewport: MOBILE,
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
})
const mobileMetrics = await captureStrip(mobilePage, MOBILE, 'mobile-strip.jpg', true)
await mobilePage.close()

const desktopScrollPx = stripScrollPx(
  desktopMetrics.cropHeight,
  desktopMetrics.viewportWidth,
  LAPTOP_SCREEN,
  LAPTOP_SCREEN.width,
)

const mobileScrollPx = stripScrollPx(
  mobileMetrics.cropHeight,
  mobileMetrics.viewportWidth,
  PHONE_SCREEN,
  PHONE_SCREEN.width,
)

console.log(`Desktop strip: ${desktopMetrics.cropHeight}px → scroll ${desktopScrollPx}px`)
console.log(`Mobile strip: ${mobileMetrics.cropHeight}px → scroll ${mobileScrollPx}px`)

fs.writeFileSync(
  path.join(outDir, 'showcase.html'),
  buildShowcaseHtml(desktopScrollPx, mobileScrollPx),
)

const htmlPath = path.join(outDir, 'showcase.html')
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
})

const page = await context.newPage()
await page.goto(`file://${htmlPath}`)
await page.waitForFunction(() =>
  [...document.images].every((img) => img.complete && img.naturalHeight > 0),
)
await setScrollProgress(page, 0)
await page.waitForTimeout(700)

await page.screenshot({
  path: path.join(outDir, 'hero-poster.jpg'),
  type: 'jpeg',
  quality: 88,
})

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
} else {
  console.error('No webm recorded')
  process.exit(1)
}

cleanupTestFiles()
bumpProjectTimestamp()
syncDistAssets()
