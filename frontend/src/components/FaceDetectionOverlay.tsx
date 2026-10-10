import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, EyeOff, Loader2, CheckCircle2, Camera, User } from 'lucide-react'
import type { FaceState } from '../hooks/useFaceDetection'

interface Props { detection: FaceState }

const META: Record<
  FaceState['status'],
  { label: string; icon: typeof User; color: string; hint: string }
> = {
  loading:   { label: 'Loading…',     icon: Loader2,      color: '#94a3b8', hint: 'Starting camera…' },
  detecting: { label: 'Detecting…',   icon: Camera,       color: '#06b6d4', hint: 'Looking for a face…' },
  'face-good': { label: 'Face Found',   icon: CheckCircle2, color: '#34d399', hint: 'Face detected! Tap Scan Profile' },
  'face-none': { label: 'No Face',     icon: EyeOff,       color: '#f87171', hint: 'No face found — position yourself in frame' },
  blurry:    { label: 'Too Blurry',   icon: AlertTriangle, color: '#fb923c', hint: 'Hold still — image is blurry' },
  unsupported: { label: 'Unavailable', icon: EyeOff,       color: '#94a3b8', hint: 'Use Chrome/Edge for face detection' },
}

export default function FaceDetectionOverlay({ detection }: Props) {
  const cfg = META[detection.status]
  const isBad = detection.status === 'face-none' || detection.status === 'blurry'

  return (
    <>
      {/* Status badge */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <motion.div
          className="flex items-center gap-2 rounded-full px-3.5 py-1.5"
          style={{
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${cfg.color}55`,
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <cfg.icon size={13} strokeWidth={2} style={{ color: cfg.color }}
            className={detection.status === 'detecting' ? 'animate-pulse' : ''} />
          <span className="text-[10px] tracking-wider font-semibold uppercase" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </motion.div>
      </div>

      {/* Hint */}
      <AnimatePresence mode="wait">
        <motion.div key={detection.status} className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          <span className="text-[9px] tracking-[0.25em] uppercase font-medium px-3 py-1 rounded-full"
            style={{ color: cfg.color, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: `1px solid ${cfg.color}33` }}>
            {cfg.hint}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Pulsing border for bad states */}
      {isBad && (
        <motion.div className="absolute inset-0 z-5 pointer-events-none rounded-2xl"
          style={{ border: `1.5px solid ${cfg.color}55`, boxShadow: `inset 0 0 30px ${cfg.color}22` }}
          animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
      )}
    </>
  )
}
