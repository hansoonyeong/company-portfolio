import { motion, AnimatePresence } from 'framer-motion'

const BUBBLE_COPY = {
  idle: '대기',
  walking: '이동 중',
  thinking: '생각 중…',
  working: null,
  meeting: '미팅 중',
  waiting: '입력 대기',
  done: '✓ 완료',
  offline: '오프라인',
}

export default function AgentStatusBubble({ agent, reducedMotion }) {
  if (!agent) return null

  let text = BUBBLE_COPY[agent.state] ?? agent.state
  if (agent.state === 'working') {
    text = agent.currentTask || agent.statusMessage || '작업 중'
  } else if (agent.state === 'thinking' && agent.statusMessage) {
    text = agent.statusMessage
  } else if (agent.state === 'waiting' && agent.statusMessage) {
    text = agent.statusMessage
  }

  if (!text) return null

  return (
    <AnimatePresence>
      <motion.span
        key={`${agent.id}-${agent.state}-${text}`}
        className="office-bubble"
        initial={reducedMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.25 }}
        aria-hidden="true"
      >
        {text}
      </motion.span>
    </AnimatePresence>
  )
}
