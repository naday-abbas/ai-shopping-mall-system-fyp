import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Play } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

// ── Scene 1: Tap the Circle ───────────────────────────────────────────────────
function SceneTap() {
  const [tap, setTap] = useState(false)
  useEffect(() => {
    const id = setInterval(() => setTap(v => !v), 1600)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer pulse rings */}
      {[1, 2, 3].map(r => (
        <motion.div key={r}
          animate={{ scale: tap ? [1, 1.8, 2.4] : [1, 1.3, 1.6], opacity: tap ? [0.7, 0.3, 0] : [0.4, 0.2, 0] }}
          transition={{ duration: 1.2, delay: r * 0.18, repeat: Infinity, repeatDelay: 0.4 }}
          style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', border: '2px solid rgba(56,189,248,0.6)', pointerEvents: 'none' }}
        />
      ))}
      {/* Main circle */}
      <motion.div
        animate={{ scale: tap ? [1, 0.88, 1.05, 1] : 1, boxShadow: tap ? ['0 0 30px rgba(56,189,248,0.6)', '0 0 60px rgba(56,189,248,0.9)', '0 0 30px rgba(56,189,248,0.6)'] : '0 0 30px rgba(56,189,248,0.5)' }}
        transition={{ duration: 0.5 }}
        style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(56,189,248,0.3), rgba(139,92,246,0.25))', border: '2px solid rgba(56,189,248,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}
      >
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <span style={{ fontSize: 28 }}>👆</span>
        </motion.div>
      </motion.div>
      {/* Animated finger tap */}
      <motion.div
        animate={{ y: tap ? [0, 14, 0] : 0, opacity: tap ? [0.7, 1, 0.5] : 0.7 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'absolute', bottom: 18, right: 22, fontSize: 28, filter: 'drop-shadow(0 4px 8px rgba(56,189,248,0.5))' }}
      >
        👆
      </motion.div>
      {/* Ripple on tap */}
      <AnimatePresence>
        {tap && (
          <motion.div key="ripple"
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', border: '2px solid rgba(56,189,248,0.9)', pointerEvents: 'none' }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Scene 2: Face Scan ────────────────────────────────────────────────────────
function SceneScan({ isDark }: { isDark: boolean }) {
  const { t } = useLanguage()
  const [scanDone, setScanDone] = useState(false)
  const [scanLine, setScanLine] = useState(0)
  useEffect(() => {
    const cycle = () => {
      setScanDone(false); setScanLine(0)
      const step = setInterval(() => setScanLine(v => { if (v >= 100) { clearInterval(step); setTimeout(() => setScanDone(true), 300); return 100 } return v + 2 }), 30)
    }
    cycle(); const id = setInterval(cycle, 4000)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ position: 'relative', width: 160, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Camera frame */}
      <div style={{ width: 140, height: 170, borderRadius: 16, border: `2px solid ${scanDone ? 'rgba(52,211,153,0.9)' : 'rgba(139,92,246,0.7)'}`, position: 'relative', overflow: 'hidden', background: isDark ? 'rgba(10,10,30,0.6)' : 'rgba(230,240,255,0.4)', transition: 'border-color 0.4s' }}>
        {/* Face silhouette */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -54%)', textAlign: 'center' }}>
          <div style={{ fontSize: 52 }}>🧑</div>
        </div>
        {/* Scan line */}
        {!scanDone && (
          <motion.div style={{ position: 'absolute', left: 0, right: 0, height: 2, top: `${scanLine}%`, background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.9), rgba(56,189,248,0.9), transparent)', boxShadow: '0 0 8px rgba(56,189,248,0.7)', pointerEvents: 'none' }} />
        )}
        {/* Corner brackets */}
        {[{ top: 4, left: 4 }, { top: 4, right: 4 }, { bottom: 4, left: 4 }, { bottom: 4, right: 4 }].map((pos, i) => (
          <div key={i} style={{ position: 'absolute', width: 14, height: 14, ...pos, borderColor: scanDone ? 'rgba(52,211,153,0.9)' : 'rgba(56,189,248,0.8)', borderStyle: 'solid', borderWidth: 0, ...(i === 0 ? { borderTopWidth: 2, borderLeftWidth: 2 } : i === 1 ? { borderTopWidth: 2, borderRightWidth: 2 } : i === 2 ? { borderBottomWidth: 2, borderLeftWidth: 2 } : { borderBottomWidth: 2, borderRightWidth: 2 }), transition: 'border-color 0.4s' }} />
        ))}
        {/* Success overlay */}
        <AnimatePresence>
          {scanDone && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.4 }} style={{ fontSize: 36 }}>✅</motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Status label */}
      <motion.div
        animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.4, repeat: Infinity }}
        style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', fontWeight: 700, color: scanDone ? 'rgba(52,211,153,0.9)' : 'rgba(139,92,246,0.9)', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}
      >
        {scanDone ? t('tutorial.detected') : t('tutorial.scanning')}
      </motion.div>
    </div>
  )
}

// ── Scene 3: Product Recommendations ─────────────────────────────────────────
function SceneProducts({ isDark }: { isDark: boolean }) {
  const { t } = useLanguage()
  const CARDS = [
    { emoji: '👗', label: t('tutorial.dresses'), color: 'rgba(244,114,182,0.8)' },
    { emoji: '👟', label: t('tutorial.shoes'),   color: 'rgba(56,189,248,0.8)' },
    { emoji: '💍', label: t('tutorial.jewelry'), color: 'rgba(251,191,36,0.8)' },
  ]
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
      {CARDS.map((c, i) => (
        <motion.div key={i}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: 68, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${c.color}55`, borderRadius: 14, padding: '14px 8px', textAlign: 'center', flexShrink: 0 }}
        >
          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}>
            <div style={{ fontSize: 28 }}>{c.emoji}</div>
          </motion.div>
          <div style={{ fontSize: '0.58rem', fontWeight: 700, color: c.color, marginTop: 6, letterSpacing: '0.06em' }}>{c.label}</div>
          <motion.div
            initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: 0.8 + i * 0.25, duration: 0.5 }}
            style={{ height: 2, background: c.color, borderRadius: 2, marginTop: 6 }}
          />
        </motion.div>
      ))}
    </div>
  )
}

// ── Scene 4: Spin & Win ───────────────────────────────────────────────────────
function SceneWheel() {
  const { t } = useLanguage()
  const [angle, setAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [won, setWon] = useState(false)
  const SLICES = ['5%', '10%', '15%', '20%', '25%', '30%']
  const COLORS = ['#f472b6', '#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#facc15']

  const spin = () => {
    if (spinning) return
    setSpinning(true); setWon(false)
    const extra = 1440 + Math.floor(Math.random() * 360)
    setAngle(a => a + extra)
    setTimeout(() => { setSpinning(false); setWon(true) }, 2500)
  }
  useEffect(() => { const t = setTimeout(spin, 400); return () => clearTimeout(t) }, [])
  useEffect(() => { if (won) { const t = setTimeout(() => { setWon(false); setTimeout(spin, 600) }, 2000); return () => clearTimeout(t) } }, [won])

  const r = 60
  const sliceAngle = (2 * Math.PI) / SLICES.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Wheel */}
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        {/* Pointer */}
        <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '16px solid #facc15', zIndex: 10, filter: 'drop-shadow(0 2px 4px rgba(250,204,21,0.7))' }} />
        <motion.svg width={140} height={140} viewBox="-70 -70 140 140"
          animate={{ rotate: angle }} transition={{ duration: 2.5, ease: [0.1, 0, 0.15, 1] }}
        >
          {SLICES.map((label, i) => {
            const a1 = i * sliceAngle - Math.PI / 2
            const a2 = a1 + sliceAngle
            const x1 = r * Math.cos(a1), y1 = r * Math.sin(a1)
            const x2 = r * Math.cos(a2), y2 = r * Math.sin(a2)
            const mx = (r * 0.65) * Math.cos((a1 + a2) / 2)
            const my = (r * 0.65) * Math.sin((a1 + a2) / 2)
            return (
              <g key={i}>
                <path d={`M0,0 L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`} fill={COLORS[i]} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
                <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight="bold" fill="#fff" style={{ pointerEvents: 'none', userSelect: 'none' }} transform={`rotate(${((a1 + a2) / 2 + Math.PI / 2) * (180 / Math.PI)}, ${mx}, ${my})`}>{label}</text>
              </g>
            )
          })}
          <circle cx={0} cy={0} r={10} fill="#1e293b" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
        </motion.svg>
        {/* Glow ring */}
        <motion.div animate={{ opacity: spinning ? [0.5, 1, 0.5] : 0.3 }} transition={{ duration: 0.5, repeat: Infinity }}
          style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid rgba(250,204,21,0.5)', pointerEvents: 'none' }} />
      </div>
      {/* Win message */}
      <AnimatePresence>
        {won && (
          <motion.div key="won" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 300 }}
            style={{ padding: '6px 18px', borderRadius: 20, background: 'rgba(250,204,21,0.2)', border: '1px solid rgba(250,204,21,0.6)', color: '#facc15', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.06em' }}>
            {t('tutorial.wonCoupon')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Scenes config ─────────────────────────────────────────────────────────────
const SCENES = [
  { step: '01', titleKey: 'tutorial.scene1.title', subKey: 'tutorial.scene1.sub', color: '#38bdf8' },
  { step: '02', titleKey: 'tutorial.scene2.title', subKey: 'tutorial.scene2.sub', color: '#a78bfa' },
  { step: '03', titleKey: 'tutorial.scene3.title', subKey: 'tutorial.scene3.sub', color: '#f472b6' },
  { step: '04', titleKey: 'tutorial.scene4.title', subKey: 'tutorial.scene4.sub', color: '#facc15' },
] as const
const SCENE_DURATION = 5000   // ms per scene

interface Props {
  isDarkMode: boolean
  activeEvent: { name: string; emoji: string; discountPercent: number; bannerColor: string } | null
  onClose: () => void
  onStart: () => void
}

export default function TutorialModal({ isDarkMode: isDark, activeEvent, onClose, onStart }: Props) {
  const { lang, t } = useLanguage()
  const [scene, setScene]   = useState(0)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const TICK = 50

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  const startTimer = () => {
    clearTimer()
    setProgress(0)
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { setScene(s => (s + 1) % SCENES.length); return 0 }
        return p + (TICK / SCENE_DURATION) * 100
      })
    }, TICK)
  }

  useEffect(() => { if (!paused) startTimer(); else clearTimer(); return clearTimer }, [paused, scene])

  const go = (dir: number) => {
    setScene(s => (s + dir + SCENES.length) % SCENES.length)
    setProgress(0)
    if (!paused) startTimer()
  }

  const SceneAnim = [
    () => <SceneTap />,
    () => <SceneScan isDark={isDark} />,
    () => <SceneProducts isDark={isDark} />,
    () => <SceneWheel />,
  ][scene]


  return (
    <motion.div
      key="tut-backdrop"
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', background: 'rgba(0,0,0,0.72)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        key="tut-card"
        initial={{ opacity: 0, scale: 0.88, y: 32 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 500, position: 'relative', overflow: 'hidden',
          background: isDark ? 'rgba(4,8,24,0.97)' : 'rgba(255,255,255,0.98)',
          border: `1px solid ${SCENES[scene].color}33`,
          borderRadius: 28,
          boxShadow: `0 0 80px ${SCENES[scene].color}1a, 0 40px 80px rgba(0,0,0,0.75)`,
          transition: 'border-color 0.5s, box-shadow 0.5s',
          fontFamily: lang === 'ur' ? "'Noto Nastaliq Urdu', serif" : undefined,
        }}
      >
        {/* Top glow line */}
        <div style={{ position: 'absolute', top: 0, left: '5%', right: '5%', height: 1, background: `linear-gradient(90deg, transparent, ${SCENES[scene].color}aa, transparent)`, transition: 'background 0.5s', pointerEvents: 'none' }} />

        {/* Progress bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            style={{ height: '100%', background: `linear-gradient(90deg, ${SCENES[scene].color}cc, ${SCENES[scene].color})`, width: `${progress}%`, transition: 'background 0.5s' }}
          />
        </div>

        {/* Close */}
        <motion.button onClick={onClose} whileTap={{ scale: 0.9 }}
          style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <X size={13} style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }} />
        </motion.button>

        {/* Header */}
        <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.58rem', letterSpacing: '0.32em', textTransform: 'uppercase', color: SCENES[scene].color, fontWeight: 800, marginBottom: 3, transition: 'color 0.5s' }}>
              {t('tutorial.howItWorks')}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: isDark ? 'rgba(226,232,240,0.92)' : '#0f172a', letterSpacing: '-0.01em' }}>
              {t('tutorial.kioskName')}
            </div>
          </div>
          {/* Pause/Play */}
          <motion.button onClick={() => setPaused(p => !p)} whileTap={{ scale: 0.9 }}
            style={{ padding: '5px 14px', borderRadius: 20, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: isDark ? 'rgba(148,163,184,0.8)' : '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>
            {paused ? <Play size={11} /> : <span style={{ display: 'flex', gap: 2 }}><span style={{ width: 3, height: 10, background: 'currentColor', borderRadius: 1 }} /><span style={{ width: 3, height: 10, background: 'currentColor', borderRadius: 1 }} /></span>}
            {paused ? t('tutorial.play') : t('tutorial.pause')}
          </motion.button>
        </div>

        {/* Scene Dots */}
        <div style={{ display: 'flex', gap: 6, padding: '14px 28px 0', alignItems: 'center' }}>
          {SCENES.map((_, i) => (
            <motion.button key={i} onClick={() => { setScene(i); setProgress(0); if (!paused) startTimer() }}
              animate={{ width: i === scene ? 28 : 8, background: i === scene ? SCENES[scene].color : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)') }}
              transition={{ duration: 0.3 }}
              style={{ height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0 }}
            />
          ))}
          <div style={{ marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700, color: isDark ? 'rgba(148,163,184,0.6)' : '#94a3b8' }}>
            {scene + 1} / {SCENES.length}
          </div>
        </div>

        {/* Animation Area */}
        <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Radial glow background */}
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${SCENES[scene].color}10 0%, transparent 70%)`, transition: 'background 0.6s', pointerEvents: 'none' }} />
          <AnimatePresence mode="wait">
            <motion.div key={scene}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <SceneAnim />
            </motion.div>
          </AnimatePresence>
          {/* Left / Right tap zones */}
          <button onClick={() => go(-1)} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 12, opacity: 0.4, zIndex: 5 }}>
            <ChevronLeft size={20} style={{ color: isDark ? 'white' : '#475569' }} />
          </button>
          <button onClick={() => go(1)} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 12, opacity: 0.4, zIndex: 5 }}>
            <ChevronRight size={20} style={{ color: isDark ? 'white' : '#475569' }} />
          </button>
        </div>

        {/* Step info */}
        <div style={{ padding: '0 28px 20px', textAlign: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.div key={scene}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: `${SCENES[scene].color}22`, border: `1px solid ${SCENES[scene].color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: SCENES[scene].color }}>
                    {SCENES[scene].step}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: isDark ? 'rgba(226,232,240,0.93)' : '#0f172a', letterSpacing: '-0.01em' }}>
                  {t(SCENES[scene].titleKey)}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: isDark ? 'rgba(100,116,139,0.9)' : '#64748b', lineHeight: 1.55 }}>
                {t(SCENES[scene].subKey)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Active Event Strip */}
        {activeEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ margin: '0 20px', padding: '8px 14px', borderRadius: 12, background: `${activeEvent.bannerColor}12`, border: `1px solid ${activeEvent.bannerColor}40`, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: '1.1rem' }}>{activeEvent.emoji}</span>
            <span style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700, color: isDark ? 'rgba(226,232,240,0.88)' : '#1e293b' }}>
              {activeEvent.name} — {t('tutorial.eventDeal')}
            </span>
            <span style={{ padding: '2px 10px', borderRadius: 20, background: `${activeEvent.bannerColor}25`, border: `1px solid ${activeEvent.bannerColor}55`, color: activeEvent.bannerColor, fontWeight: 800, fontSize: '0.72rem' }}>
              {t('tutorial.off', { pct: activeEvent.discountPercent })}
            </span>
          </motion.div>
        )}

        {/* Bottom buttons */}
        <div style={{ display: 'flex', gap: 10, padding: '0 20px 22px' }}>
          <motion.button onClick={onClose} whileTap={{ scale: 0.97 }}
            style={{ flex: 1, padding: '11px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', borderRadius: 12, color: isDark ? 'rgba(148,163,184,0.8)' : '#64748b', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
            {t('tutorial.skip')}
          </motion.button>
          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.02, boxShadow: `0 0 36px ${SCENES[scene].color}44` }}
            whileTap={{ scale: 0.97 }}
            style={{ flex: 2, padding: '11px', background: `linear-gradient(135deg, ${SCENES[scene].color}30, ${SCENES[scene].color}18)`, border: `1px solid ${SCENES[scene].color}55`, borderRadius: 12, color: SCENES[scene].color, fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', letterSpacing: '0.04em', transition: 'border-color 0.5s, color 0.5s', boxShadow: `0 0 20px ${SCENES[scene].color}22` }}
          >
            {t('tutorial.start')}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
