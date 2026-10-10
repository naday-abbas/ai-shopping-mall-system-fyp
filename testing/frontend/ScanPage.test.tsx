import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ScanPage from '../../frontend/src/pages/ScanPage'
import { LanguageProvider } from '../../frontend/src/i18n/LanguageContext'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// Real <Webcam> needs a live camera stream, which jsdom can't provide —
// swap it for a harmless stand-in so the component tree still mounts.
vi.mock('react-webcam', () => ({
  default: () => null,
}))

vi.mock('../../frontend/src/services/weatherService', () => ({
  getWeatherInfo: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../frontend/src/hooks/useFaceDetection', () => ({
  useFaceDetection: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: null } }),
    post: vi.fn(),
  },
}))

import axios from 'axios'
import { useFaceDetection } from '../../frontend/src/hooks/useFaceDetection'

function mockFace(overrides: Partial<ReturnType<typeof useFaceDetection>>) {
  vi.mocked(useFaceDetection).mockReturnValue({
    status: 'face-good',
    hasFace: true,
    isBlurry: false,
    blurScore: 100,
    supported: true,
    ...overrides,
  })
}

describe('ScanPage — Scan Profile click', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks the scan and warns the user when no face is in frame', async () => {
    mockFace({ status: 'face-none', hasFace: false })
    render(<LanguageProvider><ScanPage /></LanguageProvider>)

    fireEvent.click(await screen.findByText('Scan Profile'))

    expect(await screen.findByText(/No face detected/i)).toBeInTheDocument()
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('blocks the scan and warns the user when the image is too blurry', async () => {
    mockFace({ status: 'blurry', hasFace: true, isBlurry: true })
    render(<LanguageProvider><ScanPage /></LanguageProvider>)

    fireEvent.click(await screen.findByText('Scan Profile'))

    expect(await screen.findByText(/hold still and try again/i)).toBeInTheDocument()
    expect(axios.post).not.toHaveBeenCalled()
  })
})
