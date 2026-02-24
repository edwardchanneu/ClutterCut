import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import type { Session } from '@supabase/supabase-js'

// Mock useAuth to control session state in tests
vi.mock('../hooks/useAuth')
import { useAuth } from '../hooks/useAuth'

function renderWithRouter(ui: React.ReactNode, { initialPath = '/' } = {}): void {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<ProtectedRoute>{ui}</ProtectedRoute>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    renderWithRouter(<div>Protected Content</div>)

    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when a session exists (authenticated)', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: 'user-123' } } as Session,
      loading: false
    })

    renderWithRouter(<div>Protected Content</div>)

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })
})
