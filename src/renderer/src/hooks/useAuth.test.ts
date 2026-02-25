import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '../hooks/useAuth'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'

// Mock the Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn()
    }
  }
}))

import { supabase } from '../lib/supabase'

describe('useAuth hook', () => {
  const mockUnsubscribe = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: { unsubscribe: mockUnsubscribe, id: 'test-id', callback: vi.fn() }
      }
    } as unknown as { data: { subscription: import('@supabase/supabase-js').Subscription } })
  })

  it('initially returns loading=true and session=null', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.session).toBeNull()

    // Wait for the effect to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  })

  it('updates state when a valid session is found on mount', async () => {
    const mockSession = { user: { id: '123' }, access_token: 'valid' } as unknown as Session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.session).toEqual(mockSession)
  })

  it('updates state when no session is found on mount', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.session).toBeNull()
  })

  it('updates state when auth state changes (e.g., login or token refresh)', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null
    })

    let authCallback: ((event: AuthChangeEvent, session: Session | null) => void) | undefined
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authCallback = callback as (event: AuthChangeEvent, session: Session | null) => void
      return {
        data: {
          subscription: { unsubscribe: mockUnsubscribe, id: 'test-id', callback: vi.fn() }
        }
      } as unknown as { data: { subscription: import('@supabase/supabase-js').Subscription } }
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.session).toBeNull()

    // Simulate login event
    const newSession = { user: { id: '456' }, access_token: 'new-token' } as unknown as Session
    act(() => {
      if (authCallback) {
        authCallback('SIGNED_IN', newSession)
      }
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.session).toEqual(newSession)
  })

  it('updates state when session expires or user logs out', async () => {
    const initialSession = { user: { id: '123' }, access_token: 'valid' } as unknown as Session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: initialSession },
      error: null
    })

    let authCallback: ((event: AuthChangeEvent, session: Session | null) => void) | undefined
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authCallback = callback as (event: AuthChangeEvent, session: Session | null) => void
      return {
        data: {
          subscription: { unsubscribe: mockUnsubscribe, id: 'test-id', callback: vi.fn() }
        }
      } as unknown as { data: { subscription: import('@supabase/supabase-js').Subscription } }
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.session).toEqual(initialSession)

    // Simulate sign out event
    act(() => {
      if (authCallback) {
        authCallback('SIGNED_OUT', null)
      }
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.session).toBeNull()
  })
})
