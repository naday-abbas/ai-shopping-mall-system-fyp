// Type declarations for the experimental FaceDetector API
// https://wicg.github.io/shape-detection-api/

interface FaceDetectorOptions {
  maxDetectedFaces?: number
  fastMode?: boolean
}

interface DetectedFace {
  boundingBox: DOMRect
  landmarks: Array<{ type: string; locations: Array<{ x: number; y: number }> }>
}

declare class FaceDetector {
  constructor(options?: FaceDetectorOptions)
  detect(image: ImageBitmapSource): Promise<DetectedFace[]>
}
