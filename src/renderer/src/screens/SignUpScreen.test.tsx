import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SignUpScreen from './SignUpScreen'

// ── mock navigate ────────────────────────────────────────────────────────────
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── mock Supabase client ─────────────────────────────────────────────────────
// Use vi.hoisted so the factory reference is available before vi.mock is hoisted
const { mockSignUp } = vi.hoisted(() => ({ mockSignUp: vi.fn() }))
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { signUp: mockSignUp } }
}))

// ── helpers ──────────────────────────────────────────────────────────────────
function renderSignUp(): void {
  render(
    <MemoryRouter>
      <SignUpScreen />
    </MemoryRouter>
  )
}

function fillForm(email: string, password: string): void {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } })
}

// ── tests ─────────────────────────────────────────────────────────────────────
describe('SignUpScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email field, password field, and Sign Up button', () => {
    renderSignUp()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('shows error when fields are empty', async () => {
    renderSignUp()
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    expect(await screen.findByText(/please fill in both email and password/i)).toBeInTheDocument()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows error for invalid email format', async () => {
    renderSignUp()
    fillForm('not-an-email', 'password123')
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows error when password is shorter than 8 characters', async () => {
    renderSignUp()
    fillForm('user@example.com', 'short')
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('navigates to /organize on successful sign-up with session', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: 'u1' }, session: { access_token: 'tok' } },
      error: null
    })
    renderSignUp()
    fillForm('new@example.com', 'password123')
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/organize'))
  })

  it('shows confirmation banner when sign-up succeeds but no session (email confirmation enabled)', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: 'u1' }, session: null },
      error: null
    })
    renderSignUp()
    fillForm('confirm@example.com', 'password123')
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('shows inline error when email is already registered', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'User already registered' }
    })
    renderSignUp()
    fillForm('existing@example.com', 'password123')
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    expect(await screen.findByText(/account with this email already exists/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
