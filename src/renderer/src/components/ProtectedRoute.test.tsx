import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { GuestProvider } from '../context/GuestProvider'
import { ProtectedRoute } from './ProtectedRoute'
import type { Session } from '@supabase/supabase-js'

// Mock supabase so env vars are never needed
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}))

// Mock useAuth to control session state
vi.mock('../hooks/useAuth')
import { useAuth } from '../hooks/useAuth'

// Mock useGuest to control guest state
vi.mock('../context/GuestContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../context/GuestContext')>()
  return {
    ...actual,
    useGuest: vi.fn(() => ({ isGuest: false, setIsGuest: vi.fn() }))
  }
})
import { useGuest } from '../context/GuestContext'

interface WrapperProps {
  initialPath: string
}

function renderWithRouter({ initialPath }: WrapperProps): void {
  render(
    <GuestProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route path="/organize" element={<div>Organize Screen</div>} />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <div>History Screen</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </GuestProvider>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children when user is not a guest (authenticated)', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: 'u1' } } as Session,
      loading: false
    })
    vi.mocked(useGuest).mockReturnValue({ isGuest: false, setIsGuest: vi.fn() })
    renderWithRouter({ initialPath: '/history' })
    expect(screen.getByText('History Screen')).toBeInTheDocument()
  })

  it('redirects guest users away from /history to /login', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: 'u1' } } as Session,
      loading: false
    })
    vi.mocked(useGuest).mockReturnValue({ isGuest: true, setIsGuest: vi.fn() })
    renderWithRouter({ initialPath: '/history' })
    expect(screen.queryByText('History Screen')).not.toBeInTheDocument()
    expect(screen.getByText('Login Screen')).toBeInTheDocument()
  })

  it('does not interfere with guest navigation to /organize (unprotected route)', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: null,
      loading: false
    })
    vi.mocked(useGuest).mockReturnValue({ isGuest: true, setIsGuest: vi.fn() })
    renderWithRouter({ initialPath: '/organize' })
    expect(screen.getByText('Organize Screen')).toBeInTheDocument()
  })

  it('renders nothing while auth is still loading', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null, loading: true })

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to /login when there is no session (signed out)', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null, loading: false })
    vi.mocked(useGuest).mockReturnValue({ isGuest: false, setIsGuest: vi.fn() })

    renderWithRouter({ initialPath: '/history' })

    expect(screen.getByText('Login Screen')).toBeInTheDocument()
    expect(screen.queryByText('History Screen')).not.toBeInTheDocument()
  })
})
