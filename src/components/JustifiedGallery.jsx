import { useCallback, useEffect, useRef, useState } from 'react'
import { isVideoSrc } from '../lib/media'
import './JustifiedGallery.css'

const DEFAULT_RATIO = 4 / 3

function buildRows(sources, ratios, containerWidth, targetHeight, gap, maxItemsPerRow) {
  if (!containerWidth || sources.some((src) => !ratios[src])) return []

  const rows = []
  let index = 0

  while (index < sources.length) {
    const rowSources = []
    let aspectSum = 0

    while (index < sources.length) {
      const src = sources[index]
      const ratio = ratios[src]
      const nextAspectSum = aspectSum + ratio
      const nextCount = rowSources.length + 1
      const heightIfAdded = (containerWidth - gap * (nextCount - 1)) / nextAspectSum

      if (rowSources.length > 0 && heightIfAdded < targetHeight * 0.72) {
        break
      }

      if (rowSources.length >= maxItemsPerRow) {
        break
      }

      rowSources.push(src)
      aspectSum = nextAspectSum
      index += 1

      if (heightIfAdded <= targetHeight) {
        break
      }
    }

    if (!rowSources.length) break

    const isLast = index >= sources.length
    let height = (containerWidth - gap * (rowSources.length - 1)) / aspectSum

    if (isLast && rowSources.length === 1) {
      height = Math.min(targetHeight * 1.25, height)
    } else if (isLast) {
      height = Math.min(targetHeight * 1.08, height)
    }

    rows.push({
      isLast,
      items: rowSources.map((src) => ({
        src,
        width: height * ratios[src],
        height,
      })),
    })
  }

  return rows
}

function GalleryMedia({ src, onRatio }) {
  const handleLoad = useCallback(
    (event) => {
      const el = event.currentTarget
      const width = el.videoWidth || el.naturalWidth
      const height = el.videoHeight || el.naturalHeight
      if (width > 0 && height > 0) {
        onRatio(src, width / height)
      }
    },
    [src, onRatio],
  )

  if (isVideoSrc(src)) {
    return (
      <video
        src={src}
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={handleLoad}
        aria-hidden="true"
      />
    )
  }

  return <img src={src} alt="" loading="lazy" onLoad={handleLoad} />
}

export default function JustifiedGallery({
  items,
  rowHeight = 360,
  gap = 12,
  onItemClick,
  getItemLabel,
}) {
  const containerRef = useRef(null)
  const [ratios, setRatios] = useState({})
  const [rows, setRows] = useState([])
  const [width, setWidth] = useState(0)

  const handleRatio = useCallback((src, ratio) => {
    setRatios((prev) => {
      if (prev[src] === ratio) return prev
      return { ...prev, [src]: ratio }
    })
  }, [])

  useEffect(() => {
    setRatios((prev) => {
      const next = { ...prev }
      let changed = false
      items.forEach((src) => {
        if (!next[src]) {
          next[src] = DEFAULT_RATIO
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [items])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return undefined

    const updateWidth = () => setWidth(node.offsetWidth)
    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let effectiveRowHeight = rowHeight
    let maxItemsPerRow = 4

    if (width <= 540) {
      effectiveRowHeight = 260
      maxItemsPerRow = 2
    } else if (width <= 768) {
      effectiveRowHeight = 300
      maxItemsPerRow = 3
    } else if (width <= 1100) {
      effectiveRowHeight = 340
      maxItemsPerRow = 4
    }

    setRows(buildRows(items, ratios, width, effectiveRowHeight, gap, maxItemsPerRow))
  }, [items, ratios, width, rowHeight, gap])

  return (
    <div
      ref={containerRef}
      className="justified-gallery"
      style={{ '--jg-gap': `${gap}px` }}
    >
      {rows.map((row) => (
        <div
          key={row.items.map((item) => item.src).join('-')}
          className={`justified-gallery__row${row.isLast ? ' justified-gallery__row--last' : ''}`}
        >
          {row.items.map((item) => (
            <button
              key={item.src}
              type="button"
              className="justified-gallery__item"
              style={{ width: `${item.width}px`, height: `${item.height}px` }}
              onClick={() => onItemClick(item.src)}
              aria-label={getItemLabel(item.src)}
            >
              <GalleryMedia src={item.src} onRatio={handleRatio} />
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
