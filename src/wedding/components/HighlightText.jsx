/**
 * manishkr.xyz-style inline highlight pills on headlines.
 * Pass segments: [{ text, tone: 'dark' | 'blue' | 'none' }]
 */
export default function HighlightText({ segments, className = '' }) {
  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (!seg.text) return null
        if (seg.tone === 'dark') {
          return (
            <span key={i} className="w-highlight w-highlight--dark">
              {seg.text}
            </span>
          )
        }
        if (seg.tone === 'blue') {
          return (
            <span key={i} className="w-highlight w-highlight--blue">
              {seg.text}
            </span>
          )
        }
        return <span key={i}>{seg.text}</span>
      })}
    </span>
  )
}
