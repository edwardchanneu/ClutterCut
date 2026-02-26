import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signOut } from '../lib/auth'

// Mock the Supabase client module so no real HTTP calls are made
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn()
    }
  }
}))

// Import the mocked supabase *after* vi.mock is hoisted
import { supabase } from '../lib/supabase'

describe('signOut helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase.auth.signOut() exactly once', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null })

    await signOut()

    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('returns null when sign-out succeeds', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null })

    const result = await signOut()

    expect(result).toBeNull()
  })

  it('returns the error when supabase.auth.signOut fails', async () => {
    const mockError = {
      message: 'Network error',
      status: 500,
      code: 'network_error'
    } as import('@supabase/supabase-js').AuthError
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: mockError })

    const result = await signOut()

    expect(result).toBe(mockError)
  })
})
