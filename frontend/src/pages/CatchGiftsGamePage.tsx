import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { Gift, ChevronRight, Timer, Target } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useTheme } from '../ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'

// ─── Round config ───────────────────────────────────────────────────────────

const ROUND_MS      = 7_000
const SPAWN_MS       = 750    // how often a new gift starts falling
const FALL_MS        = 3400   // time to fall from top to bottom — slow enough for kids to tap accurately
const EMOJIS = ['🎁', '🍬', '🧸', '⭐', '🍭', '🎈']

// Score → discount tier — everyone still wins something, more catches = better discount
// Thresholds scaled down for the shorter 8s round (~10 gifts spawn total)
const TIERS = [
  { minScore: 5, discount: 30 },
  { minScore: 4, discount: 25 },
  { minScore: 3, discount: 20 },
  { minScore: 2, discount: 15 },
  { minScore: 1, discount: 10 },
  { minScore: 0, discount: 5 },
]
function tierFor(score: number) {
  return TIERS.find(t => score >= t.minScore) ?? TIERS[TIERS.length - 1]
}

interface FallingItem { id: number; x: number; emoji: string }

// ─── Real QR code ────────────────────────────────────────────────────────────

function CouponQR({ code, size = 120 }: { code: string; size?: number }) {
  return (
    <QRCodeSVG value={code} size={size} bgColor="#ffffff" fgColor="#0f172a" level="M"
      style={{ borderRadius: 6, display: 'block' }} />
  )
}


type GameState = 'idle' | 'playing' | 'finished'

// ─── CatchGiftsGamePage — preview alternative to the Spin & Win wheel ─────────

export default function CatchGiftsGamePage() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const sessionId  = (location.state as { sessionId?: string | null })?.sessionId ?? null
  const isDarkMode = useTheme()
  const { lang, t } = useLanguage()

  const [gameState, setGameState] = useState<GameState>('idle')
  const [items,     setItems]     = useState<FallingItem[]>([])
  const [caughtBurst, setCaughtBurst] = useState<{ id: number; x: number } | null>(null)
  const [score,     setScore]     = useState(0)
  const [timeLeft,  setTimeLeft]  = useState(ROUND_MS / 1000)

  const [wonSegment, setWonSegment] = useState<{ discount: number } | null>(null)
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

  const spawnRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const itemIdRef     = useRef(0)
  const scoreRef      = useRef(0)

  const clearTimers = useCallback(() => {
    if (spawnRef.current) clearInterval(spawnRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])
  useEffect(() => () => clearTimers(), [clearTimers])

  const finishRound = useCallback(async () => {
    clearTimers()
    setItems([])
    const tier = tierFor(scoreRef.current)
    setWonSegment({ discount: tier.discount })
    try {
      const { data } = await axios.post('/api/coupons', { discount: tier.discount, sessionId, gameType: 'catch-gifts', gameScore: scoreRef.current })
      setCouponCode(data.data.code)
      setCouponExpiresAt(data.data.expiresAt)
      setCouponVisitStreak(data.data.visitStreak ?? 1)
      setHamperEligible(!!data.data.hamperEligible)
    } catch {
      setCouponCode(`SAVE${tier.discount}DEMO`)
      setCouponExpiresAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
    }
  }, [clearTimers, sessionId])

  const spawnItem = useCallback(() => {
    const id    = itemIdRef.current++
    const x     = 8 + Math.random() * 84
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
    setItems(prev => [...prev, { id, x, emoji }])
  }, [])

  const handleStart = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    setItems([])
    setTimeLeft(ROUND_MS / 1000)
    setGameState('playing')

    spawnItem()
    spawnRef.current = setInterval(spawnItem, SPAWN_MS)
    countdownRef.current = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) {
          setGameState('finished')
          finishRound()
          return 0
        }
        return s - 1
      })
    }, 1000)
  }, [spawnItem, finishRound])

  const handleCatch = useCallback((item: FallingItem) => {
    if (gameState !== 'playing') return
    setItems(prev => {
      if (!prev.some(it => it.id === item.id)) return prev // already caught/missed — ignore
      scoreRef.current += 1
      setScore(scoreRef.current)
      setCaughtBurst({ id: item.id, x: item.x })
      setTimeout(() => setCaughtBurst(b => (b?.id === item.id ? null : b)), 300)
      return prev.filter(it => it.id !== item.id)
    })
  }, [gameState])

  const handleMiss = useCallback((id: number) => {
    setItems(prev => prev.filter(it => it.id !== id))
  }, [])

  // ── Theme-derived values (win card — identical styling to the spin game) ───
  const pageBg         = isDarkMode ? '#050818' : '#f8fafc'
  const headingAccent  = isDarkMode ? 'rgba(6,182,212,0.6)' : '#0891b2'

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
  const fieldBorder   = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'

  const startBtnBg = isDarkMode
    ? 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(6,182,212,0.25))'
    : 'linear-gradient(135deg, #ec4899, #06b6d4)'

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
      {isDarkMode && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      )}

      {/* Active Event Banner */}
      {activeEvent && (
        <motion.div
          initial={{ y: -56, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '10px 24px',
            background: `linear-gradient(135deg, ${activeEvent.bannerColor}20, ${activeEvent.bannerColor}10)`,
            borderBottom: `1px solid ${activeEvent.bannerColor}44`, backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          }}>
          <span style={{ fontSize: '1.3rem' }}>{activeEvent.emoji}</span>
          <span style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.02em' }}>{activeEvent.name}</span>
          <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: `${activeEvent.bannerColor}30`, border: `1px solid ${activeEvent.bannerColor}66`, color: activeEvent.bannerColor, letterSpacing: '0.05em' }}>
            {t('game.specialOffer', { pct: activeEvent.discountPercent })}
          </span>
          <span style={{ fontSize: '1.3rem' }}>{activeEvent.emoji}</span>
        </motion.div>
      )}

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">

        {/* Heading */}
        <motion.div className="text-center"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <p className="text-xs tracking-[0.4em] uppercase mb-2 font-light" style={{ color: headingAccent }}>Bonus Round</p>
          <h1 className="text-3xl font-light tracking-[0.2em] uppercase" style={{
            background: 'linear-gradient(90deg, #f472b6, #67e8f9, #fb923c)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {gameState === 'finished' ? 'You Won!' : 'Catch the Gifts!'}
          </h1>
        </motion.div>

        {/* HUD */}
        {gameState === 'playing' && (
          <motion.div className="flex items-center gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2">
              <Timer size={16} strokeWidth={1.6} style={{ color: headingAccent }} />
              <span className="font-mono text-lg font-bold" style={{ color: isDarkMode ? '#fff' : '#0f172a' }}>{timeLeft}s</span>
            </div>
            <div className="flex items-center gap-2">
              <Target size={16} strokeWidth={1.6} style={{ color: '#f472b6' }} />
              <span className="font-mono text-lg font-bold" style={{ color: isDarkMode ? '#fff' : '#0f172a' }}>{score}</span>
            </div>
          </motion.div>
        )}

        {/* Falling field */}
        {gameState !== 'finished' && (
          <div className="relative" style={{ width: '100%', maxWidth: 480, height: 300, border: `1px dashed ${fieldBorder}`, borderRadius: 16, overflow: 'hidden' }}>
            <AnimatePresence>
              {items.map(item => (
                <motion.button
                  key={item.id}
                  onPointerDown={() => handleCatch(item)}
                  disabled={gameState !== 'playing'}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `${item.x}%`, top: '-14%',
                    width: 64, height: 64, marginLeft: -32,
                    fontSize: '2.4rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                    cursor: gameState === 'playing' ? 'pointer' : 'default',
                    touchAction: 'manipulation',
                  }}
                  initial={{ top: '-14%', opacity: 1 }}
                  animate={{ top: '104%' }}
                  exit={{ opacity: 0, scale: 1.3, transition: { duration: 0.15 } }}
                  transition={{ duration: FALL_MS / 1000, ease: 'linear' }}
                  onAnimationComplete={() => handleMiss(item.id)}
                  whileTap={{ scale: 0.8 }}
                >
                  {item.emoji}
                </motion.button>
              ))}
            </AnimatePresence>

            {/* Catch burst */}
            <AnimatePresence>
              {caughtBurst && (
                <motion.div
                  key={caughtBurst.id}
                  className="absolute"
                  style={{ left: `${caughtBurst.x}%`, top: '40%', fontSize: '1.6rem', color: '#34d399', fontWeight: 800 }}
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -30, scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                >
                  +1 ✨
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ground line */}
            <div className="absolute bottom-0 left-0 right-0" style={{ height: 2, background: fieldBorder }} />
          </div>
        )}

        {/* Start button */}
        {gameState === 'idle' && (
          <motion.button onClick={handleStart}
            className="flex items-center gap-3 px-12 py-4 rounded-2xl text-sm tracking-[0.2em] uppercase font-semibold"
            style={{ background: startBtnBg, border: isDarkMode ? '1px solid rgba(236,72,153,0.55)' : 'none', color: '#fff', boxShadow: isDarkMode ? '0 0 40px rgba(236,72,153,0.2)' : '0 8px 32px rgba(236,72,153,0.35)' }}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            Start Catching!
          </motion.button>
        )}

        {/* Win card — identical layout/logic to the spin-wheel game */}
        <AnimatePresence>
          {gameState === 'finished' && wonSegment && couponCode && (
            <motion.div key="win-card" className="w-full max-w-lg"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 160, damping: 18 }}>

              <div className="text-center mb-4">
                <motion.p className="text-2xl font-light tracking-[0.15em] uppercase"
                  style={{ background: 'linear-gradient(90deg, #f472b6, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                  animate={{ opacity: [0.7,1,0.7] }} transition={{ duration: 2, repeat: Infinity }}>
                  {score} caught — {wonSegment.discount}% Off!
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
                background: winCardBg, border: `1px solid ${winCardBorder}`,
                backdropFilter: isDarkMode ? 'blur(24px)' : 'none', boxShadow: winCardShadow,
              }}>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Gift size={14} strokeWidth={1.5} style={{ color: 'rgba(236,72,153,0.8)' }} />
                    <span className="text-[9px] tracking-[0.35em] uppercase" style={{ color: promoLabelCol }}>{t('game.promoCode')}</span>
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
                <div className="shrink-0" style={{ padding: 6, background: qrWrapBg, border: `1px solid ${qrWrapBorder}`, borderRadius: 10 }}>
                  <CouponQR code={couponCode} size={110} />
                </div>
              </div>

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
    </div>
  )
}
