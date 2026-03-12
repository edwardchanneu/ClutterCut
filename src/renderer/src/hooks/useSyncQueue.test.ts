import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSyncQueue } from './useSyncQueue'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn()
  }
}))

const originalOnLine = navigator.onLine
const mockGetOfflineRuns = vi.fn()
const mockRemoveOfflineRun = vi.fn()

beforeAll(() => {
  window.api = {
    ...window.api,
    getOfflineRuns: mockGetOfflineRuns,
    removeOfflineRun: mockRemoveOfflineRun
  } as unknown as typeof window.api
})

afterAll(() => {
  Object.defineProperty(navigator, 'onLine', {
    value: originalOnLine,
    configurable: true
  })
})

describe('useSyncQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true
    })
    // Provide a safe default so it doesn't return undefined and crash destructuring
    mockGetOfflineRuns.mockResolvedValue({ success: true, runs: [] })
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('should not sync when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const { result } = renderHook(() => useSyncQueue())
    expect(result.current.isOnline).toBe(false)
    expect(mockGetOfflineRuns).not.toHaveBeenCalled()
  })

  it('should sync successfully when online and clear the queue', async () => {
    const mockRuns = [
      { id: 'run-1', user_id: 'user-1' },
      { id: 'run-2', user_id: 'user-1' }
    ]
    mockGetOfflineRuns.mockResolvedValueOnce({ success: true, runs: mockRuns })
    vi.mocked(supabase.from('organization_runs').insert)
      .mockResolvedValueOnce({ error: null } as unknown as never)
      .mockResolvedValueOnce({ error: null } as unknown as never)

    const { result } = renderHook(() => useSyncQueue())
    
    expect(result.current.isSyncing).toBe(true)

    await act(async () => {
      // Need to flush promises for the async syncRuns to finish
      await vi.runAllTimersAsync()
    })

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false)
    })

    expect(mockGetOfflineRuns).toHaveBeenCalledTimes(1)
    expect(supabase.from('organization_runs').insert).toHaveBeenCalledTimes(2)
    expect(mockRemoveOfflineRun).toHaveBeenCalledTimes(2)
    expect(mockRemoveOfflineRun).toHaveBeenNthCalledWith(1, { runId: 'run-1' })
    expect(mockRemoveOfflineRun).toHaveBeenNthCalledWith(2, { runId: 'run-2' })
    expect(result.current.syncError).toBe(null)
  })

  it('should set sync error when supabase insert fails and stop syncing the rest', async () => {
    const mockRuns = [
      { id: 'run-1', user_id: 'user-1' },
      { id: 'run-2', user_id: 'user-1' }
    ]
    mockGetOfflineRuns.mockResolvedValueOnce({ success: true, runs: mockRuns })
    vi.mocked(supabase.from('organization_runs').insert)
      .mockResolvedValueOnce({ error: new Error('Cloud Error') } as unknown as never)

    const { result } = renderHook(() => useSyncQueue())

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false)
    })

    expect(mockGetOfflineRuns).toHaveBeenCalledTimes(1)
    expect(supabase.from('organization_runs').insert).toHaveBeenCalledTimes(1)
    expect(mockRemoveOfflineRun).not.toHaveBeenCalled()
    expect(result.current.syncError).toBe('Cloud Error')
  })

  it('should retry sync on interval if there is a sync error', async () => {
    const mockRuns = [{ id: 'run-1', user_id: 'user-1' }]
    
    // First call fails
    mockGetOfflineRuns.mockResolvedValueOnce({ success: true, runs: mockRuns })
    const insertMock = vi.fn()
      .mockResolvedValueOnce({ error: new Error('Cloud Config Error') } as unknown as never)
      .mockResolvedValueOnce({ error: null } as unknown as never)
      
    vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as unknown as ReturnType<typeof supabase.from>)

    const { result } = renderHook(() => useSyncQueue())

    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false)
    })

    expect(result.current.syncError).toBe('Cloud Config Error')
    expect(insertMock).toHaveBeenCalledTimes(1)

    // Second call succeeds (retry)
    mockGetOfflineRuns.mockResolvedValueOnce({ success: true, runs: mockRuns })
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000)
    })

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false)
      expect(result.current.syncError).toBe(null)
    })

    expect(insertMock).toHaveBeenCalledTimes(2)
    expect(mockRemoveOfflineRun).toHaveBeenCalledTimes(1)
  })
})
