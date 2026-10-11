import { useRef, useState, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ScanLine, Cpu, UserRound, ShoppingBag, ChevronRight,
  AlertTriangle, CameraOff, RefreshCw, Scan, MapPin, Timer, Gift, X, Upload, AlertCircle, CheckCircle2, Store,
} from 'lucide-react'
import { useTheme } from '../ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'
import type { TranslationKey } from '../i18n/translations'
import { getWeatherInfo, type WeatherInfo } from '../services/weatherService'
import { useFaceDetection } from '../hooks/useFaceDetection'
import FaceDetectionOverlay from '../components/FaceDetectionOverlay'

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'scanning' | 'result' | 'error'

interface StoreLocation { floor: string; storeNumber: string }

interface Product {
  _id: string
  name: string
  brand?: string
  description?: string
  imageUrl: string
  category: string
  price: number
  storeName?: string
  storeLocation: StoreLocation
  clickCount: number
}

interface ScanResult {
  success: boolean
  age_category: string
  gender: string
  age_confidence: number
  gender_confidence: number
  sessionId: string | null
  products: Product[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const IDLE_TIMEOUT_MS = 45_000

const LOADER_STEPS: TranslationKey[] = [
  'scan.loader1',
  'scan.loader2',
  'scan.loader3',
  'scan.loader4',
  'scan.loader5',
]

const CATEGORY_EMOJI: Record<string, string> = {
  Clothes:     '👔',
  Food:        '🍔',
  Accessories: '⌚',
  Electronics: '📱',
  Other:       '📦',
}

// Light-background category palette
const CAT_LIGHT: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
  Clothes:     { bg: '#fdf2f8', border: '#f9a8d4', text: '#db2777', shadow: 'rgba(236,72,153,0.18)'  },
  Food:        { bg: '#fff7ed', border: '#fdba74', text: '#ea580c', shadow: 'rgba(251,146,60,0.18)'  },
  Accessories: { bg: '#ecfeff', border: '#67e8f9', text: '#0891b2', shadow: 'rgba(6,182,212,0.18)'   },
  Electronics: { bg: '#f5f3ff', border: '#c4b5fd', text: '#7c3aed', shadow: 'rgba(139,92,246,0.18)'  },
  Other:       { bg: '#f8fafc', border: '#cbd5e1', text: '#475569', shadow: 'rgba(71,85,105,0.12)'   },
}

// Dark-background (neon) category palette — original cyberpunk aesthetic
const CAT_DARK: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
  Clothes:     { bg: 'rgba(236,72,153,0.18)',  border: 'rgba(236,72,153,0.6)',  text: 'rgba(249,168,212,0.95)', shadow: 'rgba(236,72,153,0.45)' },
  Food:        { bg: 'rgba(251,146,60,0.18)',  border: 'rgba(251,146,60,0.6)',  text: 'rgba(253,186,116,0.95)', shadow: 'rgba(251,146,60,0.45)'  },
  Accessories: { bg: 'rgba(6,182,212,0.18)',   border: 'rgba(6,182,212,0.6)',   text: 'rgba(103,232,249,0.95)', shadow: 'rgba(6,182,212,0.45)'   },
  Electronics: { bg: 'rgba(139,92,246,0.18)',  border: 'rgba(139,92,246,0.6)',  text: 'rgba(196,181,253,0.95)', shadow: 'rgba(139,92,246,0.45)'  },
  Other:       { bg: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.2)', text: 'rgba(255,255,255,0.8)',  shadow: 'rgba(255,255,255,0.2)'  },
}

// Animated neon blobs for dark mode (restored original)
const DARK_COLOR_LAYERS = [
  { bg: 'radial-gradient(ellipse 55% 45% at 10% 20%, rgba(236,72,153,0.28) 0%, transparent 70%)', dx: [0, 40, 10, 0], dy: [0, 25, -15, 0], dur: 10 },
  { bg: 'radial-gradient(ellipse 50% 50% at 90% 80%, rgba(6,182,212,0.22) 0%, transparent 70%)',  dx: [0, -50, -15, 0], dy: [0, -35, 20, 0], dur: 13 },
  { bg: 'radial-gradient(ellipse 45% 40% at 75% 10%, rgba(251,146,60,0.18) 0%, transparent 70%)', dx: [0, -20, 35, 0], dy: [0, 45, 10, 0], dur: 9, delay: 1 },
]

// Static pastel blobs for light mode
const PASTEL_LAYERS = [
  'radial-gradient(ellipse 70% 60% at 0% 0%,   rgba(249,168,212,0.38) 0%, transparent 70%)',
  'radial-gradient(ellipse 60% 60% at 100% 100%, rgba(165,243,252,0.32) 0%, transparent 70%)',
  'radial-gradient(ellipse 45% 45% at 88% 8%,  rgba(253,186,116,0.22) 0%, transparent 70%)',
  'radial-gradient(ellipse 50% 50% at 50% 100%, rgba(196,181,253,0.18) 0%, transparent 70%)',
]

// ─── ScanningOverlay (always overlays the dark webcam feed) ──────────────────

function ScanningOverlay() {
  const corners = [
    { cls: 'top-0 left-0 border-t-2 border-l-2 rounded-tl-sm',    color: 'rgba(236,72,153,0.9)' },
    { cls: 'top-0 right-0 border-t-2 border-r-2 rounded-tr-sm',   color: 'rgba(6,182,212,0.9)'  },
    { cls: 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-sm',  color: 'rgba(6,182,212,0.9)'  },
    { cls: 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-sm', color: 'rgba(236,72,153,0.9)' },
  ]
  return (
    <>
      {corners.map(({ cls, color }, i) => (
        <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: color }} />
      ))}
      <motion.div
        className="absolute left-2 right-2 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.9), transparent)',
          boxShadow: '0 0 12px rgba(6,182,212,0.8)',
        }}
        animate={{ top: ['10%', '90%', '10%'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-x-[18%] top-[10%] bottom-[15%] rounded-full pointer-events-none"
        style={{ border: '1px solid rgba(6,182,212,0.3)' }}
      />
    </>
  )
}

// ─── AnalysingLoader (always dark — dramatic temporary full-screen overlay) ──

function AnalysingLoader({ step }: { step: TranslationKey }) {
  const { t } = useLanguage()
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center gap-10"
      style={{ background: 'rgba(4,0,16,0.82)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {DARK_COLOR_LAYERS.map((layer, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 pointer-events-none"
          style={{ background: layer.bg }}
          animate={{ x: layer.dx, y: layer.dy }}
          transition={{ duration: layer.dur, repeat: Infinity, ease: 'easeInOut', delay: (layer as any).delay ?? 0 }}
        />
      ))}

      <div className="relative flex items-center justify-center z-10">
        {[
          { size: 136, color: 'rgba(236,72,153,0.35)', glow: 'rgba(236,72,153,0.15)', delay: 0   },
          { size: 192, color: 'rgba(6,182,212,0.28)',  glow: 'rgba(6,182,212,0.10)',  delay: 0.5 },
          { size: 248, color: 'rgba(251,146,60,0.20)', glow: 'rgba(251,146,60,0.08)', delay: 1   },
        ].map((ring, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ width: ring.size, height: ring.size, border: `1px solid ${ring.color}`, boxShadow: `0 0 20px ${ring.glow}` }}
            animate={{ scale: [1, 1.14, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: ring.delay, ease: 'easeOut' }}
          />
        ))}
        <motion.div
          className="absolute w-24 h-24 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 60%, rgba(236,72,153,0.8) 80%, rgba(6,182,212,0.6) 92%, transparent 100%)',
            filter: 'blur(2px)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center relative z-10"
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(6,182,212,0.3), 0 0 20px rgba(236,72,153,0.2)',
          }}
        >
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
            <Cpu size={36} strokeWidth={1.2} style={{ color: 'rgba(6,182,212,0.95)', filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.7))' }} />
          </motion.div>
        </motion.div>
      </div>

      <div className="text-center space-y-3 z-10">
        <motion.h2
          className="text-3xl font-light tracking-[0.2em] uppercase"
          style={{ background: 'linear-gradient(90deg, #f472b6, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
        >
          {t('scan.readingProfile')}
        </motion.h2>
        <div className="flex items-center gap-3 justify-center">
          <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, rgba(236,72,153,0.6))' }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(6,182,212,0.8)' }} />
          <div className="h-px w-12" style={{ background: 'linear-gradient(270deg, transparent, rgba(6,182,212,0.6))' }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          className="text-sm tracking-widest font-light z-10"
          style={{ color: 'rgba(6,182,212,0.7)' }}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
        >
          {t(step)}
        </motion.p>
      </AnimatePresence>

      <div className="w-64 h-0.5 bg-white/5 overflow-hidden rounded-full z-10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #ec4899, #06b6d4, #fb923c)' }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  )
}

// ─── DemographicCard ─────────────────────────────────────────────────────────

const WEATHER_PALETTE: Record<string, { dark: { bg: string; border: string; shadow: string; label: string; value: string; sub: string }; light: { bg: string; border: string; shadow: string; label: string; value: string; sub: string } }> = {
  Hot:  { dark: { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.5)',  shadow: '0 0 30px rgba(251,146,60,0.25)',  label: 'text-[9px] tracking-[0.3em] uppercase text-orange-300/70', value: 'text-2xl font-semibold text-orange-200',   sub: 'text-[10px] text-orange-300/70' }, light: { bg: '#fff7ed', border: '#fdba74', shadow: '0 4px 20px rgba(251,146,60,0.2)',  label: 'text-[9px] tracking-[0.3em] uppercase text-orange-400', value: 'text-2xl font-semibold text-slate-800', sub: 'text-[10px] text-orange-400' } },
  Cold: { dark: { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.5)',  shadow: '0 0 30px rgba(96,165,250,0.25)',  label: 'text-[9px] tracking-[0.3em] uppercase text-blue-300/70',   value: 'text-2xl font-semibold text-blue-100',    sub: 'text-[10px] text-blue-300/70'   }, light: { bg: '#eff6ff', border: '#93c5fd', shadow: '0 4px 20px rgba(96,165,250,0.2)',  label: 'text-[9px] tracking-[0.3em] uppercase text-blue-400',   value: 'text-2xl font-semibold text-slate-800', sub: 'text-[10px] text-blue-400'   } },
  Rain: { dark: { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.5)',  shadow: '0 0 30px rgba(52,211,153,0.25)',  label: 'text-[9px] tracking-[0.3em] uppercase text-emerald-300/70',value: 'text-2xl font-semibold text-emerald-100', sub: 'text-[10px] text-emerald-300/70'}, light: { bg: '#ecfdf5', border: '#6ee7b7', shadow: '0 4px 20px rgba(52,211,153,0.2)',  label: 'text-[9px] tracking-[0.3em] uppercase text-emerald-500',value: 'text-2xl font-semibold text-slate-800', sub: 'text-[10px] text-emerald-500'} },
  All:  { dark: { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.5)', shadow: '0 0 30px rgba(167,139,250,0.25)', label: 'text-[9px] tracking-[0.3em] uppercase text-violet-300/70',  value: 'text-2xl font-semibold text-violet-100',  sub: 'text-[10px] text-violet-300/70' }, light: { bg: '#f5f3ff', border: '#c4b5fd', shadow: '0 4px 20px rgba(167,139,250,0.2)', label: 'text-[9px] tracking-[0.3em] uppercase text-violet-400',  value: 'text-2xl font-semibold text-slate-800', sub: 'text-[10px] text-violet-400'  } },
}

function DemographicCard({ result, weatherInfo }: { result: ScanResult; weatherInfo: WeatherInfo | null }) {
  const isDarkMode = useTheme()
  const { t } = useLanguage()
  const ageConf = Math.round(result.age_confidence  * 100)
  const genConf = Math.round(result.gender_confidence * 100)

  const avatarStyle = isDarkMode
    ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(236,72,153,0.45)', boxShadow: '0 0 40px rgba(236,72,153,0.3), 0 0 15px rgba(6,182,212,0.15)', backdropFilter: 'blur(20px)' }
    : { background: 'linear-gradient(135deg, #fdf2f8, #ecfeff)', border: '2px solid #f9a8d4', boxShadow: '0 4px 24px rgba(236,72,153,0.2)' }

  const ageBadge = isDarkMode
    ? { background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.45)', boxShadow: '0 0 30px rgba(6,182,212,0.2)' }
    : { background: '#ecfeff', border: '1px solid #67e8f9', boxShadow: '0 4px 20px rgba(6,182,212,0.15)' }

  const genBadge = isDarkMode
    ? { background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.45)', boxShadow: '0 0 30px rgba(236,72,153,0.2)' }
    : { background: '#fdf2f8', border: '1px solid #f9a8d4', boxShadow: '0 4px 20px rgba(236,72,153,0.15)' }

  const subTextClass  = isDarkMode ? 'text-[9px] tracking-[0.3em] uppercase text-white/50' : 'text-[9px] tracking-[0.3em] uppercase text-cyan-400'
  const genLabelClass = isDarkMode ? 'text-[9px] tracking-[0.3em] uppercase text-white/50' : 'text-[9px] tracking-[0.3em] uppercase text-pink-400'
  const valueClass    = isDarkMode ? 'text-2xl font-semibold text-white/95' : 'text-2xl font-semibold text-slate-800'
  const confAgeClass  = isDarkMode ? 'text-[10px] text-cyan-400/80' : 'text-[10px] text-cyan-500'
  const confGenClass  = isDarkMode ? 'text-[10px] text-pink-400/80' : 'text-[10px] text-pink-500'
  const captionClass  = isDarkMode ? 'text-xs tracking-[0.3em] uppercase text-white/40 font-medium' : 'text-xs tracking-[0.3em] uppercase text-slate-500 font-medium'

  const weatherKey    = weatherInfo?.condition ?? 'All'
  const weatherPal    = (WEATHER_PALETTE[weatherKey] ?? WEATHER_PALETTE.All)[isDarkMode ? 'dark' : 'light']
  const weatherBadge  = { background: weatherPal.bg, border: `1px solid ${weatherPal.border}`, boxShadow: weatherPal.shadow }

  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0, scale: 0.7, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
    >
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={avatarStyle}>
        <UserRound
          size={38} strokeWidth={1.2}
          style={{ color: isDarkMode ? 'rgba(249,168,212,0.9)' : '#ec4899' }}
        />
      </div>

      <p className={captionClass}>{t('scan.curatedForYou')}</p>

      <div className="flex gap-4">
        <motion.div className="flex flex-col items-center gap-1.5 px-7 py-4 rounded-2xl" style={ageBadge}
          initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22, delay: 0.18 }}>
          <span className={subTextClass}>{t('scan.ageGroup')}</span>
          <span className={valueClass}>{result.age_category}</span>
          <span className={confAgeClass}>{t('scan.match', { pct: ageConf })}</span>
        </motion.div>

        <motion.div className="flex flex-col items-center gap-1.5 px-7 py-4 rounded-2xl" style={genBadge}
          initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22, delay: 0.32 }}>
          <span className={genLabelClass}>{t('scan.gender')}</span>
          <span className={valueClass}>{result.gender}</span>
          <span className={confGenClass}>{t('scan.match', { pct: genConf })}</span>
        </motion.div>

        {weatherInfo && (
          <motion.div className="flex flex-col items-center gap-1.5 px-7 py-4 rounded-2xl" style={weatherBadge}
            initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22, delay: 0.46 }}>
            <span className={weatherPal.label}>{t('scan.weather')}</span>
            <span className="text-2xl">{weatherInfo.icon}</span>
            <span className={weatherPal.value} style={{ fontSize: '1.1rem' }}>{weatherInfo.tempC}°C</span>
            <span className={weatherPal.sub}>{weatherInfo.label}</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ─── ProductModal ─────────────────────────────────────────────────────────────

function ProductModal({ product, onClose, onPlayGame }: {
  product: Product
  onClose: () => void
  onPlayGame: () => void
}) {
  const isDarkMode = useTheme()
  const { t } = useLanguage()
  const [imgFailed, setImgFailed] = useState(false)
  const [declined, setDeclined] = useState(false)
  const cat = (isDarkMode ? CAT_DARK : CAT_LIGHT)[product.category] ?? (isDarkMode ? CAT_DARK : CAT_LIGHT).Other
  const hasImage = product.imageUrl && !imgFailed

  const modalBg   = isDarkMode ? 'rgba(10,15,30,0.97)' : '#ffffff'
  const nameColor = isDarkMode ? 'rgba(255,255,255,0.92)' : '#0f172a'
  const brandColor= isDarkMode ? 'rgba(255,255,255,0.45)' : '#64748b'
  const descColor = isDarkMode ? 'rgba(255,255,255,0.55)' : '#475569'
  const divStyle  = isDarkMode ? { borderColor: 'rgba(255,255,255,0.08)' } : { borderColor: '#f1f5f9' }
  const storeName = isDarkMode ? 'rgba(255,255,255,0.75)' : '#334155'
  const floorColor= isDarkMode ? 'rgba(255,255,255,0.35)' : '#94a3b8'
  const declineColor = isDarkMode ? 'rgba(255,255,255,0.4)' : '#94a3b8'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md overflow-hidden"
        style={{ borderRadius: 28, background: modalBg, boxShadow: isDarkMode ? '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)' : '0 32px 80px rgba(0,0,0,0.25)' }}
        initial={{ opacity: 0, scale: 0.88, y: 32 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative" style={{ height: 260, background: cat.bg }}>
          {hasImage
            ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={() => setImgFailed(true)} />
            : <div className="w-full h-full flex items-center justify-center"><span className="text-8xl">{CATEGORY_EMOJI[product.category] ?? '📦'}</span></div>
          }
          <span
            className="absolute top-4 left-4 text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full font-semibold"
            style={isDarkMode
              ? { background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', color: cat.text, border: `1px solid ${cat.border}`, boxShadow: `0 0 12px ${cat.shadow}` }
              : { background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }
            }
          >
            {product.category}
          </span>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center shadow-md"
            style={{ background: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
          >
            <X size={16} strokeWidth={2} style={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#475569' }} />
          </button>
        </div>

        {/* Content */}
        {declined ? (
          <motion.div
            key="thank-you"
            className="p-8 space-y-5 flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: isDarkMode ? 'rgba(16,185,129,0.15)' : '#ecfdf5' }}
            >
              <CheckCircle2 size={32} strokeWidth={1.8} style={{ color: '#10b981' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight" style={{ color: nameColor }}>{t('scan.thankYouTitle')}</h2>
              <p className="text-sm mt-2" style={{ color: descColor }}>{t('scan.thankYouMsg')}</p>
            </div>

            <div className="w-full rounded-2xl p-4 space-y-2" style={{ background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
              {product.storeName && (
                <p className="text-sm font-semibold flex items-center justify-center gap-1.5" style={{ color: storeName }}>
                  <Store size={14} strokeWidth={1.8} />
                  {product.storeName}
                </p>
              )}
              {product.storeLocation?.floor && (
                <p className="text-xs flex items-center justify-center gap-1.5" style={{ color: floorColor }}>
                  <MapPin size={12} strokeWidth={1.5} />
                  {t('scan.floor', { n: product.storeLocation.floor })}
                  {product.storeLocation?.storeNumber && <> · {t('scan.shopNumber', { n: product.storeLocation.storeNumber })}</>}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-bold text-sm tracking-[0.1em] uppercase text-white"
              style={{ background: 'linear-gradient(135deg, #ec4899, #06b6d4)' }}
            >
              {t('scan.done')}
            </button>
          </motion.div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-bold leading-tight" style={{ color: nameColor }}>{product.name}</h2>
              {product.brand && <p className="text-sm mt-1" style={{ color: brandColor }}>{product.brand}</p>}
            </div>
            {product.description && <p className="text-sm leading-relaxed line-clamp-3" style={{ color: descColor }}>{product.description}</p>}

            <div className="flex items-center justify-between py-4 border-y" style={divStyle}>
              <span className="text-2xl font-bold" style={{ color: cat.text }}>PKR {product.price.toFixed(2)}</span>
              <div className="text-right">
                {product.storeName && <p className="text-sm font-medium" style={{ color: storeName }}>{product.storeName}</p>}
                {product.storeLocation?.floor && (
                  <p className="text-xs flex items-center gap-1 justify-end mt-0.5" style={{ color: floorColor }}>
                    <MapPin size={11} strokeWidth={1.5} />
                    {t('scan.floor', { n: product.storeLocation.floor })}
                    {product.storeLocation?.storeNumber && <> · {t('scan.shopNumber', { n: product.storeLocation.storeNumber })}</>}
                  </p>
                )}
              </div>
            </div>

            <motion.button
              onClick={onPlayGame}
              className="w-full py-4 rounded-2xl font-bold text-sm tracking-[0.12em] uppercase text-white"
              style={{ background: 'linear-gradient(135deg, #ec4899, #06b6d4)', boxShadow: '0 8px 32px rgba(236,72,153,0.35)' }}
              whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(236,72,153,0.48)' }}
              whileTap={{ scale: 0.98 }}
            >
              <Gift size={16} strokeWidth={1.8} className="inline mr-2 -mt-0.5" />
              {t('scan.playToWin')}
            </motion.button>

            <button
              onClick={() => setDeclined(true)}
              className="w-full py-2.5 rounded-2xl font-medium text-xs tracking-[0.08em] uppercase"
              style={{ color: declineColor }}
            >
              {t('scan.noThanksExit')}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── ProductCard ─────────────────────────────────────────────────────────────

function ProductCard({ product, index, onOpen }: { product: Product; index: number; onOpen: () => void }) {
  const isDarkMode = useTheme()
  const { t } = useLanguage()
  const [imgFailed, setImgFailed] = useState(false)
  const cat = (isDarkMode ? CAT_DARK : CAT_LIGHT)[product.category] ?? (isDarkMode ? CAT_DARK : CAT_LIGHT).Other
  const hasImage = product.imageUrl && !imgFailed

  const cardBg     = isDarkMode ? 'rgba(255,255,255,0.06)' : '#ffffff'
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.12)' : cat.border
  const cardShadow = isDarkMode ? '0 8px 32px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.06)'
  const nameCls    = isDarkMode ? 'text-[13px] font-medium leading-snug line-clamp-2 text-white/90' : 'text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2'
  const brandCls   = isDarkMode ? 'text-[11px] text-white/35' : 'text-[11px] text-slate-400'
  const locCls     = isDarkMode ? 'text-[10px] tracking-wider text-white/28' : 'text-[10px] tracking-wider text-slate-400'
  const divCls     = isDarkMode ? 'border-white/5' : 'border-slate-100'
  const detailsCls = isDarkMode ? 'text-[10px] uppercase tracking-wider text-white/20' : 'text-[10px] uppercase tracking-wider text-slate-300'

  return (
    <motion.div
      className="group relative cursor-pointer overflow-hidden"
      style={{ borderRadius: 16, background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow, backdropFilter: isDarkMode ? 'blur(28px)' : 'none' }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.3 + Math.min(index, 8) * 0.08 }}
      whileHover={{
        y: -6,
        boxShadow: isDarkMode
          ? `0 28px 70px ${cat.shadow}, 0 0 0 1px ${cat.shadow}40`
          : `0 16px 40px ${cat.shadow}, 0 4px 12px rgba(0,0,0,0.08)`,
        transition: { duration: 0.22 },
      }}
      onClick={onOpen}
    >
      {/* Category tag */}
      <div className="absolute top-3 left-3 z-10">
        <span className="text-[9px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-full font-semibold"
          style={isDarkMode
            ? { background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', color: cat.text, border: `1px solid ${cat.border}`, boxShadow: `0 0 10px ${cat.shadow}` }
            : { background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }
          }>
          {product.category}
        </span>
      </div>

      {/* Image */}
      <div className="overflow-hidden" style={{ height: 160, background: cat.bg }}>
        {hasImage
          ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={() => setImgFailed(true)} />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-5xl select-none">{CATEGORY_EMOJI[product.category] ?? '📦'}</span></div>
        }
      </div>

      {/* Info */}
      <div className="p-4">
        <p className={nameCls}>{product.name}</p>
        {product.brand && <p className={`${brandCls} mb-1 mt-0.5`}>{product.brand}</p>}
        <div className="flex items-center gap-1 mb-3" style={{ color: isDarkMode ? 'rgba(255,255,255,0.28)' : undefined }}>
          <MapPin size={10} strokeWidth={1.5} className={isDarkMode ? '' : 'text-slate-400'} />
          <span className={locCls}>{t('scan.floor', { n: product.storeLocation?.floor ?? '—' })}</span>
        </div>
        <div className={`flex items-center justify-between pt-2 border-t ${divCls}`}>
          <span className="text-[15px] font-bold" style={{ color: cat.text, textShadow: isDarkMode ? `0 0 16px ${cat.shadow}` : 'none' }}>
            PKR {product.price.toFixed(2)}
          </span>
          <div className="flex items-center gap-1">
            <span className={detailsCls}>{t('scan.details')}</span>
            <ChevronRight size={12} strokeWidth={2} style={{ color: isDarkMode ? 'rgba(255,255,255,0.2)' : '#cbd5e1' }} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── ProductGrid ─────────────────────────────────────────────────────────────

function ProductGrid({ products, onProductOpen, activeEvent }: {
  products: Product[]
  onProductOpen: (p: Product) => void
  activeEvent?: { name: string; emoji: string; discountPercent: number; bannerColor: string } | null
}) {
  const isDarkMode = useTheme()
  const { t } = useLanguage()

  if (!products.length) {
    return (
      <motion.div className="w-full max-w-3xl flex flex-col items-center gap-3 py-8"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <ShoppingBag size={28} strokeWidth={1} className={isDarkMode ? 'text-white/20' : 'text-slate-300'} />
        <p className={isDarkMode ? 'text-white/25 text-xs tracking-widest uppercase' : 'text-slate-400 text-xs tracking-widest uppercase'}>
          {t('scan.noProducts')}
        </p>
        <p className={isDarkMode ? 'text-white/15 text-[10px] tracking-wider' : 'text-slate-300 text-[10px] tracking-wider'}>
          {t('scan.askAssociate')}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div className="w-full max-w-3xl"
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>

      {/* ── Festival Event Banner ── */}
      {activeEvent && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex items-center justify-between rounded-2xl mb-5 px-5 py-3"
          style={{
            background: `linear-gradient(135deg, ${activeEvent.bannerColor}22, ${activeEvent.bannerColor}10)`,
            border: `1px solid ${activeEvent.bannerColor}55`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '1.5rem' }}>{activeEvent.emoji}</span>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
                {activeEvent.name}
              </p>
              <p style={{ color: activeEvent.bannerColor, fontSize: '0.72rem', fontWeight: 600, margin: 0, letterSpacing: '0.05em' }}>
                {t('scan.festivalOffers')}
              </p>
            </div>
          </div>
          <div style={{
            padding: '5px 14px', borderRadius: 20,
            background: `${activeEvent.bannerColor}33`,
            border: `1px solid ${activeEvent.bannerColor}77`,
            color: activeEvent.bannerColor,
            fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em',
          }}>
            {activeEvent.discountPercent}% OFF
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <ShoppingBag size={15} strokeWidth={1.5} style={{ color: '#ec4899' }} />
        <p className="text-xs tracking-[0.3em] uppercase font-semibold"
          style={{ background: 'linear-gradient(90deg, #ec4899, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {t('scan.yourSelection')}
        </p>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(236,72,153,0.3), transparent)' }} />
        <span className={isDarkMode ? 'text-white/20 text-[10px] tracking-wider' : 'text-slate-300 text-[10px] tracking-wider'}>
          {t('scan.tapForDetails')}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {products.map((p, i) => (
          <ProductCard key={p._id} product={p} index={i} onOpen={() => onProductOpen(p)} />
        ))}
      </div>
    </motion.div>
  )
}

// ─── WalkawayBar ─────────────────────────────────────────────────────────────

function WalkawayBar({ timerKey }: { timerKey: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-white/5 overflow-hidden">
      <motion.div
        key={timerKey}
        className="h-full origin-left"
        style={{ background: 'linear-gradient(90deg, #ec4899, #06b6d4)' }}
        initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
        transition={{ duration: IDLE_TIMEOUT_MS / 1000, ease: 'linear' }}
      />
    </div>
  )
}

// ─── ErrorCard ───────────────────────────────────────────────────────────────

function ErrorCard({ type, onBack, onRetry }: { type: 'camera' | 'server'; onBack: () => void; onRetry: () => void }) {
  const isDarkMode = useTheme()
  const { t } = useLanguage()
  const isCam = type === 'camera'

  const iconWrap = isDarkMode
    ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', boxShadow: '0 0 40px rgba(239,68,68,0.18)' }
    : { background: '#fef2f2', border: '1px solid #fca5a5', boxShadow: '0 4px 20px rgba(239,68,68,0.15)' }

  const titleCls = isDarkMode ? 'text-white/85 text-xl font-light tracking-widest uppercase' : 'text-slate-800 text-xl font-semibold tracking-wide'
  const bodyCls  = isDarkMode ? 'text-white/35 text-sm font-light leading-relaxed' : 'text-slate-500 text-sm leading-relaxed'
  const backCls  = isDarkMode
    ? 'px-5 py-2.5 rounded-xl text-white/40 text-xs tracking-widest uppercase border border-white/10 hover:border-white/25 hover:text-white/65 transition-all'
    : 'px-5 py-2.5 rounded-xl text-slate-500 text-xs tracking-widest uppercase border border-slate-200 hover:border-slate-300 hover:text-slate-700 transition-all'

  return (
    <motion.div className="flex flex-col items-center gap-6 text-center max-w-sm"
      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={iconWrap}>
        {isCam ? <CameraOff size={34} strokeWidth={1.1} className="text-red-400" /> : <AlertTriangle size={34} strokeWidth={1.1} className="text-red-400" />}
      </div>
      <div className="space-y-2">
        <h2 className={titleCls}>{isCam ? t('scan.cameraDenied') : t('scan.connectionError')}</h2>
        <p className={bodyCls}>
          {isCam ? t('scan.cameraDeniedMsg') : t('scan.connectionErrorMsg')}
        </p>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className={backCls}>{t('scan.goBack')}</button>
        <button onClick={onRetry} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs tracking-widest uppercase text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #ec4899, #06b6d4)' }}>
          <RefreshCw size={12} /> {t('scan.retry')}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ScanPage() {
  const navigate   = useNavigate()
  const isDarkMode = useTheme()
  const { lang, t } = useLanguage()
  const webcamRef      = useRef<Webcam>(null)
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const [phase,           setPhase]           = useState<Phase>('idle')
  const [result,          setResult]          = useState<ScanResult | null>(null)
  const [errorType,       setErrorType]       = useState<'camera' | 'server'>('server')
  const [activeEvent,     setActiveEvent]     = useState<{ name: string; emoji: string; discountPercent: number; bannerColor: string } | null>(null)
  const [loaderStep,      setLoaderStep]      = useState(LOADER_STEPS[0])
  const [timerKey,        setTimerKey]        = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [weatherInfo,     setWeatherInfo]     = useState<WeatherInfo | null>(null)
  const [toast,           setToast]           = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Returning-customer streak (opt-in, code-based — no identity stored) ──
  const [showReturningInput, setShowReturningInput] = useState(false)
  const [returningCode,      setReturningCode]      = useState('')
  const [returningChecking,  setReturningChecking]  = useState(false)
  const [visitStreak,        setVisitStreak]        = useState(1)

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Face detection + blur check (live feedback) ─────────────────────────
  const faceDetection = useFaceDetection(webcamRef, phase === 'idle')

  const clearWalkaway = useCallback(() => { if (timerRef.current) clearTimeout(timerRef.current) }, [])
  const resetWalkaway = useCallback(() => {
    clearWalkaway()
    setTimerKey(k => k + 1)
    timerRef.current = setTimeout(() => navigate('/'), IDLE_TIMEOUT_MS)
  }, [clearWalkaway, navigate])

  useEffect(() => {
    if (phase !== 'result') { clearWalkaway(); return }
    resetWalkaway()
    const onInteraction = () => resetWalkaway()
    window.addEventListener('pointerdown', onInteraction)
    return () => { clearWalkaway(); window.removeEventListener('pointerdown', onInteraction) }
  }, [phase, resetWalkaway, clearWalkaway])

  useEffect(() => () => clearWalkaway(), [clearWalkaway])
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }, [])

  useEffect(() => {
    getWeatherInfo()
      .then(setWeatherInfo)
      .catch(err => console.error('[Weather] fetch failed:', err?.message ?? err))
  }, [])

  useEffect(() => {
    axios.get('/api/events/active').then(r => setActiveEvent(r.data.data)).catch(() => {})
  }, [])

  const startLoaderCycle = useCallback(() => {
    let i = 0
    const id = setInterval(() => { i = (i + 1) % LOADER_STEPS.length; setLoaderStep(LOADER_STEPS[i]) }, 900)
    return () => clearInterval(id)
  }, [])

  const handleScan = useCallback(async () => {
    // Validate: check face + blur before capturing
    if (faceDetection.supported && !faceDetection.hasFace) {
      showToast(t('scan.toastNoFace'))
      return
    }
    if (faceDetection.isBlurry) {
      showToast(t('scan.toastBlurry'))
      return
    }

    const imageSrc = webcamRef.current?.getScreenshot()
    if (!imageSrc) return
    setPhase('scanning')
    setLoaderStep(LOADER_STEPS[0])
    const stopCycle = startLoaderCycle()
    try {
      const res  = await fetch(imageSrc)
      const blob = await res.blob()
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      const form = new FormData()
      form.append('image', file)
      form.append('weatherCondition', weatherInfo?.condition ?? 'All')
      form.append('visitStreak', String(visitStreak))
      const { data } = await axios.post<ScanResult>('/api/scan', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
      })
      stopCycle()
      setResult(data)
      setPhase('result')
    } catch {
      stopCycle()
      setErrorType('server')
      setPhase('error')
    }
  }, [startLoaderCycle, faceDetection, visitStreak])

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''          // allow re-selecting the same file
    setPhase('scanning')
    setLoaderStep(LOADER_STEPS[0])
    const stopCycle = startLoaderCycle()
    try {
      const form = new FormData()
      form.append('image', file)
      form.append('weatherCondition', weatherInfo?.condition ?? 'All')
      form.append('visitStreak', String(visitStreak))
      const { data } = await axios.post<ScanResult>('/api/scan', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
      })
      stopCycle()
      setResult(data)
      setPhase('result')
    } catch {
      stopCycle()
      setErrorType('server')
      setPhase('error')
    }
  }, [startLoaderCycle, weatherInfo, visitStreak])

  const handleCheckReturningCode = useCallback(async () => {
    if (!returningCode.trim()) return
    setReturningChecking(true)
    try {
      const { data } = await axios.post('/api/visitors/lookup', { code: returningCode.trim() })
      setVisitStreak(data.visitStreak)
      showToast(`Welcome back! Visit #${data.visitStreak} 🎉`)
      setShowReturningInput(false)
    } catch {
      showToast('Code not found — starting a fresh visit.')
    } finally {
      setReturningChecking(false)
    }
  }, [returningCode, showToast])

  const handleCameraError = useCallback(() => { setErrorType('camera'); setPhase('error') }, [])
  const handleReset       = useCallback(() => { setResult(null); setPhase('idle') }, [])
  const handleFinish      = useCallback(() => navigate('/'), [navigate])
  const handlePlayGame    = useCallback(() => {
    setSelectedProduct(null)
    // Kid and Young get the Catch-the-Gifts tap game; Adult and Senior get the Spin & Win wheel.
    const gameRoute = ['Kid', 'Young'].includes(result?.age_category || "") ? '/game-catch' : '/game'
    navigate(gameRoute, { state: { sessionId: result?.sessionId ?? null, visitStreak } })
  }, [navigate, result, visitStreak])

  const handleProductOpen = useCallback(async (product: Product) => {
    setSelectedProduct(product)
    try { await axios.patch(`/api/products/${product._id}/click`) } catch {}
  }, [])

  // Derived styles based on theme
  const pageBg     = isDarkMode ? '#040010' : 'linear-gradient(135deg, #fdf4ff 0%, #f0f9ff 45%, #f0fdf4 100%)'
  const camBorder  = isDarkMode ? '1px solid rgba(6,182,212,0.4)' : '2px solid rgba(255,255,255,0.88)'
  const camShadow  = isDarkMode
    ? '0 0 80px rgba(6,182,212,0.15), 0 0 30px rgba(236,72,153,0.1)'
    : '0 24px 64px rgba(236,72,153,0.15), 0 8px 32px rgba(6,182,212,0.12), 0 0 0 1px rgba(255,255,255,0.7)'
  const subTextCls = isDarkMode ? 'text-white/35 text-sm mt-2' : 'text-slate-500 text-sm mt-2 font-medium'
  const stepLblCls = isDarkMode
    ? 'text-xs tracking-[0.3em] uppercase mb-2 font-medium text-white/40'
    : 'text-xs tracking-[0.3em] uppercase mb-2 font-bold text-fuchsia-500'
  const cancelCls  = isDarkMode
    ? 'text-white/20 text-[11px] tracking-[0.25em] uppercase hover:text-white/40 transition-colors'
    : 'text-slate-400 text-[11px] tracking-[0.25em] uppercase hover:text-slate-600 transition-colors font-medium'
  const timerCls   = isDarkMode ? 'text-white/18 text-[9px] tracking-widest uppercase' : 'text-slate-400 text-[9px] tracking-widest uppercase'
  const dividerBg  = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(236,72,153,0.1)'
  const skipCls    = isDarkMode
    ? 'text-white/20 text-[11px] tracking-[0.25em] uppercase hover:text-white/40 transition-colors -mt-3'
    : 'text-slate-400 text-[11px] tracking-[0.25em] uppercase hover:text-slate-600 transition-colors -mt-3 font-medium'
  const btnShadow  = isDarkMode
    ? '0 0 50px rgba(236,72,153,0.3), 0 0 25px rgba(6,182,212,0.15), 0 8px 32px rgba(0,0,0,0.4)'
    : '0 12px 36px rgba(236,72,153,0.42), 0 4px 16px rgba(6,182,212,0.2), 0 2px 6px rgba(0,0,0,0.06)'
  const btnHoverShadow = isDarkMode
    ? '0 0 80px rgba(236,72,153,0.5), 0 0 50px rgba(6,182,212,0.3)'
    : '0 16px 48px rgba(236,72,153,0.55), 0 6px 20px rgba(6,182,212,0.28)'

  // Light mode glass card style for heading
  const headingGlass = isDarkMode ? {} : {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.92)',
    borderRadius: 24,
    padding: '20px 48px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.05), 0 2px 8px rgba(236,72,153,0.08), inset 0 1px 0 rgba(255,255,255,1)',
  }

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: pageBg, fontFamily: lang === 'ur' ? "'Noto Nastaliq Urdu', serif" : undefined }}>

      {/* Background layers — conditional on theme */}
      {isDarkMode
        ? DARK_COLOR_LAYERS.map((layer, i) => (
            <motion.div key={i} className="absolute inset-0 pointer-events-none" style={{ background: layer.bg }}
              animate={{ x: layer.dx, y: layer.dy }}
              transition={{ duration: layer.dur, repeat: Infinity, ease: 'easeInOut', delay: (layer as any).delay ?? 0 }}
            />
          ))
        : PASTEL_LAYERS.map((bg, i) => (
            <div key={i} className="absolute inset-0 pointer-events-none" style={{ background: bg }} />
          ))
      }

      {/* Dark-mode mesh grid */}
      {isDarkMode && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      )}

      {/* ── WEBCAM — stays mounted across idle + scanning ─────────────────── */}
      {(phase === 'idle' || phase === 'scanning') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div className="relative rounded-2xl overflow-hidden pointer-events-auto"
            style={{ width: 420, height: 315, border: camBorder, boxShadow: camShadow }}
            initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <Webcam ref={webcamRef} screenshotFormat="image/jpeg" screenshotQuality={0.92}
              videoConstraints={{ width: 420, height: 315, facingMode: 'user' }}
              onUserMediaError={handleCameraError} className="w-full h-full object-cover" mirrored />
            <ScanningOverlay />
            {phase === 'idle' && (
              <FaceDetectionOverlay
                detection={faceDetection}
              />
            )}
          </motion.div>
        </div>
      )}

      {/* ── IDLE controls — heading top / buttons bottom, webcam in the middle ── */}
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.div key="idle" className="absolute inset-0 flex flex-col items-center justify-between py-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>

            {/* Heading — face & quality feedback */}
            <motion.div className="text-center" style={headingGlass} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p className={stepLblCls}>{t('scan.step1of3')}</p>
              <h1 className="text-3xl font-bold tracking-tight"
                style={{ background: 'linear-gradient(90deg, #ec4899, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {faceDetection.status === 'face-none' ? t('scan.positionFace') : faceDetection.status === 'blurry' ? t('scan.holdStill') : faceDetection.status === 'face-good' ? t('scan.faceDetected') : t('scan.positionFace')}
              </h1>
              <p className={subTextCls}>
                {faceDetection.status === 'face-none'
                  ? t('scan.noFaceMsg')
                  : faceDetection.status === 'blurry'
                    ? t('scan.blurryMsg')
                    : faceDetection.status === 'face-good'
                      ? t('scan.goodMsg')
                      : t('scan.centerMsg')}
              </p>
            </motion.div>

            {/* Spacer — webcam occupies the centre via the always-mounted layer */}
            <div />

            {/* Action buttons */}
            <motion.div className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={handleScan}
                  className="flex items-center gap-3 px-10 py-4 rounded-2xl text-sm tracking-[0.2em] uppercase font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #06b6d4)', boxShadow: btnShadow }}
                  whileHover={{ scale: 1.04, boxShadow: btnHoverShadow }}
                  whileTap={{ scale: 0.97 }}>
                  <Scan size={18} strokeWidth={1.6} />
                  {t('scan.scanProfile')}
                </motion.button>

                <motion.button onClick={() => uploadInputRef.current?.click()}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl text-sm tracking-[0.2em] uppercase font-bold"
                  style={isDarkMode
                    ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)' }
                    : { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', color: '#334155', boxShadow: '0 4px 20px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,1)' }
                  }
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}>
                  <Upload size={16} strokeWidth={1.6} />
                  {t('scan.uploadPhoto')}
                </motion.button>
              </div>

              <button onClick={handleFinish} className={cancelCls}>{t('scan.cancel')}</button>

              {/* Optional, opt-in returning-customer streak — no identity stored */}
              {visitStreak > 1 ? (
                <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
                  ✓ Visit #{visitStreak} recognised
                </span>
              ) : !showReturningInput ? (
                <button onClick={() => setShowReturningInput(true)}
                  style={{ fontSize: '0.72rem', color: isDarkMode ? 'rgba(255,255,255,0.4)' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Returning customer? Enter your code
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    value={returningCode}
                    onChange={e => setReturningCode(e.target.value)}
                    placeholder="e.g. SAVE20AB3F"
                    style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.4)', background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#fff', color: isDarkMode ? '#fff' : '#0f172a', width: 140 }}
                  />
                  <button onClick={handleCheckReturningCode} disabled={returningChecking}
                    style={{ fontSize: '0.72rem', fontWeight: 700, padding: '6px 12px', borderRadius: 8, background: '#34d399', border: 'none', color: '#fff', cursor: 'pointer', opacity: returningChecking ? 0.6 : 1 }}>
                    {returningChecking ? '…' : 'Check'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SCANNING overlay — translucent so webcam shows through ──────── */}
      <AnimatePresence>
        {phase === 'scanning' && <AnalysingLoader key="scanning" step={loaderStep} />}
      </AnimatePresence>

      {/* ── RESULT ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'result' && result && (
          <motion.div key="result" className="absolute inset-0 flex flex-col items-center justify-start pt-10 pb-8 gap-7 overflow-y-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <WalkawayBar timerKey={timerKey} />

            <motion.div className="flex items-center gap-1.5 self-end pr-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
              <Timer size={10} strokeWidth={1.5} className={isDarkMode ? 'text-white/18' : 'text-slate-300'} />
              <span className={timerCls}>{t('scan.autoReset')}</span>
            </motion.div>

            <motion.div className="text-center -mt-2" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-3xl font-bold tracking-tight"
                style={{ background: 'linear-gradient(90deg, #ec4899, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {t('scan.curatedForYou')}
              </h1>
              <p className={subTextCls}>{t('scan.aiStylist')}</p>
            </motion.div>

            <motion.div className="h-px" style={{ width: 320, background: 'linear-gradient(90deg, transparent, rgba(236,72,153,0.5), rgba(6,182,212,0.5), transparent)' }}
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 0.2 }} />

            <DemographicCard result={result} weatherInfo={weatherInfo} />

            <div className="h-px w-full max-w-3xl" style={{ background: dividerBg }} />

            <ProductGrid products={result.products} onProductOpen={handleProductOpen} activeEvent={activeEvent} />

            <motion.button onClick={handlePlayGame}
              className="flex items-center gap-3 px-12 py-4 rounded-2xl text-sm tracking-[0.15em] uppercase font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #ec4899, #06b6d4)', boxShadow: btnShadow }}
              whileHover={{ scale: 1.04, boxShadow: btnHoverShadow }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Gift size={16} strokeWidth={1.8} />
              {t('scan.playWin')}
            </motion.button>

            <button onClick={handleFinish} className={skipCls}>
              <ScanLine size={10} className="inline mr-1" />
              {t('scan.skipReset')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ERROR ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'error' && (
          <motion.div key="error" className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ErrorCard type={errorType} onBack={handleFinish} onRetry={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PRODUCT MODAL ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal key="product-modal" product={selectedProduct}
            onClose={() => setSelectedProduct(null)} onPlayGame={handlePlayGame} />
        )}
      </AnimatePresence>

      {/* ── WEATHER BADGE ──────────────────────────────────────────────────── */}
      {weatherInfo && phase !== 'scanning' && (
        <motion.div
          className="absolute top-4 right-16 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full pointer-events-none"
          style={isDarkMode
            ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }
            : { background: 'rgba(255,255,255,0.88)', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)' }
          }
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <span className="text-sm">{weatherInfo.icon}</span>
          <span className="text-xs font-semibold" style={{ color: isDarkMode ? 'rgba(255,255,255,0.82)' : '#334155' }}>
            {weatherInfo.tempC}°C
          </span>
          <div className="w-px h-3" style={{ background: isDarkMode ? 'rgba(255,255,255,0.18)' : '#e2e8f0' }} />
          <span className="text-[11px] font-medium" style={{ color: isDarkMode ? 'rgba(255,255,255,0.45)' : '#64748b' }}>
            {weatherInfo.label}
          </span>
          {weatherInfo.city && (
            <>
              <div className="w-px h-3" style={{ background: isDarkMode ? 'rgba(255,255,255,0.18)' : '#e2e8f0' }} />
              <span className="text-[10px]" style={{ color: isDarkMode ? 'rgba(255,255,255,0.3)' : '#94a3b8' }}>
                {weatherInfo.city}
              </span>
            </>
          )}
        </motion.div>
      )}

      {/* Corner accents */}
      {[
        { cls: 'top-5 left-5 border-t-2 border-l-2',    color: 'rgba(236,72,153,0.25)' },
        { cls: 'top-5 right-5 border-t-2 border-r-2',   color: 'rgba(6,182,212,0.25)'  },
        { cls: 'bottom-5 left-5 border-b-2 border-l-2', color: 'rgba(6,182,212,0.25)'  },
        { cls: 'bottom-5 right-5 border-b-2 border-r-2',color: 'rgba(236,72,153,0.25)' },
      ].map(({ cls, color }, i) => (
        <div key={i} className={`absolute w-8 h-8 pointer-events-none ${cls}`} style={{ borderColor: color }} />
      ))}

      {/* ── TOAST notification — auto-dismisses in 3s ───────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20, scale: 0.94 }}
            animate={{ opacity: 1,  y: 0,   scale: 1    }}
            exit={{    opacity: 0,  y: -16, scale: 0.94 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute z-50 flex items-center gap-3"
            style={{
              top: 20, left: '50%', transform: 'translateX(-50%)',
              background: isDarkMode ? 'rgba(12,0,28,0.9)' : 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              border: isDarkMode ? '1px solid rgba(239,68,68,0.38)' : '1px solid rgba(239,68,68,0.22)',
              borderRadius: 16, padding: '12px 20px',
              boxShadow: isDarkMode
                ? '0 0 28px rgba(239,68,68,0.2), 0 8px 32px rgba(0,0,0,0.5)'
                : '0 4px 28px rgba(239,68,68,0.14), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
              whiteSpace: 'nowrap', pointerEvents: 'none',
            }}
          >
            <AlertCircle size={15} strokeWidth={2} style={{ color: '#ef4444', filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.7))', flexShrink: 0 }} />
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: isDarkMode ? 'rgba(255,255,255,0.9)' : '#1e293b', letterSpacing: '0.01em' }}>
              {toast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input for photo upload */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}
