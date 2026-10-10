import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../../frontend/src/pages/LoginPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    defaults: { headers: { common: {} as Record<string, string> } },
  },
}))

import axios from 'axios'

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

describe('LoginPage — Sign In click', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('logs in, stores the token, and navigates to /admin on success', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { token: 'fake-jwt-token' } })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('admin'), 'admin')
    await user.type(screen.getByPlaceholderText('••••••••'), 'secret123')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'))
    expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
      username: 'admin',
      password: 'secret123',
    })
    expect(localStorage.getItem('admin_token')).toBe('fake-jwt-token')
  })

  it('shows an error and does not navigate on wrong credentials', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('Unauthorized'))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('admin'), 'admin')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(localStorage.getItem('admin_token')).toBeNull()
  })

  it('toggles password visibility when the eye icon is clicked', async () => {
    renderLogin()
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement
    expect(passwordInput.type).toBe('password')

    fireEvent.click(screen.getByLabelText('Show password'))
    expect(passwordInput.type).toBe('text')

    fireEvent.click(screen.getByLabelText('Hide password'))
    expect(passwordInput.type).toBe('password')
  })
})
