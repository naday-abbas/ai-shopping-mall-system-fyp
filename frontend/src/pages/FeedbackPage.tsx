import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Star, CheckCircle2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useTheme } from '../ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'
import type { TranslationKey } from '../i18n/translations'

const PASTEL_LAYERS = [
  'radial-gradient(ellipse 65% 55% at 0% 0%, rgba(249,168,212,0.22) 0%, transparent 70%)',
  'radial-gradient(ellipse 55% 55% at 100% 100%, rgba(165,243,252,0.18) 0%, transparent 70%)',
  'radial-gradient(ellipse 40% 40% at 88% 8%, rgba(253,186,116,0.14) 0%, transparent 70%)',
]

const DARK_COLOR_LAYERS = [
  { bg: 'radial-gradient(ellipse 55% 45% at 10% 20%, rgba(236,72,153,0.28) 0%, transparent 70%)', dx: [0, 40, 10, 0], dy: [0, 25, -15, 0], dur: 10 },
  { bg: 'radial-gradient(ellipse 50% 50% at 90% 80%, rgba(6,182,212,0.22) 0%, transparent 70%)',  dx: [0, -50, -15, 0], dy: [0, -35, 20, 0], dur: 13 },
  { bg: 'radial-gradient(ellipse 45% 40% at 75% 10%, rgba(251,146,60,0.18) 0%, transparent 70%)', dx: [0, -20, 35, 0], dy: [0, 45, 10, 0], dur: 9, delay: 1 },
]

const STAR_LABELS: TranslationKey[] = ['feedback.star.poor', 'feedback.star.fair', 'feedback.star.good', 'feedback.star.great', 'feedback.star.excellent']

type Step = 1 | 2 | 3

export default function FeedbackPage() {
  const navigate   = useNavigate()
  const isDarkMode = useTheme()
  const { lang, t } = useLanguage()

  const [step,              setStep]              = useState<Step>(1)
  const [satisfied,         setSatisfied]         = useState<boolean | null>(null)
  const [ageGenderAccurate, setAgeGenderAccurate] = useState<boolean | null>(null)
  const [rating,            setRating]            = useState(0)
  const [hovered,           setHovered]           = useState(0)
  const [submitting,        setSubmitting]        = useState(false)
  const [submitted,         setSubmitted]         = useState(false)

  const activeStars = hovered || rating

  const handleYesNo = useCallback((question: 'satisfied' | 'ageGender', value: boolean) => {
    if (question === 'satisfied') {
      setSatisfied(value)
      setTimeout(() => setStep(2), 300)
    } else {
      setAgeGenderAccurate(value)
      setTimeout(() => setStep(3), 300)
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!rating || submitting) return
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = { rating }
      if (satisfied !== null)         payload.satisfied         = satisfied
      if (ageGenderAccurate !== null) payload.ageGenderAccurate = ageGenderAccurate
      await axios.post('/api/feedback', payload)
    } catch {
      // silent — never block the kiosk flow on feedback errors
    } finally {
      setSubmitted(true)
      setTimeout(() => navigate('/'), 2000)
    }
  }, [rating, satisfied, ageGenderAccurate, submitting, navigate])

  // ── Derived theme styles ──────────────────────────────────────────────────
  const pageBg = isDarkMode ? '#040010' : '#f8fafc'

  const cardBg     = isDarkMode ? 'rgba(255,255,255,0.06)' : '#ffffff'
  const cardShadow = isDarkMode ? '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)' : '0 8px 48px rgba(0,0,0,0.1), 0 2px 12px rgba(0,0,0,0.06)'
  const cardBorderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9'

  const headerBorderCls = isDarkMode ? '' : ''
  const headerBorderStyle = { borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }

  const labelCls    = isDarkMode ? 'text-xs tracking-[0.3em] uppercase font-medium text-white/35 mb-1' : 'text-xs tracking-[0.3em] uppercase font-medium text-slate-400 mb-1'
  const questionCls = isDarkMode ? 'text-lg font-semibold text-white/88 text-center leading-snug' : 'text-lg font-semibold text-slate-800 text-center leading-snug'
  const skipCls     = isDarkMode ? 'text-white/20 text-[11px] tracking-[0.25em] uppercase hover:text-white/45 transition-colors' : 'text-slate-300 text-[11px] tracking-[0.25em] uppercase hover:text-slate-500 transition-colors'

  // Step indicator styles
  const stepDone  = { background: 'linear-gradient(135deg, #ec4899, #06b6d4)', color: '#fff' }
  const stepActive = isDarkMode
    ? { background: 'rgba(236,72,153,0.12)', border: '2px solid rgba(236,72,153,0.7)', color: 'rgba(236,72,153,0.9)' }
    : { background: '#fdf2f8', border: '2px solid #ec4899', color: '#ec4899' }
  const stepInactive = isDarkMode
    ? { background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.25)' }
    : { background: '#f1f5f9', border: '2px solid #e2e8f0', color: '#94a3b8' }
  const connectorDone    = 'linear-gradient(90deg, #ec4899, #06b6d4)'
  const connectorPending = isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'

  // Yes/No button styles
  const yesActive   = isDarkMode ? { background: 'rgba(16,185,129,0.18)', border: '2px solid rgba(16,185,129,0.7)', color: 'rgba(52,211,153,0.95)' } : { background: '#dcfce7', border: '2px solid #16a34a', color: '#16a34a' }
  const yesDefault  = isDarkMode ? { background: 'rgba(16,185,129,0.07)', border: '2px solid rgba(16,185,129,0.3)', color: 'rgba(52,211,153,0.7)' } : { background: '#f0fdf4', border: '2px solid #86efac', color: '#16a34a' }
  const noActive    = isDarkMode ? { background: 'rgba(239,68,68,0.18)', border: '2px solid rgba(239,68,68,0.7)', color: 'rgba(248,113,113,0.95)' } : { background: '#fee2e2', border: '2px solid #dc2626', color: '#dc2626' }
  const noDefault   = isDarkMode ? { background: 'rgba(239,68,68,0.07)', border: '2px solid rgba(239,68,68,0.3)', color: 'rgba(248,113,113,0.7)' } : { background: '#fef2f2', border: '2px solid #fca5a5', color: '#dc2626' }

  // Star colors
  const starActive  = { color: '#f59e0b', fill: 'rgba(251,191,36,0.9)', filter: 'drop-shadow(0 2px 8px rgba(251,191,36,0.5))' }
  const starInactive = isDarkMode ? { color: 'rgba(255,255,255,0.12)', fill: 'transparent' } : { color: '#e2e8f0', fill: 'transparent' }

  // Submit button
  const submitBg = rating
    ? 'linear-gradient(135deg, #ec4899, #06b6d4)'
    : isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'
  const submitColor  = rating ? '#fff' : isDarkMode ? 'rgba(255,255,255,0.2)' : '#94a3b8'
  const submitShadow = rating ? '0 8px 32px rgba(236,72,153,0.3)' : 'none'

  // Thank-you card
  const thankCircle = isDarkMode
    ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 0 60px rgba(16,185,129,0.3)' }
    : { background: '#dcfce7', border: '2px solid #86efac', boxShadow: '0 8px 40px rgba(16,185,129,0.25)' }
  const thankTitleCls  = isDarkMode ? 'text-3xl font-bold text-white/90 tracking-tight' : 'text-3xl font-bold text-slate-800 tracking-tight'
  const thankBodyCls   = isDarkMode ? 'text-white/40 text-base' : 'text-slate-500 text-base'
  const thankReturnCls = isDarkMode ? 'text-white/20 text-xs tracking-widest uppercase animate-pulse' : 'text-slate-400 text-xs tracking-widest uppercase animate-pulse'

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: pageBg, fontFamily: lang === 'ur' ? "'Noto Nastaliq Urdu', serif" : undefined }}>

      {/* Background layers */}
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

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <AnimatePresence mode="wait">

          {/* ── Survey card ── */}
          {!submitted && (
            <motion.div
              key="survey"
              className="w-full max-w-lg overflow-hidden"
              style={{
                borderRadius: 28,
                background: cardBg,
                boxShadow: cardShadow,
                backdropFilter: isDarkMode ? 'blur(28px)' : 'none',
                border: isDarkMode ? `1px solid ${cardBorderColor}` : 'none',
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              {/* Header */}
              <div className={`px-8 pt-8 pb-6 border-b ${headerBorderCls}`} style={headerBorderStyle}>
                <p className={labelCls}>{t('feedback.beforeYouGo')}</p>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{
                    background: 'linear-gradient(90deg, #ec4899, #06b6d4)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}
                >
                  {t('feedback.howWas')}
                </h1>

                {/* Step progress */}
                <div className="flex items-center gap-2 mt-5">
                  {([1, 2, 3] as Step[]).map(n => (
                    <div key={n} className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                        style={step > n ? stepDone : step === n ? stepActive : stepInactive}
                      >
                        {step > n ? <CheckCircle2 size={14} strokeWidth={2.5} /> : n}
                      </div>
                      {n < 3 && (
                        <div
                          className="h-0.5 w-8 rounded-full transition-all duration-500"
                          style={{ background: step > n ? connectorDone : connectorPending }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step content */}
              <div className="px-8 py-8">
                <AnimatePresence mode="wait">

                  {/* Step 1 — Satisfied? */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      className="flex flex-col items-center gap-6"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className={questionCls}>{t('feedback.q1')}</p>
                      <div className="flex gap-4 w-full">
                        <motion.button
                          onClick={() => handleYesNo('satisfied', true)}
                          className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl font-semibold text-sm transition-all"
                          style={satisfied === true ? yesActive : yesDefault}
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        >
                          <ThumbsUp size={28} strokeWidth={1.5} />
                          {t('feedback.yes')}
                        </motion.button>
                        <motion.button
                          onClick={() => handleYesNo('satisfied', false)}
                          className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl font-semibold text-sm transition-all"
                          style={satisfied === false ? noActive : noDefault}
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        >
                          <ThumbsDown size={28} strokeWidth={1.5} />
                          {t('feedback.no')}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2 — Age & gender accurate? */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      className="flex flex-col items-center gap-6"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className={questionCls}>{t('feedback.q2')}</p>
                      <div className="flex gap-4 w-full">
                        <motion.button
                          onClick={() => handleYesNo('ageGender', true)}
                          className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl font-semibold text-sm transition-all"
                          style={ageGenderAccurate === true ? yesActive : yesDefault}
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        >
                          <ThumbsUp size={28} strokeWidth={1.5} />
                          {t('feedback.yes')}
                        </motion.button>
                        <motion.button
                          onClick={() => handleYesNo('ageGender', false)}
                          className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl font-semibold text-sm transition-all"
                          style={ageGenderAccurate === false ? noActive : noDefault}
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        >
                          <ThumbsDown size={28} strokeWidth={1.5} />
                          {t('feedback.no')}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3 — Star rating */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      className="flex flex-col items-center gap-6"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className={questionCls}>{t('feedback.q3')}</p>

                      {/* Stars */}
                      <div className="flex items-center gap-3">
                        {[1, 2, 3, 4, 5].map(n => {
                          const isActive = n <= activeStars
                          const s = isActive ? starActive : starInactive
                          return (
                            <motion.button
                              key={n}
                              onHoverStart={() => setHovered(n)}
                              onHoverEnd={() => setHovered(0)}
                              onClick={() => setRating(n)}
                              whileHover={{ scale: 1.25 }}
                              whileTap={{ scale: 0.88 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            >
                              <Star
                                size={52}
                                strokeWidth={1.3}
                                fill={s.fill}
                                // @ts-ignore
                                style={{ color: s.color, filter: isActive ? s.filter : 'none', transition: 'color 0.15s, filter 0.15s' }}
                              />
                            </motion.button>
                          )
                        })}
                      </div>

                      {/* Label */}
                      <AnimatePresence mode="wait">
                        {activeStars > 0 && (
                          <motion.p
                            key={activeStars}
                            className="text-sm font-semibold tracking-wider uppercase"
                            style={{ color: '#f59e0b' }}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                          >
                            {t(STAR_LABELS[activeStars - 1])}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      {/* Submit */}
                      <motion.button
                        onClick={handleSubmit}
                        disabled={!rating || submitting}
                        className="w-full py-4 rounded-2xl font-bold text-sm tracking-[0.15em] uppercase transition-all"
                        style={{ background: submitBg, color: submitColor, boxShadow: submitShadow, cursor: rating ? 'pointer' : 'not-allowed' }}
                        whileHover={rating ? { scale: 1.02, boxShadow: '0 12px 40px rgba(236,72,153,0.42)' } : {}}
                        whileTap={rating ? { scale: 0.98 } : {}}
                      >
                        {submitting ? t('feedback.submitting') : t('feedback.submit')}
                      </motion.button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Skip link */}
              <div className="px-8 pb-6 flex justify-center">
                <button onClick={() => navigate('/')} className={skipCls}>{t('feedback.skip')}</button>
              </div>
            </motion.div>
          )}

          {/* ── Thank you screen ── */}
          {submitted && (
            <motion.div
              key="thanks"
              className="flex flex-col items-center gap-6 text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
            >
              <motion.div
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={thankCircle}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                <CheckCircle2 size={52} strokeWidth={1.4} style={{ color: isDarkMode ? 'rgba(52,211,153,0.9)' : '#16a34a' }} />
              </motion.div>

              <div className="space-y-2">
                <h2 className={thankTitleCls}>{t('feedback.thankYou')}</h2>
                <p className={thankBodyCls}>{t('feedback.thankBody')}</p>
              </div>

              <p className={thankReturnCls}>{t('feedback.returning')}</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Corner accents */}
      {[
        { cls: 'top-5 left-5 border-t-2 border-l-2',    color: 'rgba(236,72,153,0.2)' },
        { cls: 'top-5 right-5 border-t-2 border-r-2',   color: 'rgba(6,182,212,0.2)'  },
        { cls: 'bottom-5 left-5 border-b-2 border-l-2', color: 'rgba(6,182,212,0.2)'  },
        { cls: 'bottom-5 right-5 border-b-2 border-r-2',color: 'rgba(236,72,153,0.2)' },
      ].map(({ cls, color }, i) => (
        <div key={i} className={`absolute w-8 h-8 pointer-events-none ${cls}`} style={{ borderColor: color }} />
      ))}
    </div>
  )
}
