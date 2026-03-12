import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSyncQueue } from './useSyncQueue'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn()
  }
}))

const mockQueryClient = {
  invalidateQueries: vi.fn()
}

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => mockQueryClient)
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
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true
    })
    mockGetOfflineRuns.mockResolvedValue({ success: true, runs: [] })
  })

  it('should not sync when offline on mount', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    renderHook(() => useSyncQueue())
    expect(mockGetOfflineRuns).not.toHaveBeenCalled()
  })

  it('should sync successfully when online on mount', async () => {
    const mockRuns = [{ id: 'run-1', user_id: 'user-1' }]
    mockGetOfflineRuns.mockResolvedValueOnce({ success: true, runs: mockRuns })
    vi.mocked(supabase.from('organization_runs').insert).mockResolvedValue({
      data: null,
      error: null,
      count: null,
      status: 201,
      statusText: 'Created'
    } as unknown as {
      data: null
      error: null
      count: null
      status: number
      statusText: string
    })
    mockRemoveOfflineRun.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useSyncQueue())

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false)
    })

    expect(mockGetOfflineRuns).toHaveBeenCalledTimes(1)
    expect(supabase.from('organization_runs').insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'run-1' })
    )
    expect(mockRemoveOfflineRun).toHaveBeenCalledWith({ runId: 'run-1' })
  })

  it('should sync when the online event is fired', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const { result } = renderHook(() => useSyncQueue())

    expect(mockGetOfflineRuns).not.toHaveBeenCalled()

    // Simulate going online
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    await act(async () => {
      window.dispatchEvent(new Event('online'))
    })

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false)
    })

    expect(mockGetOfflineRuns).toHaveBeenCalled()
  })

  it('should handle getOfflineRuns failure', async () => {
    mockGetOfflineRuns.mockResolvedValueOnce({ success: false, error: 'FS Error' })
    const { result } = renderHook(() => useSyncQueue())

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false)
    })

    expect(supabase.from).not.toHaveBeenCalled()
  })
})
