import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { Gift, ChevronRight, RotateCcw } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useTheme } from '../ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'

// ─── Wheel config ────────────────────────────────────────────────────────────

// Pink → blue duotone using the exact hues from the kiosk's Touch-to-Start screen
// (#f472b6 pink, #818cf8 indigo, #38bdf8 sky blue), pastel + translucent for a glassy look.
const SEGMENTS = [
  { label: '5% Off',  discount: 5,  light: '#fce7f3', base: '#f472b6', glow: 'rgba(244,114,182,0.6)', textCol: '#500724' },  // pink
  { label: '10% Off', discount: 10, light: '#fbcfe8', base: '#ec4899', glow: 'rgba(236,72,153,0.6)',  textCol: '#500724' },  // rose
  { label: '15% Off', discount: 15, light: '#f3e8ff', base: '#c084fc', glow: 'rgba(192,132,252,0.6)', textCol: '#3b0764' },  // orchid (pink→blue bridge)
  { label: '20% Off', discount: 20, light: '#e0e7ff', base: '#818cf8', glow: 'rgba(129,140,248,0.65)',textCol: '#1e1b4b' },  // indigo
  { label: '25% Off', discount: 25, light: '#e0f2fe', base: '#38bdf8', glow: 'rgba(56,189,248,0.65)', textCol: '#0c4a6e' },  // sky blue
  { label: '30% Off', discount: 30, light: '#cffafe', base: '#22d3ee', glow: 'rgba(34,211,238,0.7)',  textCol: '#083344' },  // cyan-blue — top tier
]

const SEG_ANGLE = 360 / SEGMENTS.length   // 60°
const SPIN_MS   = 5000
const CX = 150, CY = 150, R = 128

// ─── Geometry helpers ────────────────────────────────────────────────────────

const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180

function pt(deg: number, r: number) {
  return { x: r * Math.cos(toRad(deg)), y: r * Math.sin(toRad(deg)) }
}

function slicePath(i: number) {
  const s = pt(i * SEG_ANGLE, R)
  const e = pt((i + 1) * SEG_ANGLE, R)
  return `M 0 0 L ${s.x} ${s.y} A ${R} ${R} 0 0 1 ${e.x} ${e.y} Z`
}

// ─── Real QR code ────────────────────────────────────────────────────────────

function CouponQR({ code, size = 120 }: { code: string; size?: number }) {
  return (
    <QRCodeSVG
      value={code}
      size={size}
      bgColor="#ffffff"
      fgColor="#0f172a"
      level="M"
      style={{ borderRadius: 6, display: 'block' }}
    />
  )
}

// ─── GamePage ─────────────────────────────────────────────────────────────────

export default function GamePage() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const sessionId  = (location.state as { sessionId?: string | null })?.sessionId ?? null
  const isDarkMode = useTheme()
  const { lang, t } = useLanguage()

  const [rotation,   setRotation]   = useState(0)
  const [spinning,   setSpinning]   = useState(false)
  const [wonSegment, setWonSegment] = useState<typeof SEGMENTS[0] | null>(null)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [couponExpiresAt, setCouponExpiresAt] = useState<string | null>(null)
  const [couponVisitStreak, setCouponVisitStreak] = useState(1)
  const [hamperEligible, setHamperEligible] = useState(false)
  const [activeEvent, setActiveEvent] = useState<{
    name: string; emoji: string; discountPercent: number; bannerColor: string;
  } | null>(null)

  useEffect(() => {
    axios.get('/api/events/active').then(r => setActiveEvent(r.data.data)).catch(() => {})
  }, [])

  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (spinTimerRef.current) clearTimeout(spinTimerRef.current) }, [])

  const handleSpin = useCallback(() => {
    if (spinning || wonSegment) return
    const idx       = Math.floor(Math.random() * SEGMENTS.length)
    const segCenter = idx * SEG_ANGLE + SEG_ANGLE / 2
    const spinDelta = 8 * 360 + ((360 - segCenter % 360) % 360)
    setSpinning(true)
    setRotation(prev => prev + spinDelta)

    spinTimerRef.current = setTimeout(async () => {
      const seg = SEGMENTS[idx]
      setSpinning(false)
      setWonSegment(seg)
      try {
        const { data } = await axios.post('/api/coupons', { discount: seg.discount, sessionId, gameType: 'spin' })
        setCouponCode(data.data.code)
        setCouponExpiresAt(data.data.expiresAt)
        setCouponVisitStreak(data.data.visitStreak ?? 1)
        setHamperEligible(!!data.data.hamperEligible)
      } catch {
        setCouponCode(`SAVE${seg.discount}DEMO`)
        setCouponExpiresAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      }
    }, SPIN_MS)
  }, [spinning, wonSegment])

  // ── Theme-derived values ───────────────────────────────────────────────────
  const pageBg         = isDarkMode ? '#050818' : '#f8fafc'
  const headingAccent  = isDarkMode ? 'rgba(6,182,212,0.6)' : '#0891b2'
  const pointerColor   = isDarkMode ? 'rgba(255,255,255,0.95)' : '#475569'
  const pointerGlow    = isDarkMode ? 'drop-shadow(0 0 10px rgba(255,255,255,0.7))' : 'drop-shadow(0 0 8px rgba(71,85,105,0.4))'
  const wheelShadow    = isDarkMode ? '0 0 80px rgba(236,72,153,0.25), 0 0 40px rgba(6,182,212,0.15)' : '0 8px 40px rgba(236,72,153,0.2), 0 4px 20px rgba(6,182,212,0.12)'
  const centerCapFill  = isDarkMode ? 'rgba(4,0,16,0.92)' : 'rgba(248,250,252,0.95)'
  const centerCapStroke= isDarkMode ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)'
  const sliceStroke    = isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.7)'
  const outerRingStroke= isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const glassDiscBg     = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)'
  const glassDiscBorder = isDarkMode ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.9)'

  // Spin button
  const spinBtnBg     = spinning
    ? isDarkMode ? 'rgba(255,255,255,0.04)'  : '#f1f5f9'
    : isDarkMode
      ? 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(6,182,212,0.25))'
      : 'linear-gradient(135deg, #ec4899, #06b6d4)'
  const spinBtnBorder = spinning
    ? isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'
    : isDarkMode ? 'rgba(236,72,153,0.55)' : 'transparent'
  const spinBtnColor  = spinning
    ? isDarkMode ? 'rgba(255,255,255,0.3)' : '#94a3b8'
    : '#ffffff'
  const spinBtnShadow = spinning ? 'none' : isDarkMode ? '0 0 40px rgba(236,72,153,0.2)' : '0 8px 32px rgba(236,72,153,0.35)'
  const spinBtnHover  = !spinning ? isDarkMode
    ? { scale: 1.04, boxShadow: '0 0 70px rgba(236,72,153,0.45), 0 0 40px rgba(6,182,212,0.2)' }
    : { scale: 1.04, boxShadow: '0 12px 40px rgba(236,72,153,0.5)' }
    : {}

  // Win card
  const winCardBg     = isDarkMode ? 'rgba(255,255,255,0.06)' : '#ffffff'
  const winCardBorder = isDarkMode ? 'rgba(255,255,255,0.14)' : '#f1f5f9'
  const winCardShadow = isDarkMode ? '0 0 60px rgba(236,72,153,0.2), 0 0 30px rgba(6,182,212,0.1)' : '0 8px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(236,72,153,0.08)'
  const promoLabelCol = isDarkMode ? 'rgba(6,182,212,0.6)' : '#0891b2'
  const promoValidCol = isDarkMode ? 'rgba(255,255,255,0.25)' : '#94a3b8'
  const qrWrapBg      = isDarkMode ? 'rgba(255,255,255,0.06)'  : '#f8fafc'
  const qrWrapBorder  = isDarkMode ? 'rgba(255,255,255,0.12)'  : '#e2e8f0'
  const nextBtnBg     = isDarkMode ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))' : 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(139,92,246,0.12))'
  const nextBtnBorder = isDarkMode ? 'rgba(6,182,212,0.45)' : 'rgba(6,182,212,0.4)'
  const nextBtnColor  = isDarkMode ? 'rgba(103,232,249,0.9)' : '#0891b2'
  const nextBtnShadow = isDarkMode ? '0 0 30px rgba(6,182,212,0.15)' : '0 4px 20px rgba(6,182,212,0.15)'
  const cornerL       = isDarkMode ? 'rgba(236,72,153,0.45)' : 'rgba(236,72,153,0.25)'
  const cornerR       = isDarkMode ? 'rgba(6,182,212,0.45)'  : 'rgba(6,182,212,0.25)'

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: pageBg, fontFamily: lang === 'ur' ? "'Noto Nastaliq Urdu', serif" : undefined }}>

      {/* Background blobs — same organic drift as the Touch-to-Start screen */}
      {isDarkMode ? (
        <>
          <motion.div className="absolute pointer-events-none"
            style={{ width: 960, height: 960, top: '-30%', left: '-18%', background: 'radial-gradient(circle, rgba(56,189,248,0.32) 0%, rgba(56,189,248,0.06) 55%, transparent 72%)', filter: 'blur(72px)' }}
            animate={{ x: [0,70,20,0], y: [0,50,-25,0], scale: [1,1.08,0.96,1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute pointer-events-none"
            style={{ width: 880, height: 880, bottom: '-28%', right: '-16%', background: 'radial-gradient(circle, rgba(139,92,246,0.38) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)', filter: 'blur(80px)' }}
            animate={{ x: [0,-60,-20,0], y: [0,-45,30,0], scale: [1,1.06,1.1,1] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute pointer-events-none"
            style={{ width: 640, height: 640, top: '5%', left: '40%', background: 'radial-gradient(circle, rgba(244,63,94,0.28) 0%, transparent 65%)', filter: 'blur(60px)' }}
            animate={{ x: [0,-40,25,0], y: [0,60,-10,0] }}
            transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 3 }} />
        </>
      ) : (
        <>
          <motion.div className="absolute pointer-events-none"
            style={{ width: 800, height: 800, top: '-20%', left: '-15%', background: 'radial-gradient(circle, rgba(249,168,212,0.35) 0%, rgba(236,72,153,0.05) 55%, transparent 72%)', filter: 'blur(60px)' }}
            animate={{ x: [0,50,15,0], y: [0,40,-20,0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute pointer-events-none"
            style={{ width: 720, height: 720, bottom: '-20%', right: '-12%', background: 'radial-gradient(circle, rgba(165,243,252,0.35) 0%, rgba(6,182,212,0.06) 50%, transparent 70%)', filter: 'blur(68px)' }}
            animate={{ x: [0,-45,-12,0], y: [0,-35,25,0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute pointer-events-none"
            style={{ width: 560, height: 560, top: '5%', left: '40%', background: 'radial-gradient(circle, rgba(196,181,253,0.28) 0%, transparent 65%)', filter: 'blur(50px)' }}
            animate={{ x: [0,-30,20,0], y: [0,50,-8,0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
        </>
      )}

      {/* Mesh grid (dark mode only) */}
      {isDarkMode && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      )}

      {/* Active Event Banner */}
      {activeEvent && (
        <motion.div
          initial={{ y: -56, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
            padding: '10px 24px',
            background: `linear-gradient(135deg, ${activeEvent.bannerColor}20, ${activeEvent.bannerColor}10)`,
            borderBottom: `1px solid ${activeEvent.bannerColor}44`,
            backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>{activeEvent.emoji}</span>
          <span style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.02em' }}>
            {activeEvent.name}
          </span>
          <span style={{
            padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
            background: `${activeEvent.bannerColor}30`,
            border: `1px solid ${activeEvent.bannerColor}66`,
            color: activeEvent.bannerColor, letterSpacing: '0.05em',
          }}>
            {t('game.specialOffer', { pct: activeEvent.discountPercent })}
          </span>
          <span style={{ fontSize: '1.3rem' }}>{activeEvent.emoji}</span>
        </motion.div>
      )}

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-4">

        {/* Heading */}
        <motion.div className="text-center"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <p className="text-xs tracking-[0.4em] uppercase mb-2 font-light" style={{ color: headingAccent }}>
            {t('game.bonusRound')}
          </p>
          <h1 className="text-3xl font-light tracking-[0.2em] uppercase" style={{
            background: 'linear-gradient(90deg, #f472b6, #67e8f9, #fb923c)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {t('game.spinWin')}
          </h1>
        </motion.div>

        {/* Wheel */}
        <motion.div className="relative flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}>

          {/* Pointer */}
          <div className="relative z-10" style={{ marginBottom: -6 }}>
            <div style={{
              width: 0, height: 0,
              borderLeft: '14px solid transparent', borderRight: '14px solid transparent',
              borderTop: `22px solid ${pointerColor}`,
              filter: pointerGlow,
            }} />
          </div>

          {/* Glow ring — slow rotating conic halo behind the glass disc */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              width: CX * 2 + 64, height: CY * 2 + 64,
              top: -32, left: -32,
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, rgba(236,72,153,0.55), rgba(6,182,212,0.5), rgba(251,146,60,0.45), rgba(139,92,246,0.5), rgba(236,72,153,0.55))',
              filter: 'blur(28px)',
            }}
            animate={{ rotate: 360, opacity: [0.55, 0.85, 0.55] }}
            transition={{ rotate: { duration: 9, repeat: Infinity, ease: 'linear' }, opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
          />

          {/* Glass disc — frosted pedestal the wheel sits on */}
          <div className="absolute" style={{
            width: CX * 2 + 24, height: CY * 2 + 24,
            top: -12, left: -12,
            borderRadius: '50%',
            background: glassDiscBg,
            border: `1px solid ${glassDiscBorder}`,
            backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.08)',
          }} />

          {/* Wheel SVG */}
          <div className="relative" style={{ borderRadius: '50%', boxShadow: wheelShadow }}>
            <svg width={CX * 2} height={CY * 2} viewBox={`0 0 ${CX * 2} ${CY * 2}`}>
              <defs>
                {SEGMENTS.map((seg, i) => (
                  <radialGradient key={i} id={`segGlow${i}`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R}>
                    <stop offset="0%"  stopColor={seg.light} stopOpacity={0.75} />
                    <stop offset="55%" stopColor={seg.base}  stopOpacity={0.55} />
                    <stop offset="100%" stopColor={seg.base} stopOpacity={0.68} />
                  </radialGradient>
                ))}
              </defs>

              <circle cx={CX} cy={CY} r={R + 4} fill="none" stroke={outerRingStroke} strokeWidth={3} />

              <motion.g style={{ transformOrigin: `${CX}px ${CY}px` }}
                animate={{ rotate: rotation }}
                transition={{ duration: SPIN_MS / 1000, ease: [0.1, 0.8, 0.25, 1] }}>
                <g transform={`translate(${CX} ${CY})`}>
                  {SEGMENTS.map((seg, i) => {
                    const midDeg = i * SEG_ANGLE + SEG_ANGLE / 2
                    const lp = pt(midDeg, R * 0.62)
                    return (
                      <g key={i} style={{ filter: `drop-shadow(0 0 6px ${seg.glow})` }}>
                        <path d={slicePath(i)} fill={`url(#segGlow${i})`} stroke={sliceStroke} strokeWidth={1.5} />
                        <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
                          fill={seg.textCol} fontSize={11} fontWeight="700"
                          fontFamily="system-ui, sans-serif" style={{ pointerEvents: 'none' }}>
                          {seg.label}
                        </text>
                      </g>
                    )
                  })}
                  <circle r={26} fill={centerCapFill} stroke={centerCapStroke} strokeWidth={2} />
                  <circle r={8} fill={isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'} />
                </g>
              </motion.g>
            </svg>
          </div>
        </motion.div>

        {/* Spin button */}
        <AnimatePresence>
          {!wonSegment && (
            <motion.button key="spin-btn" onClick={handleSpin} disabled={spinning}
              className="relative flex items-center gap-3 px-12 py-4 rounded-2xl text-sm tracking-[0.2em] uppercase font-semibold overflow-hidden"
              style={{
                background: spinBtnBg,
                border: `1px solid ${spinBtnBorder}`,
                color: spinBtnColor,
                boxShadow: spinBtnShadow,
                backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                cursor: spinning ? 'not-allowed' : 'pointer',
              }}
              whileHover={spinBtnHover}
              whileTap={!spinning ? { scale: 0.97 } : {}}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4 }}>
              {/* Glass sheen — diagonal highlight sweeping across the button */}
              {!spinning && (
                <motion.div className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
                    backgroundSize: '300% 100%',
                  }}
                  animate={{ backgroundPositionX: ['120%', '-120%'] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                />
              )}
              <RotateCcw size={17} strokeWidth={1.4}
                style={{ filter: spinning ? 'none' : 'drop-shadow(0 0 6px rgba(6,182,212,0.8))', animation: spinning ? 'spin 1s linear infinite' : 'none' }} />
              {spinning ? t('game.spinning') : t('game.spinNow')}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Win card */}
        <AnimatePresence>
          {wonSegment && couponCode && (
            <motion.div key="win-card" className="w-full max-w-lg"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 160, damping: 18 }}>

              <div className="text-center mb-4">
                <motion.p className="text-2xl font-light tracking-[0.15em] uppercase"
                  style={{ background: 'linear-gradient(90deg, #f472b6, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                  animate={{ opacity: [0.7,1,0.7] }} transition={{ duration: 2, repeat: Infinity }}>
                  {t('game.wonTitle', { pct: wonSegment.discount })}
                </motion.p>
                {couponVisitStreak >= 3 && (
                  <p className="text-[11px] font-bold tracking-widest uppercase mt-1" style={{ color: '#34d399' }}>
                    🌟 Frequent Visitor — Visit #{couponVisitStreak}
                  </p>
                )}
              </div>

              {hamperEligible && (
                <motion.div
                  className="w-full max-w-lg mx-auto mt-4 mb-1 px-5 py-4 rounded-xl text-center"
                  style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(236,72,153,0.1))', border: '1px solid rgba(245,158,11,0.35)' }}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                  <p className="text-sm font-bold tracking-wide" style={{ color: '#f59e0b' }}>🎁 Gift Hamper Unlocked!</p>
                  <p className="text-[11px] mt-1" style={{ color: promoLabelCol }}>
                    This is your 3rd visit — show this coupon code at the shop counter to collect your free gift hamper.
                  </p>
                </motion.div>
              )}

              <div className="flex items-center gap-6 px-6 py-5 rounded-2xl" style={{
                background: winCardBg,
                border: `1px solid ${winCardBorder}`,
                backdropFilter: isDarkMode ? 'blur(24px)' : 'none',
                boxShadow: winCardShadow,
              }}>
                {/* Coupon code */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Gift size={14} strokeWidth={1.5} style={{ color: 'rgba(236,72,153,0.8)' }} />
                    <span className="text-[9px] tracking-[0.35em] uppercase" style={{ color: promoLabelCol }}>
                      {t('game.promoCode')}
                    </span>
                  </div>
                  <motion.div className="font-mono text-2xl font-bold tracking-[0.25em]"
                    style={{ background: 'linear-gradient(90deg, #f472b6, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 12px rgba(236,72,153,0.4))' }}
                    animate={{ scale: [1,1.03,1] }} transition={{ duration: 2.2, repeat: Infinity }}>
                    {couponCode}
                  </motion.div>
                  <p className="text-[10px] tracking-wider" style={{ color: promoValidCol }}>
                    {couponExpiresAt
                      ? t('game.expiresIn', {
                          days: Math.max(1, Math.ceil((new Date(couponExpiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))),
                          date: new Date(couponExpiresAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                        })
                      : t('game.validDays')}
                  </p>
                  <p className="text-[9px] tracking-wide" style={{ color: promoLabelCol }}>
                    Save this code — enter it on your next visit for a returning-customer reward.
                  </p>
                </div>

                {/* QR code */}
                <div className="shrink-0" style={{ padding: 6, background: qrWrapBg, border: `1px solid ${qrWrapBorder}`, borderRadius: 10 }}>
                  <CouponQR code={couponCode} size={110} />
                </div>
              </div>

              {/* Next button */}
              <div className="flex justify-center mt-5">
                <motion.button onClick={() => navigate('/feedback')}
                  className="flex items-center gap-2 px-10 py-3 rounded-xl text-sm tracking-[0.2em] uppercase font-medium"
                  style={{ background: nextBtnBg, border: `1px solid ${nextBtnBorder}`, color: nextBtnColor, boxShadow: nextBtnShadow }}
                  whileHover={{ scale: 1.04, boxShadow: isDarkMode ? '0 0 60px rgba(6,182,212,0.35)' : '0 8px 30px rgba(6,182,212,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  {t('game.next')}
                  <ChevronRight size={15} strokeWidth={1.5} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Corner accents */}
      {[
        { cls: 'top-5 left-5 border-t border-l',     c: cornerL },
        { cls: 'top-5 right-5 border-t border-r',    c: cornerR },
        { cls: 'bottom-5 left-5 border-b border-l',  c: cornerR },
        { cls: 'bottom-5 right-5 border-b border-r', c: cornerL },
      ].map(({ cls, c }, i) => (
        <div key={i} className={`absolute w-7 h-7 pointer-events-none ${cls}`} style={{ borderColor: c }} />
      ))}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
