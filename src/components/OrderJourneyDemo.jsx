import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../i18n/LanguageContext'
import './OrderJourneyDemo.css'

const ACCENT = '#123524'
const TOTAL_MS = 18500

const STEP_DEFS = [
  { id: 'kakao', duration: 2200 },
  { id: 'tap', duration: 1400 },
  { id: 'open', duration: 1800 },
  { id: 'browse', duration: 2200 },
  { id: 'add', duration: 2400 },
  { id: 'cart', duration: 1800 },
  { id: 'delivery', duration: 2200 },
  { id: 'review', duration: 1800 },
  { id: 'success', duration: 2300 },
]

const COPY = {
  en: {
    caption: [
      'KakaoTalk Channel message',
      'Tap Order Now',
      'Ordering site opens',
      'Browse products',
      'Add to cart',
      'Review cart',
      'Enter delivery details',
      'Confirm order',
      'Order complete',
    ],
    kakaoChannel: 'Kimchi House AU',
    kakaoTime: 'Just now',
    kakaoBody:
      '3rd pre-order is open.\nFresh Korean kimchi — reserve while stock lasts.',
    orderNow: 'Order Now',
    siteTitle: 'Kimchi House',
    reserve: 'Pre-order',
    heroTitle: 'Freshest when it arrives',
    heroCta: 'Reserve now',
    products: 'This round',
    productA: 'Baechu Kimchi 4kg',
    productB: 'Chonggak Kimchi 2kg',
    priceA: '$75',
    priceB: '$60',
    add: 'Add',
    cartTitle: 'Cart',
    cartTotal: 'Total',
    checkout: 'Checkout',
    deliveryTitle: 'Delivery',
    name: 'Name',
    phone: 'Phone',
    address: 'Address',
    suburb: 'Suburb',
    continue: 'Continue',
    reviewTitle: 'Review',
    placeOrder: 'Place order',
    successTitle: 'Order received',
    successBody: 'Confirmation within 24 hours.',
    orderNo: 'Order #KH-2841',
  },
  ko: {
    caption: [
      '카카오톡 채널 안내',
      '지금 주문하기 탭',
      '주문 사이트 오픈',
      '상품 둘러보기',
      '장바구니에 담기',
      '장바구니 확인',
      '배송 정보 입력',
      '주문 확인',
      '주문 완료',
    ],
    kakaoChannel: 'Kimchi House AU',
    kakaoTime: '방금',
    kakaoBody:
      '3차 사전예약이 오픈됐어요.\n가장 신선할 때 맛보는 국산 김치, 수량 한정입니다.',
    orderNow: '지금 주문하기',
    siteTitle: '김치하우스',
    reserve: '예약주문',
    heroTitle: '가장 신선할 때, 가장 맛있는 김치',
    heroCta: '지금 예약하기',
    products: '이번 차수',
    productA: '배추김치 4kg',
    productB: '총각김치 2kg',
    priceA: '$75',
    priceB: '$60',
    add: '담기',
    cartTitle: '장바구니',
    cartTotal: '총액',
    checkout: '주문하기',
    deliveryTitle: '배송 정보',
    name: '성함',
    phone: '연락처',
    address: '배송 주소',
    suburb: 'Suburb',
    continue: '계속',
    reviewTitle: '주문 확인',
    placeOrder: '주문 접수',
    successTitle: '주문이 접수되었습니다',
    successBody: '24시간 이내 확인 메시지를 보내드립니다.',
    orderNo: '주문번호 #KH-2841',
  },
}

const ease = [0.22, 1, 0.36, 1]

function StatusBar({ light = false }) {
  return (
    <div className={`ojd__status${light ? ' ojd__status--light' : ''}`}>
      <span>9:41</span>
      <span className="ojd__status-icons" aria-hidden>
        <i />
        <i />
        <i />
      </span>
    </div>
  )
}

function TapCursor({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="ojd__tap"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.35, ease }}
        >
          <motion.span
            className="ojd__tap-ring"
            initial={{ scale: 0.4, opacity: 0.5 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.9, ease, repeat: 1, repeatDelay: 0.15 }}
          />
          <span className="ojd__tap-dot" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function KakaoScreen({ c, showTap }) {
  return (
    <div className="ojd__screen ojd__screen--kakao">
      <StatusBar />
      <div className="ojd__kakao-bar">
        <div className="ojd__kakao-avatar" aria-hidden>
          K
        </div>
        <div>
          <p className="ojd__kakao-name">{c.kakaoChannel}</p>
          <p className="ojd__kakao-sub">Channel</p>
        </div>
      </div>
      <div className="ojd__kakao-body">
        <motion.div
          className="ojd__bubble"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease, delay: 0.15 }}
        >
          <p className="ojd__bubble-label">{c.kakaoChannel}</p>
          <p className="ojd__bubble-text">{c.kakaoBody}</p>
          <div className="ojd__cta-wrap">
            <button type="button" className="ojd__kakao-cta">
              {c.orderNow}
            </button>
            <TapCursor active={showTap} />
          </div>
        </motion.div>
        <p className="ojd__kakao-time">{c.kakaoTime}</p>
      </div>
    </div>
  )
}

function SiteChrome({ c, children, cartCount = 0, scrollY = 0, overlay = null }) {
  return (
    <div className="ojd__screen ojd__screen--site">
      <StatusBar light />
      <div className="ojd__site-bar">
        <span className="ojd__site-brand">{c.siteTitle}</span>
        <span className="ojd__site-link">{c.reserve}</span>
        <span className="ojd__cart-badge" data-count={cartCount > 0 ? cartCount : undefined}>
          {cartCount > 0 ? cartCount : null}
        </span>
      </div>
      <div className="ojd__site-scroll">
        <motion.div
          className="ojd__site-content"
          animate={{ y: scrollY }}
          transition={{ duration: 1.1, ease }}
        >
          {children}
        </motion.div>
        {overlay}
      </div>
    </div>
  )
}

function HomeCatalog({ c, adding = false }) {
  const [added, setAdded] = useState(0)

  useEffect(() => {
    if (!adding) {
      setAdded(0)
      return undefined
    }
    setAdded(0)
    const t1 = window.setTimeout(() => setAdded(1), 350)
    const t2 = window.setTimeout(() => setAdded(2), 1100)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [adding])

  return (
    <>
      <div className="ojd__hero-card">
        <p className="ojd__eyebrow">PREMIUM · 3rd round</p>
        <h3>{c.heroTitle}</h3>
        <span className="ojd__pill">{c.heroCta}</span>
      </div>
      <p className="ojd__section-label">{c.products}</p>
      {[
        { name: c.productA, price: c.priceA, tone: 'a' },
        { name: c.productB, price: c.priceB, tone: 'b' },
      ].map((item, index) => (
        <div key={item.name} className={`ojd__product ojd__product--${item.tone}`}>
          <div className="ojd__product-swatch" aria-hidden />
          <div className="ojd__product-meta">
            <p>{item.name}</p>
            <span>{item.price}</span>
          </div>
          <motion.button
            type="button"
            className="ojd__add"
            animate={
              added > index
                ? { scale: [1, 0.92, 1], backgroundColor: ACCENT, color: '#fff' }
                : { scale: 1, backgroundColor: '#ffffff', color: ACCENT }
            }
            transition={{ duration: 0.45, ease }}
          >
            {c.add}
          </motion.button>
        </div>
      ))}
    </>
  )
}

function CartSheet({ c, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="ojd__sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.55, ease }}
        >
          <div className="ojd__sheet-handle" />
          <p className="ojd__sheet-title">{c.cartTitle}</p>
          <div className="ojd__sheet-row">
            <span>{c.productA}</span>
            <span>{c.priceA}</span>
          </div>
          <div className="ojd__sheet-row">
            <span>{c.productB}</span>
            <span>{c.priceB}</span>
          </div>
          <div className="ojd__sheet-total">
            <span>{c.cartTotal}</span>
            <strong>$135</strong>
          </div>
          <button type="button" className="ojd__primary">
            {c.checkout}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DeliveryForm({ c, active }) {
  const [filled, setFilled] = useState(0)
  const fields = [
    { label: c.name, value: 'S. Han' },
    { label: c.phone, value: '0433 938 909' },
    { label: c.address, value: '12 Station St' },
    { label: c.suburb, value: 'Chatswood' },
  ]

  useEffect(() => {
    if (!active) {
      setFilled(0)
      return undefined
    }
    setFilled(0)
    const timers = [0, 1, 2, 3].map((index) =>
      window.setTimeout(() => setFilled(index + 1), 280 + index * 320),
    )
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [active])

  return (
    <div className="ojd__form">
      <p className="ojd__sheet-title">{c.deliveryTitle}</p>
      {fields.map((field, index) => (
        <div key={field.label} className="ojd__field">
          <span>{field.label}</span>
          <motion.div
            className="ojd__input"
            initial={false}
            animate={{
              borderColor: filled > index ? ACCENT : 'rgba(18,53,36,0.12)',
            }}
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={filled > index ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3, ease }}
            >
              {filled > index ? field.value : ''}
            </motion.span>
          </motion.div>
        </div>
      ))}
      <button type="button" className="ojd__primary">
        {c.continue}
      </button>
    </div>
  )
}

function ReviewScreen({ c }) {
  return (
    <div className="ojd__form">
      <p className="ojd__sheet-title">{c.reviewTitle}</p>
      <div className="ojd__review-card">
        <div className="ojd__sheet-row">
          <span>{c.productA} × 1</span>
          <span>{c.priceA}</span>
        </div>
        <div className="ojd__sheet-row">
          <span>{c.productB} × 1</span>
          <span>{c.priceB}</span>
        </div>
        <div className="ojd__sheet-row ojd__sheet-row--muted">
          <span>Chatswood NSW</span>
        </div>
        <div className="ojd__sheet-total">
          <span>{c.cartTotal}</span>
          <strong>$135</strong>
        </div>
      </div>
      <button type="button" className="ojd__primary">
        {c.placeOrder}
      </button>
    </div>
  )
}

function SuccessScreen({ c }) {
  return (
    <div className="ojd__success">
      <motion.div
        className="ojd__check"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease }}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path
            d="M5 12.5l4.2 4.2L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
      <h3>{c.successTitle}</h3>
      <p>{c.successBody}</p>
      <span className="ojd__order-no">{c.orderNo}</span>
    </div>
  )
}

function PhoneFrame({ children }) {
  return (
    <div className="ojd__phone">
      <div className="ojd__phone-bezel">
        <div className="ojd__notch" aria-hidden />
        <div className="ojd__phone-screen">{children}</div>
      </div>
    </div>
  )
}

function BrowserFrame({ visible, c }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="ojd__browser"
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.7, ease }}
        >
          <div className="ojd__browser-chrome">
            <span />
            <span />
            <span />
            <div className="ojd__url">kimchihouse.au/order</div>
          </div>
          <div className="ojd__browser-body">
            <div className="ojd__browser-hero">
              <p className="ojd__eyebrow">Kimchi House AU</p>
              <h3>{c.heroTitle}</h3>
            </div>
            <div className="ojd__browser-grid">
              <div />
              <div />
              <div />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function OpenSplash({ c }) {
  return (
    <div className="ojd__screen ojd__screen--site ojd__screen--splash">
      <StatusBar light />
      <motion.div
        className="ojd__splash"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease }}
      >
        <div className="ojd__splash-mark" aria-hidden>
          K
        </div>
        <p>{c.siteTitle}</p>
        <span>{c.reserve}</span>
      </motion.div>
    </div>
  )
}

function ScreenLayer({ stepId, c }) {
  const showTap = stepId === 'tap'
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    if (stepId === 'add') {
      setCartCount(0)
      const t1 = window.setTimeout(() => setCartCount(1), 400)
      const t2 = window.setTimeout(() => setCartCount(2), 1150)
      return () => {
        window.clearTimeout(t1)
        window.clearTimeout(t2)
      }
    }
    if (['cart', 'delivery', 'review', 'success'].includes(stepId)) {
      setCartCount(2)
      return undefined
    }
    setCartCount(0)
    return undefined
  }, [stepId])

  const scrollY = stepId === 'browse' || stepId === 'add' || stepId === 'cart' ? -72 : 0

  if (stepId === 'kakao' || stepId === 'tap') {
    return <KakaoScreen c={c} showTap={showTap} />
  }

  if (stepId === 'open') {
    return <OpenSplash c={c} />
  }

  if (stepId === 'success') {
    return (
      <div className="ojd__screen ojd__screen--site">
        <StatusBar light />
        <SuccessScreen c={c} />
      </div>
    )
  }

  if (stepId === 'delivery') {
    return (
      <div className="ojd__screen ojd__screen--site">
        <StatusBar light />
        <DeliveryForm c={c} active />
      </div>
    )
  }

  if (stepId === 'review') {
    return (
      <div className="ojd__screen ojd__screen--site">
        <StatusBar light />
        <ReviewScreen c={c} />
      </div>
    )
  }

  return (
    <SiteChrome
      c={c}
      cartCount={cartCount}
      scrollY={scrollY}
      overlay={<CartSheet c={c} visible={stepId === 'cart'} />}
    >
      <HomeCatalog c={c} adding={stepId === 'add'} />
    </SiteChrome>
  )
}

/**
 * Animated Kimchi House customer journey: KakaoTalk → ordering site → checkout.
 * Auto-loops (~15–20s). Reusable; pass localized section copy via props.
 */
export default function OrderJourneyDemo({
  section,
  fallbackLabel = 'Solution',
  accent = ACCENT,
}) {
  const { lang } = useTranslation()
  const reduceMotion = useReducedMotion()
  const c = COPY[lang] || COPY.en
  const rootRef = useRef(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(true)

  const stepId = STEP_DEFS[stepIndex].id
  const showBrowser = ['open', 'browse', 'add', 'cart'].includes(stepId)

  useEffect(() => {
    const node = rootRef.current
    if (!node) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => setPlaying(entry.isIntersecting),
      { threshold: 0.25 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!playing || reduceMotion) return undefined
    const ms = STEP_DEFS[stepIndex].duration
    const timer = window.setTimeout(() => {
      setStepIndex((i) => (i + 1) % STEP_DEFS.length)
    }, ms)
    return () => window.clearTimeout(timer)
  }, [stepIndex, playing, reduceMotion])

  useEffect(() => {
    if (reduceMotion) setStepIndex(8)
  }, [reduceMotion])

  return (
    <section
      ref={rootRef}
      className="case-study__block case-study__block--story case-study__block--story-stack ojd"
      style={{ '--ojd-accent': accent }}
      aria-label="Order journey demo"
    >
      <div className="case-study__story-stack">
        <p className="case-study__label">{section?.label || fallbackLabel}</p>
        {section?.title && <h2 className="case-study__title">{section.title}</h2>}
        {(section?.paragraphs || []).length > 0 && (
          <div className="case-study__prose case-study__prose--story">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        )}
      </div>

      <div className="ojd__stage">
        <div className="ojd__glow" aria-hidden />
        <BrowserFrame visible={showBrowser} c={c} />
        <PhoneFrame>
          <AnimatePresence mode="wait">
            <motion.div
              key={['kakao', 'tap'].includes(stepId) ? 'kakao' : ['browse', 'add', 'cart'].includes(stepId) ? 'shop' : stepId}
              className="ojd__layer"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985, y: -8 }}
              transition={{ duration: 0.55, ease }}
            >
              <ScreenLayer stepId={reduceMotion ? 'success' : stepId} c={c} />
            </motion.div>
          </AnimatePresence>
        </PhoneFrame>
      </div>

      <div className="ojd__footer">
        <p className="ojd__caption" aria-live="polite">
          {c.caption[stepIndex]}
        </p>
        <div className="ojd__dots" aria-hidden>
          {STEP_DEFS.map((step, index) => (
            <span
              key={step.id}
              className={index === stepIndex ? 'is-active' : index < stepIndex ? 'is-done' : ''}
            />
          ))}
        </div>
      </div>
      <span className="ojd__sr-only">
        Looping product demo, approximately {Math.round(TOTAL_MS / 1000)} seconds.
      </span>
    </section>
  )
}
