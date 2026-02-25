import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthError, Session, User } from '@supabase/supabase-js'
import LoginScreen from './LoginScreen'
import { supabase } from '../lib/supabase'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn()
    }
  }
}))

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders login screen with email field, password field, and Login button', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LoginScreen />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue as guest/i })).toBeInTheDocument()
  })

  it('validates empty fields client-side before submission', () => {
    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    expect(screen.getByText(/please fill in both email and password/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('validates email format client-side before submission', () => {
    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('displays a clear inline error message for invalid credentials', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Incorrect email or password' } as AuthError
    })

    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('authenticates valid credentials and navigates to the folder selection screen', async () => {
    const mockSession = { access_token: '123' } as unknown as Session
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: {} as User, session: mockSession },
      error: null
    })

    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/organize')
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('handles network errors gracefully', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockRejectedValueOnce(new Error('Network error'))

    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    expect(await screen.findByText(/A network error occurred/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to organize screen when "Continue as Guest" is clicked', () => {
    render(
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /continue as guest/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/organize')
  })
})
