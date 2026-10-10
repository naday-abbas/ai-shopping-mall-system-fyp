import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Fingerprint, Wifi, ShieldCheck, Sparkles, ShoppingBag, Gift, CheckCircle2, X, HelpCircle } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useTheme } from '../ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'
import { getWeatherInfo, type WeatherInfo } from '../services/weatherService'
import TutorialModal from './TutorialModal'

// ── Particles ─────────────────────────────────────────────────────────────────

const DARK_PARTICLES = Array.from({ length: 48 }, (_, i) => ({
  id:    i,
  x:     `${(i * 41 + 7)  % 94}%`,
  y:     `${(i * 67 + 11) % 90}%`,
  size:  i % 6 === 0 ? 4.5 : i % 6 === 1 ? 3 : i % 6 === 2 ? 2 : i % 6 === 3 ? 1.5 : i % 6 === 4 ? 1 : 2.5,
  dur:   3.5 + (i % 7) * 0.8,
  delay: (i * 0.28) % 4.5,
  color: [
    'rgba(56,189,248,0.85)',
    'rgba(139,92,246,0.85)',
    'rgba(244,63,94,0.8)',
    'rgba(251,191,36,0.75)',
    'rgba(255,255,255,0.6)',
    'rgba(52,211,153,0.8)',
  ][i % 6],
}))

const LIGHT_PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  id:    i,
  x:     `${(i * 41 + 7)  % 94}%`,
  y:     `${(i * 67 + 11) % 90}%`,
  size:  i % 4 === 0 ? 5 : i % 4 === 1 ? 3.5 : i % 4 === 2 ? 2 : 4,
  dur:   4 + (i % 6) * 0.9,
  delay: (i * 0.35) % 5,
  color: [
    'rgba(236,72,153,0.5)',
    'rgba(6,182,212,0.45)',
    'rgba(251,146,60,0.4)',
    'rgba(139,92,246,0.4)',
  ][i % 4],
}))

// ── Pulse rings ───────────────────────────────────────────────────────────────

const DARK_RINGS = [
  { size: 280, color: 'rgba(56,189,248,0.5)',   glow: 'rgba(56,189,248,0.2)',   delay: 0   },
  { size: 380, color: 'rgba(139,92,246,0.38)',  glow: 'rgba(139,92,246,0.15)', delay: 0.9 },
  { size: 490, color: 'rgba(244,63,94,0.25)',   glow: 'rgba(244,63,94,0.1)',   delay: 1.8 },
]

const LIGHT_RINGS = [
  { size: 280, color: 'rgba(236,72,153,0.4)',  glow: 'rgba(236,72,153,0.12)', delay: 0   },
  { size: 380, color: 'rgba(6,182,212,0.3)',   glow: 'rgba(6,182,212,0.1)',   delay: 0.9 },
  { size: 490, color: 'rgba(251,146,60,0.2)',  glow: 'rgba(251,146,60,0.08)', delay: 1.8 },
]

// ── Feature chips ─────────────────────────────────────────────────────────────

const DARK_CHIPS = [
  { Icon: Sparkles,    key: 'attract.chip.ai'    as const, bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.35)',  fg: 'rgba(125,211,252,0.95)' },
  { Icon: ShoppingBag, key: 'attract.chip.picks' as const, bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', fg: 'rgba(196,181,253,0.95)' },
  { Icon: Gift,        key: 'attract.chip.spin'  as const, bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.35)',  fg: 'rgba(253,164,175,0.95)' },
]

const LIGHT_CHIPS = [
  { Icon: Sparkles,    key: 'attract.chip.ai'    as const, bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.3)',   fg: '#0891b2' },
  { Icon: ShoppingBag, key: 'attract.chip.picks' as const, bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.3)', fg: '#db2777' },
  { Icon: Gift,        key: 'attract.chip.spin'  as const, bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.3)', fg: '#ea580c' },
]

// ── AttractLoop ───────────────────────────────────────────────────────────────

export default function AttractLoop() {
  const navigate   = useNavigate()
  const isDarkMode = useTheme()
  const { lang, t } = useLanguage()
  const [time,        setTime]        = useState(new Date())
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null)
  const [showConsent, setShowConsent] = useState(false)
  const [showHelp,    setShowHelp]    = useState(false)
  const [activeEvent, setActiveEvent] = useState<{ name: string; emoji: string; discountPercent: number; bannerColor: string } | null>(null)

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    getWeatherInfo()
      .then(setWeatherInfo)
      .catch(err => console.error('[Weather] fetch failed:', err?.message ?? err))
  }, [])

  useEffect(() => {
    axios.get('/api/events/active').then(r => setActiveEvent(r.data.data)).catch(() => {})
  }, [])

  const formattedTime = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const formattedDate = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const PARTICLES = isDarkMode ? DARK_PARTICLES : LIGHT_PARTICLES
  const RINGS     = isDarkMode ? DARK_RINGS     : LIGHT_RINGS
  const CHIPS     = isDarkMode ? DARK_CHIPS     : LIGHT_CHIPS

  // Derived colors
  const pageBg       = isDarkMode ? '#050818' : '#f8fafc'
  const dotGrid      = isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)'
  const vignette     = isDarkMode ? `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 30%, #050818 100%)` : `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 30%, #f8fafc 100%)`
  const fillDark     = isDarkMode ? '#050818' : '#f8fafc'
  const dateCls      = isDarkMode ? 'rgba(148,163,184,0.45)' : '#94a3b8'
  const clockGrad    = isDarkMode ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(125,211,252,0.85) 100%)' : 'linear-gradient(135deg, #0f172a 0%, #0891b2 100%)'
  const subtitleCol  = isDarkMode ? 'rgba(148,163,184,0.6)' : '#94a3b8'
  const accentCol    = isDarkMode ? 'rgba(125,211,252,0.8)' : '#0891b2'
  const dotBullet    = isDarkMode ? 'linear-gradient(135deg, #38bdf8, #818cf8)' : 'linear-gradient(135deg, #ec4899, #06b6d4)'
  const dotGlow      = isDarkMode ? 'rgba(56,189,248,0.9)' : 'rgba(236,72,153,0.9)'
  const nexusFill    = isDarkMode ? 'radial-gradient(circle at 35% 30%, rgba(56,189,248,0.14), rgba(139,92,246,0.08) 55%, rgba(255,255,255,0.02))' : 'radial-gradient(circle at 35% 30%, rgba(6,182,212,0.12), rgba(236,72,153,0.08) 55%, rgba(255,255,255,0.4))'
  const nexusBorder  = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const nexusShadow  = isDarkMode ? '0 0 80px rgba(56,189,248,0.22), 0 0 40px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.1)' : '0 0 60px rgba(6,182,212,0.18), 0 0 30px rgba(236,72,153,0.12), inset 0 1px 0 rgba(255,255,255,0.6)'
  const iconCol      = isDarkMode ? '#38bdf8' : '#ec4899'
  const iconGlow     = isDarkMode ? 'drop-shadow(0 0 18px rgba(56,189,248,0.85))' : 'drop-shadow(0 0 18px rgba(236,72,153,0.7))'
  const touchLabel   = isDarkMode ? 'rgba(148,163,184,0.65)' : '#64748b'
  const ctaGrad      = isDarkMode ? 'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(125,211,252,0.85))' : 'linear-gradient(90deg, #0f172a, #0891b2)'
  const ctaSubCol    = isDarkMode ? 'rgba(100,116,139,0.7)' : '#94a3b8'
  const bottomCol    = isDarkMode ? 'rgba(100,116,139,0.6)' : '#64748b'
  const bottomDivider= isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const cornerL      = isDarkMode ? 'rgba(56,189,248,0.55)'  : 'rgba(236,72,153,0.4)'
  const cornerR      = isDarkMode ? 'rgba(139,92,246,0.55)' : 'rgba(6,182,212,0.4)'

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: pageBg, fontFamily: lang === 'ur' ? "'Noto Nastaliq Urdu', serif" : "'Inter', 'Manrope', system-ui, sans-serif" }}
    >

      {/* LAYER 0 — Background blobs */}
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
          <motion.div className="absolute pointer-events-none"
            style={{ width: 480, height: 480, bottom: '10%', left: '5%', background: 'radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 65%)', filter: 'blur(50px)' }}
            animate={{ x: [0,30,-10,0], y: [0,-30,20,0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 6 }} />
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
            style={{ width: 560, height: 560, top: '5%', left: '40%', background: 'radial-gradient(circle, rgba(253,186,116,0.28) 0%, transparent 65%)', filter: 'blur(50px)' }}
            animate={{ x: [0,-30,20,0], y: [0,50,-8,0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
        </>
      )}

      {/* LAYER 1 — Dot grid + vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, ${dotGrid} 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: vignette }} />

      {/* LAYER 2 — Particles */}
      {PARTICLES.map(p => (
        <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
          style={{ width: p.size, height: p.size, top: p.y, left: p.x, background: p.color }}
          animate={{ opacity: [0.04, 0.95, 0.04], y: [0,-14,0], scale: [1,1.7,1] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }} />
      ))}

      {/* LAYER 3 — Pulse rings */}
      {RINGS.map((ring, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            width: ring.size, height: ring.size,
            left: '50%', top: '50%',
            marginLeft: -ring.size / 2, marginTop: -ring.size / 2,
            border: `1px solid ${ring.color}`,
            boxShadow: `0 0 24px ${ring.glow}, inset 0 0 24px ${ring.glow}`,
          }}
          animate={{ scale: [1,1.2,1], opacity: [0.85,0,0.85] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: ring.delay, ease: 'easeOut' }} />
      ))}

      {/* LAYOUT */}
      <div className="absolute inset-0 flex flex-col">

        {/* TOP BAR */}
        <motion.div className="flex justify-between items-start px-14 pt-10 shrink-0"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15 }}>
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotBullet, boxShadow: `0 0 10px ${dotGlow}` }} />
              <span style={{ fontSize: 10, letterSpacing: '0.38em', textTransform: 'uppercase', color: accentCol, fontWeight: 600 }}>
                {t('attract.badge')}
              </span>
            </div>
            <p style={{ color: dateCls, fontSize: 13, letterSpacing: '0.06em', fontWeight: 300 }}>{formattedDate}</p>
          </div>

          <div className="text-right" style={{ background: 'transparent' }}>
            <motion.p
              style={{ fontSize: 60, fontWeight: 200, letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, background: 'transparent' }}
              animate={{ opacity: [0.88, 1, 0.88] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
              <span key={String(isDarkMode)} style={{ display: 'inline-block', background: clockGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {formattedTime}
              </span>
            </motion.p>

            {weatherInfo && (
              <motion.div
                className="flex items-center justify-end gap-1.5 mt-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                <span style={{ fontSize: 15 }}>{weatherInfo.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: accentCol }}>
                  {weatherInfo.tempC}°C
                </span>
                <span style={{ fontSize: 11, color: dateCls }}>·</span>
                <span style={{ fontSize: 11, letterSpacing: '0.06em', color: dateCls }}>
                  {weatherInfo.label}
                </span>
                {weatherInfo.city && (
                  <>
                    <span style={{ fontSize: 11, color: dateCls }}>·</span>
                    <span style={{ fontSize: 11, color: subtitleCol }}>{weatherInfo.city}</span>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col items-center justify-center gap-9">

          {/* Heading */}
          <motion.div className="text-center"
            style={{ background: 'transparent' }}
            initial={{ opacity: 0, y: -28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }}>
            <h1 style={{ fontSize: 58, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1, background: 'transparent', marginBottom: 12 }}>
              <span key={String(isDarkMode)} style={{
                display: 'inline-block',
                background: isDarkMode
                  ? 'linear-gradient(135deg, #38bdf8 0%, #818cf8 45%, #f472b6 100%)'
                  : 'linear-gradient(135deg, #ec4899 0%, #06b6d4 60%, #fb923c 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Smart Mall
              </span>
            </h1>

            <div className="flex items-center justify-center gap-3">
              <div style={{ height: 1, width: 60, background: isDarkMode ? 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6))' : 'linear-gradient(90deg, transparent, rgba(236,72,153,0.5))' }} />
              <span style={{ fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase', color: subtitleCol, fontWeight: 400 }}>
                {t('attract.subtitle')}
              </span>
              <div style={{ height: 1, width: 60, background: isDarkMode ? 'linear-gradient(270deg, transparent, rgba(139,92,246,0.6))' : 'linear-gradient(270deg, transparent, rgba(6,182,212,0.5))' }} />
            </div>
          </motion.div>

          {/* CENTRAL NEXUS */}
          <motion.div className="relative flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.45, type: 'spring', stiffness: 120, damping: 16 }}>

            {/* Spinning gradient ring */}
            <motion.div className="absolute rounded-full pointer-events-none"
              style={{
                width: 268, height: 268, padding: 2.5,
                background: isDarkMode
                  ? 'conic-gradient(from 0deg, #38bdf8, #818cf8, #f472b6, #fb923c, #34d399, #38bdf8)'
                  : 'conic-gradient(from 0deg, #ec4899, #06b6d4, #fb923c, #ec4899)',
              }}
              animate={{ rotate: 360 }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}>
              <div className="w-full h-full rounded-full" style={{ background: fillDark }} />
            </motion.div>

            {/* Dashed orbit */}
            <motion.div className="absolute rounded-full pointer-events-none"
              style={{ width: 230, height: 230, border: `1px dashed ${isDarkMode ? 'rgba(139,92,246,0.28)' : 'rgba(236,72,153,0.2)'}` }}
              animate={{ rotate: -360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }} />

            {/* Orbiting dot */}
            <motion.div className="absolute pointer-events-none" style={{ width: 268, height: 268 }}
              animate={{ rotate: 360 }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}>
              <div style={{
                position: 'absolute', top: 0, left: '50%', marginLeft: -4, marginTop: -4,
                width: 8, height: 8, borderRadius: '50%',
                background: isDarkMode ? '#fff' : '#ec4899',
                boxShadow: isDarkMode ? '0 0 12px 4px rgba(255,255,255,0.7)' : '0 0 12px 4px rgba(236,72,153,0.6)',
              }} />
            </motion.div>

            {/* Glass inner card */}
            <motion.div className="relative z-10 flex flex-col items-center justify-center gap-2.5 rounded-full cursor-pointer"
              style={{
                width: 200, height: 200,
                background: nexusFill,
                backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
                border: `1px solid ${nexusBorder}`,
                boxShadow: nexusShadow,
              }}
              onClick={() => setShowConsent(true)}
              whileTap={{ scale: 0.95 }}
              animate={{ scale: [1,1.04,1] }} transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}>
              <motion.div animate={{ opacity: [0.78,1,0.78], scale: [1,1.09,1] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}>
                <Fingerprint size={62} strokeWidth={0.95} style={{ color: iconCol, filter: iconGlow }} />
              </motion.div>
              <span style={{ fontSize: 8.5, letterSpacing: '0.52em', textTransform: 'uppercase', color: touchLabel, fontWeight: 600 }}>
                {t('attract.touchHere')}
              </span>
            </motion.div>
          </motion.div>

          {/* CTA */}
          <motion.div className="text-center"
            style={{ background: 'transparent' }}
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6 }}>
            <motion.p
              style={{ fontSize: 26, fontWeight: 300, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'transparent' }}
              animate={{ opacity: [0.55,1,0.55] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}>
              <span key={String(isDarkMode)} style={{ display: 'inline-block', background: ctaGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {t('attract.cta')}
              </span>
            </motion.p>
            <p style={{ fontSize: 12, letterSpacing: '0.18em', color: ctaSubCol, marginTop: 10, fontWeight: 400 }}>
              {t('attract.ctaSub')}
            </p>
          </motion.div>

          {/* Feature chips */}
          <motion.div className="flex items-center gap-4"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.75 }}>
            {CHIPS.map(({ Icon, key, bg, border, fg }, i) => (
              <motion.div key={key} className="flex items-center gap-2 rounded-full"
                style={{ padding: '9px 18px', background: bg, border: `1px solid ${border}`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
                animate={{ y: [0,-5,0] }} transition={{ duration: 3.2 + i * 0.6, repeat: Infinity, delay: i * 0.45, ease: 'easeInOut' }}>
                <Icon size={13} strokeWidth={1.8} style={{ color: fg, flexShrink: 0 }} />
                <span style={{ fontSize: 11, letterSpacing: '0.06em', color: fg, fontWeight: 600, whiteSpace: 'nowrap' }}>{t(key)}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* BOTTOM BAR */}
        <motion.div className="flex justify-between items-center px-14 pb-9 shrink-0"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.85 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="flex items-center gap-2" style={{ color: bottomCol }}>
              <ShieldCheck size={13} strokeWidth={1.5} />
              <span style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 400 }}>
                {t('attract.privacy')}
              </span>
            </div>
            <motion.button
              onClick={() => setShowHelp(true)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 20,
                background: isDarkMode ? 'rgba(56,189,248,0.1)' : 'rgba(6,182,212,0.08)',
                border: isDarkMode ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(6,182,212,0.25)',
                cursor: 'pointer',
              }}
            >
              <HelpCircle size={12} strokeWidth={2} style={{ color: isDarkMode ? 'rgba(125,211,252,0.85)' : '#0891b2' }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: isDarkMode ? 'rgba(125,211,252,0.85)' : '#0891b2' }}>
                {t('attract.help')}
              </span>
            </motion.button>
          </div>

          <div className="flex items-center gap-4" style={{ color: bottomCol }}>
            <div className="flex items-center gap-2">
              <motion.div className="rounded-full"
                style={{ width: 7, height: 7, background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.9)' }}
                animate={{ opacity: [1,0.25,1] }} transition={{ duration: 2.2, repeat: Infinity }} />
              <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 400 }}>{t('attract.systemOnline')}</span>
            </div>
            <div style={{ width: 1, height: 14, background: bottomDivider }} />
            <div className="flex items-center gap-1.5">
              <Wifi size={11} strokeWidth={1.5} />
              <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 400 }}>{t('attract.aiReady')}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Consent / Privacy Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showConsent && (
          <motion.div
            key="consent-backdrop"
            className="absolute inset-0 flex items-center justify-center z-50"
            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              key="consent-card"
              initial={{ opacity: 0, scale: 0.9, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: 420, position: 'relative', overflow: 'hidden',
                background: isDarkMode ? 'rgba(6,9,28,0.94)' : 'rgba(255,255,255,0.96)',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: 24, padding: '36px 36px 30px',
                boxShadow: isDarkMode
                  ? '0 0 80px rgba(52,211,153,0.1), 0 32px 64px rgba(0,0,0,0.7)'
                  : '0 32px 64px rgba(0,0,0,0.12)',
              }}
            >
              {/* Top shimmer */}
              <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.7), transparent)', pointerEvents: 'none' }} />

              {/* Close */}
              <motion.button onClick={() => setShowConsent(false)} whileTap={{ scale: 0.9 }}
                style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={13} style={{ color: isDarkMode ? 'rgba(255,255,255,0.4)' : '#94a3b8' }} />
              </motion.button>

              {/* Icon + Title row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(56,189,248,0.12))', border: '1px solid rgba(52,211,153,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(52,211,153,0.2)' }}>
                  <ShieldCheck size={26} strokeWidth={1.4} style={{ color: '#34d399', filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.7))' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(52,211,153,0.75)', fontWeight: 700, marginBottom: 4 }}>{t('consent.badge')}</div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, background: isDarkMode ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(125,211,252,0.8))' : 'linear-gradient(135deg, #0f172a, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.02em' }}>
                    {t('consent.title')}
                  </h2>
                </div>
              </div>

              {/* 3 points — compact */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
                {[
                  { icon: '🎯', key: 'consent.point1' as const },
                  { icon: '🎁', key: 'consent.point2' as const },
                  { icon: '🔒', key: 'consent.point3' as const },
                ].map(({ icon, key }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(16,185,129,0.04)', border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(16,185,129,0.1)' }}>
                    <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: '0.78rem', color: isDarkMode ? 'rgba(203,213,225,0.85)' : '#334155', fontWeight: 500, lineHeight: 1.4 }}>{t(key)}</span>
                    <CheckCircle2 size={14} strokeWidth={2} style={{ color: '#34d399', flexShrink: 0, marginLeft: 'auto' }} />
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button
                  onClick={() => navigate('/scan')}
                  whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(52,211,153,0.45)' }}
                  whileTap={{ scale: 0.96 }}
                  style={{ flex: 1, padding: '13px', background: 'linear-gradient(135deg, #34d399, #059669)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', boxShadow: '0 0 28px rgba(52,211,153,0.3)' }}
                >
                  {t('consent.agree')}
                </motion.button>
                <motion.button
                  onClick={() => setShowConsent(false)}
                  whileTap={{ scale: 0.96 }}
                  style={{ padding: '13px 18px', background: 'transparent', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', borderRadius: 12, color: isDarkMode ? 'rgba(148,163,184,0.6)' : '#64748b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  {t('consent.decline')}
                </motion.button>
              </div>

              <p style={{ textAlign: 'center', marginTop: 14, marginBottom: 0, fontSize: '0.62rem', color: isDarkMode ? 'rgba(100,116,139,0.55)' : '#94a3b8', letterSpacing: '0.03em' }}>
                {t('consent.footer')}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Help / Tutorial Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showHelp && (
          <TutorialModal
            isDarkMode={isDarkMode}
            activeEvent={activeEvent}
            onClose={() => setShowHelp(false)}
            onStart={() => { setShowHelp(false); setShowConsent(true) }}
          />
        )}
      </AnimatePresence>

      {/* Corner accent brackets */}
      {[
        { cls: 'top-5 left-5 border-t-2 border-l-2 rounded-tl-lg',     tl: cornerL  },
        { cls: 'top-5 right-5 border-t-2 border-r-2 rounded-tr-lg',    tl: cornerR  },
        { cls: 'bottom-5 left-5 border-b-2 border-l-2 rounded-bl-lg',  tl: cornerR  },
        { cls: 'bottom-5 right-5 border-b-2 border-r-2 rounded-br-lg', tl: cornerL  },
      ].map(({ cls, tl }, i) => (
        <div key={i} className={`absolute w-10 h-10 pointer-events-none ${cls}`} style={{ borderColor: tl }} />
      ))}
    </div>
  )
}
