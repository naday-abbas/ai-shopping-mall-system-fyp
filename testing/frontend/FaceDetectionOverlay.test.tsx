import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FaceDetectionOverlay from '../../frontend/src/components/FaceDetectionOverlay'
import type { FaceState } from '../../frontend/src/hooks/useFaceDetection'

function makeDetection(status: FaceState['status']): FaceState {
  return { status, hasFace: false, isBlurry: false, blurScore: 0, supported: true }
}

describe('FaceDetectionOverlay', () => {
  it('shows "Loading…" while the camera is starting', () => {
    render(<FaceDetectionOverlay detection={makeDetection('loading')} />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.getByText('Starting camera…')).toBeInTheDocument()
  })

  it('shows "Face Found" and the scan hint once a face is detected', () => {
    render(<FaceDetectionOverlay detection={makeDetection('face-good')} />)
    expect(screen.getByText('Face Found')).toBeInTheDocument()
    expect(screen.getByText('Face detected! Tap Scan Profile')).toBeInTheDocument()
  })

  it('shows "No Face" when nobody is in frame', () => {
    render(<FaceDetectionOverlay detection={makeDetection('face-none')} />)
    expect(screen.getByText('No Face')).toBeInTheDocument()
    expect(screen.getByText('No face found — position yourself in frame')).toBeInTheDocument()
  })

  it('shows "Too Blurry" and warns the user to hold still', () => {
    render(<FaceDetectionOverlay detection={makeDetection('blurry')} />)
    expect(screen.getByText('Too Blurry')).toBeInTheDocument()
    expect(screen.getByText('Hold still — image is blurry')).toBeInTheDocument()
  })

  it('tells the user to switch browsers when detection is unsupported', () => {
    render(<FaceDetectionOverlay detection={makeDetection('unsupported')} />)
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
    expect(screen.getByText('Use Chrome/Edge for face detection')).toBeInTheDocument()
  })
})
