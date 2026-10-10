import { useState, useRef, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FaceState {
  hasFace: boolean
  isBlurry: boolean
  blurScore: number
  status: 'loading' | 'detecting' | 'face-good' | 'face-none' | 'blurry' | 'unsupported'
  supported: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BLUR_THRESHOLD = 18
const POLL_MS = 400

// ─── Reusable canvas for blur analysis ───────────────────────────────────────

let _cvs: HTMLCanvasElement | null = null
function cvs(): HTMLCanvasElement {
  if (!_cvs) _cvs = document.createElement('canvas')
  return _cvs
}

function calcBlur(video: HTMLVideoElement): number {
  const c = cvs()
  const W = 160
  c.width = W
  c.height = Math.round(W * (video.videoHeight / video.videoWidth))
  const ctx = c.getContext('2d')!
  ctx.drawImage(video, 0, 0, c.width, c.height)
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height)
  const sx = Math.floor(width * 0.2), sy = Math.floor(height * 0.2)
  const ex = Math.floor(width * 0.8), ey = Math.floor(height * 0.8)
  let sum = 0, sumSq = 0, n = 0
  for (let y = sy; y < ey; y++) {
    for (let x = sx; x < ex; x++) {
      const i = (y * width + x) * 4
      const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      sum += l; sumSq += l * l; n++
    }
  }
  const m = sum / n
  return Math.sqrt(sumSq / n - m * m)
}

// ─── Face detection using BOTH native API and CDN fallback ──────────────────

type FaceDetectorFn = (video: HTMLVideoElement) => Promise<boolean>

async function createFaceDetector(): Promise<FaceDetectorFn | null> {
  // Try native FaceDetector API first (Chrome/Edge)
  if (typeof FaceDetector !== 'undefined') {
    try {
      const native = new FaceDetector({ maxDetectedFaces: 3 })
      return async (video) => {
        try {
          const faces = await native.detect(video)
          return faces.length > 0
        } catch { return false }
      }
    } catch { /* fall through */ }
  }

  // Fallback: try loading face-api.js from CDN (works in ALL browsers)
  try {
    // @ts-ignore
    const faceapi = await import('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.5/dist/face-api.esm.js')
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.5/model/')
    return async (video) => {
      try {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        return detections.length > 0
      } catch { return false }
    }
  } catch {
    return null // face detection not available at all
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFaceDetection(
  webcamRef: React.RefObject<{ video: HTMLVideoElement | null } | null>,
  active: boolean,
) {
  const [state, setState] = useState<FaceState>({
    hasFace: false,
    isBlurry: false,
    blurScore: 0,
    status: 'loading',
    supported: true,
  })

  const detectFnRef = useRef<FaceDetectorFn | null>(null)
  const [ready, setReady] = useState(false)

  // ── Initialise face detector (async: loads from CDN if native unavailable) ─
  useEffect(() => {
    let cancelled = false
    createFaceDetector().then(fn => {
      if (cancelled) return
      if (fn) {
        detectFnRef.current = fn
        setReady(true)
        setState(prev => ({ ...prev, status: 'detecting', supported: true }))
      } else {
        setReady(false)
        setState(prev => ({ ...prev, status: 'unsupported', supported: false }))
      }
    }).catch(() => {
      if (!cancelled) {
        setReady(false)
        setState(prev => ({ ...prev, status: 'unsupported', supported: false }))
      }
    })
    return () => { cancelled = true }
  }, [])

  // ── Detection poll (re-runs when ready becomes true) ─────────────────────
  useEffect(() => {
    if (!active || !ready) return

    let mounted = true
    let timer: ReturnType<typeof setTimeout>

    const poll = async () => {
      if (!mounted) return
      const video = webcamRef.current?.video
      if (!video || video.readyState < 2) {
        timer = setTimeout(poll, POLL_MS)
        return
      }

      // Blur check (canvas-based — works everywhere)
      const blurScore = calcBlur(video)
      const blurry = blurScore < BLUR_THRESHOLD

      // Face detection
      let hasFace = false
      try {
        if (detectFnRef.current) {
          hasFace = await detectFnRef.current(video)
        }
      } catch { /* skip */ }

      if (!mounted) return

      let status: FaceState['status']
      if (!hasFace) status = 'face-none'
      else if (blurry) status = 'blurry'
      else status = 'face-good'

      setState({ hasFace, isBlurry: blurry, blurScore: Math.round(blurScore), status, supported: true })
      timer = setTimeout(poll, POLL_MS)
    }

    poll()
    return () => { mounted = false; clearTimeout(timer) }
  }, [active, webcamRef, ready])

  return state
}
