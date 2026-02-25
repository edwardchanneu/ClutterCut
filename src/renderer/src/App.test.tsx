import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Session } from '@supabase/supabase-js'
import App, { AppRoutes } from './App'
import { supabase } from './lib/supabase'
import { MemoryRouter } from 'react-router-dom'
import { GuestProvider } from './context/GuestProvider'

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
    }
  }
}))

describe('App Integration Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.location.hash = ''
  })

  it('renders loading state initially while checking session', async () => {
    // If getSession takes time, App shows "Checking session..."
    let resolveSession: (value: unknown) => void
    const sessionPromise = new Promise((resolve) => {
      resolveSession = resolve
    })
    vi.mocked(supabase.auth.getSession).mockReturnValueOnce(
      sessionPromise as unknown as ReturnType<typeof supabase.auth.getSession>
    )

    render(<App />)

    expect(screen.getByText(/checking session/i)).toBeInTheDocument()

    // Cleanup
    await act(async () => {
      resolveSession!({ data: { session: null }, error: null })
    })
  })

  it('navigates to organize screen when "Continue as Guest" is clicked without being blocked', async () => {
    // Resolve with no session => shows LoginScreen
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    } as unknown as ReturnType<typeof supabase.auth.onAuthStateChange>)

    render(<App />)

    // Wait for Login to render
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue as guest/i })).toBeInTheDocument()
    })

    // Click Guest
    fireEvent.click(screen.getByRole('button', { name: /continue as guest/i }))

    // Should load the Organize Screen. Let's look for something specific to it.
    // e.g "Select a Folder", "Organize", "ClutterCut" header.
    await waitFor(() => {
      // Since we are mocking, we just check if it passed route. OrganizeScreen probably has a specific heading
      // Our previous bug would have bounded it back to LoginScreen. Let's make sure LoginScreen disappears.
      expect(screen.queryByRole('button', { name: /continue as guest/i })).not.toBeInTheDocument()
    })

    // We should be on OrganizeScreen.
    expect(screen.getByText(/ClutterCut/i)).toBeInTheDocument()
  })

  it('redirects an authenticated user away from /login to /organize', async () => {
    // Session exists
    const mockSession = { access_token: '123' } as unknown as Session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    })
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    } as unknown as ReturnType<typeof supabase.auth.onAuthStateChange>)

    render(
      <GuestProvider>
        <MemoryRouter initialEntries={['/login']}>
          <AppRoutes />
        </MemoryRouter>
      </GuestProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/ClutterCut/i)).toBeInTheDocument()
    })
    // It shouldn't show login
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
  })

  it('redirects an authenticated user from an unknown route to /organize', async () => {
    const mockSession = { access_token: '123' } as unknown as Session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    })
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    } as unknown as ReturnType<typeof supabase.auth.onAuthStateChange>)

    render(
      <GuestProvider>
        <MemoryRouter initialEntries={['/unknown-route']}>
          <AppRoutes />
        </MemoryRouter>
      </GuestProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/ClutterCut/i)).toBeInTheDocument()
    })
  })

  it('redirects an unauthenticated user from an unknown route to /login', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    } as unknown as ReturnType<typeof supabase.auth.onAuthStateChange>)

    render(
      <GuestProvider>
        <MemoryRouter initialEntries={['/unknown-route']}>
          <AppRoutes />
        </MemoryRouter>
      </GuestProvider>
    )

    // Should render login screen
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    })
  })

  it('redirects an authenticated user away from /signup to /organize', async () => {
    const mockSession = { access_token: '123' } as unknown as Session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    })
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    } as unknown as ReturnType<typeof supabase.auth.onAuthStateChange>)

    render(
      <GuestProvider>
        <MemoryRouter initialEntries={['/signup']}>
          <AppRoutes />
        </MemoryRouter>
      </GuestProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/ClutterCut/i)).toBeInTheDocument()
    })
    // It shouldn't show signup
    expect(screen.queryByLabelText(/create account/i)).not.toBeInTheDocument()
  })

  it('allows an authenticated user to access /history without redirecting', async () => {
    const mockSession = { access_token: '123' } as unknown as Session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    })
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    } as unknown as ReturnType<typeof supabase.auth.onAuthStateChange>)

    render(
      <GuestProvider>
        <MemoryRouter initialEntries={['/history']}>
          <AppRoutes />
        </MemoryRouter>
      </GuestProvider>
    )

    // We should see Organization History (which is on the HistoryScreen)
    await waitFor(() => {
      expect(screen.getByText(/Organization History/i)).toBeInTheDocument()
    })
  })

  it('redirects an unauthenticated user away from /history to /login', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    })
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    } as unknown as ReturnType<typeof supabase.auth.onAuthStateChange>)

    render(
      <GuestProvider>
        <MemoryRouter initialEntries={['/history']}>
          <AppRoutes />
        </MemoryRouter>
      </GuestProvider>
    )

    // It should boot us back to the Login screen
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue as guest/i })).toBeInTheDocument()
    })
    expect(screen.queryByText(/Organization History/i)).not.toBeInTheDocument()
  })
})
