import { motion } from 'framer-motion'
import AgentStatusBubble from './AgentStatusBubble'
import { buildAriaLabel } from './officeData'

function getMotion(state, reducedMotion) {
  if (reducedMotion) {
    return { animate: { y: 0, rotate: 0 }, transition: { duration: 0 } }
  }

  switch (state) {
    case 'idle':
      return {
        animate: { y: [0, -2, 0], rotate: [0, 0.6, 0] },
        transition: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' },
      }
    case 'working':
      return {
        animate: { y: [0, -1, 0, -1, 0] },
        transition: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' },
      }
    case 'thinking':
      return {
        animate: { y: [0, -3, 0], rotate: [0, -1.5, 0, 1.5, 0] },
        transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
      }
    case 'waiting':
      return {
        animate: { y: [0, -1.5, 0] },
        transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
      }
    case 'done':
      return {
        animate: { y: [0, -4, 0], scale: [1, 1.04, 1] },
        transition: { duration: 0.6, ease: 'easeOut' },
      }
    case 'meeting':
      return {
        animate: { y: [0, -1, 0] },
        transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
      }
    case 'walking':
      return {
        animate: { y: [0, -3, 0, -3, 0], rotate: [0, -2, 0, 2, 0] },
        transition: { duration: 0.7, repeat: Infinity, ease: 'easeInOut' },
      }
    default:
      return { animate: { y: 0 }, transition: { duration: 0.2 } }
  }
}

export default function AgentCharacter({
  agent,
  selected,
  onSelect,
  reducedMotion,
  style,
  compact = false,
}) {
  if (!agent) return null

  const motionProps = getMotion(agent.state, reducedMotion)
  const label = buildAriaLabel(agent)
  const className = `office-agent${selected ? ' office-agent--selected' : ''}${compact ? ' office-agent--compact' : ''}`
  const cssVars = {
    ...style,
    '--agent-hair': agent.hair,
    '--agent-clothing': agent.clothing,
    '--agent-accent': agent.accent,
  }

  const inner = (
    <>
      <AgentStatusBubble agent={agent} reducedMotion={reducedMotion} />

      <motion.span
        className="office-agent__figure"
        animate={motionProps.animate}
        transition={motionProps.transition}
      >
        <svg
          className="office-agent__svg"
          viewBox="0 0 48 64"
          width={compact ? 36 : 48}
          height={compact ? 48 : 64}
          aria-hidden="true"
        >
          {/* Desk / base cue */}
          <ellipse className="office-agent__shadow" cx="24" cy="58" rx="14" ry="3.5" />

          {/* Body */}
          <path
            className="office-agent__body"
            d="M14 30c0-2.5 2.2-4.5 10-4.5s10 2 10 4.5v16c0 3-3 5.5-10 5.5S14 49 14 46V30z"
          />
          {/* Collar accent */}
          <path
            className="office-agent__collar"
            d="M20 30.5c1.2 2.2 2.8 3.2 4 3.2s2.8-1 4-3.2"
          />
          {/* Arms */}
          <path
            className="office-agent__arm"
            d="M14 32c-3 1.5-5 5-4.5 9M34 32c3 1.5 5 5 4.5 9"
          />
          {/* Head */}
          <circle className="office-agent__head" cx="24" cy="18" r="9" />
          {/* Hair */}
          <path
            className="office-agent__hair"
            d="M15.5 18c0-6 3.5-9.5 8.5-9.5S32.5 12 32.5 18c0-1.5-.5-4-2.5-5.2-1.2 2.2-3 3.2-6 3.2s-4.8-1-6-3.2c-2 1.2-2.5 3.7-2.5 5.2z"
          />
          {/* Role accessory — subtle badge */}
          <circle className="office-agent__badge" cx="33" cy="36" r="2.2" />

          {/* Monitor activity when working */}
          {agent.state === 'working' && (
            <g className="office-agent__monitor">
              <rect x="17" y="40" width="14" height="9" rx="1.2" />
              {!reducedMotion && (
                <motion.rect
                  x="19"
                  y="42.5"
                  width="6"
                  height="1.2"
                  rx="0.4"
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </g>
          )}

          {/* Thinking dots */}
          {agent.state === 'thinking' && (
            <g className="office-agent__think">
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={i}
                  cx={36 + i * 3.5}
                  cy={10}
                  r={1.1}
                  animate={
                    reducedMotion
                      ? { opacity: 0.7 }
                      : { opacity: [0.25, 1, 0.25], y: [0, -1.5, 0] }
                  }
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { duration: 1.2, repeat: Infinity, delay: i * 0.18 }
                  }
                />
              ))}
            </g>
          )}
        </svg>
      </motion.span>

      <span className="office-agent__name">{agent.name}</span>
      <span className="office-agent__state" data-state={agent.state}>
        {agent.state}
      </span>
    </>
  )

  if (compact) {
    return (
      <div className={className} style={cssVars} aria-hidden="true">
        {inner}
      </div>
    )
  }

  return (
    <motion.button
      type="button"
      className={className}
      style={cssVars}
      aria-label={label}
      aria-pressed={selected}
      onClick={() => onSelect?.(agent.id)}
      layout={!reducedMotion}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 120, damping: 20, mass: 0.8 }
      }
    >
      {inner}
    </motion.button>
  )
}
