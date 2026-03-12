import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSaveRun } from './useSaveRun'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn()
  }
}))

// Mock window.api and navigator.onLine
const originalOnLine = navigator.onLine
const mockSaveRunOffline = vi.fn()

beforeAll(() => {
  window.api = {
    ...window.api,
    saveRunOffline: mockSaveRunOffline
  } as unknown as typeof window.api
})

afterAll(() => {
  Object.defineProperty(navigator, 'onLine', {
    value: originalOnLine,
    configurable: true
  })
})

describe('useSaveRun', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true
    })
  })

  it('should save to Supabase when online', async () => {
    vi.mocked(supabase.from('organization_runs').insert).mockResolvedValueOnce({
      error: null
    } as unknown as never)

    const { result } = renderHook(() => useSaveRun())

    await act(async () => {
      await result.current.saveRun('user-1', '/folder', [], {}, {}, 5)
    })

    expect(supabase.from).toHaveBeenCalledWith('organization_runs')
    expect(supabase.from('organization_runs').insert).toHaveBeenCalled()
    expect(mockSaveRunOffline).not.toHaveBeenCalled()
  })

  it('should save to offline queue when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true
    })

    mockSaveRunOffline.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useSaveRun())

    await act(async () => {
      await result.current.saveRun('user-1', '/folder', [], {}, {}, 5)
    })

    expect(supabase.from('organization_runs').insert).not.toHaveBeenCalled()
    expect(mockSaveRunOffline).toHaveBeenCalled()
  })

  it('should format payload correctly when online', async () => {
    const insertMock = vi.fn().mockResolvedValueOnce({ error: null })
    vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as unknown as ReturnType<
      typeof supabase.from
    >)

    const { result } = renderHook(() => useSaveRun())

    await act(async () => {
      await result.current.saveRun('user-3', '/docs', ['rule'], { a: 1 }, { b: 2 }, 10)
    })

    const callPayload = insertMock.mock.calls[0][0]
    expect(callPayload.user_id).toBe('user-3')
    expect(callPayload.folder_path).toBe('/docs')
    expect(callPayload.files_affected).toBe(10)
    expect(callPayload.synced_at).toBeDefined()
  })

  it('should format payload correctly when offline (no synced_at)', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    mockSaveRunOffline.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useSaveRun())

    await act(async () => {
      await result.current.saveRun('user-4', '/pics', [], {}, {}, 3)
    })

    const queuePayload = mockSaveRunOffline.mock.calls[0][0].run
    expect(queuePayload.user_id).toBe('user-4')
    expect(queuePayload.folder_path).toBe('/pics')
    expect(queuePayload.files_affected).toBe(3)
    expect(queuePayload.synced_at).toBeUndefined()
  })
})
