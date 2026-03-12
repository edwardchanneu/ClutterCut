import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHistory } from './useHistory'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../lib/runs', () => ({
  getRuns: vi.fn()
}))

import { getRuns } from '../lib/runs'

// Mock window.api.getOfflineRuns
const mockGetOfflineRuns = vi.fn()
window.api = {
  ...window.api,
  getOfflineRuns: mockGetOfflineRuns
} as unknown as typeof window.api

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

import type { QueuedRun } from '../../../shared/ipcChannels'

const makeRun = (overrides: Partial<QueuedRun>): QueuedRun => ({
  id: 'run-default',
  user_id: 'user-1',
  folder_path: '/root',
  ran_at: '2026-03-11T10:00:00Z',
  rules: [],
  before_snapshot: {},
  after_snapshot: {},
  files_affected: 0,
  is_undo: false,
  undone: false,
  parent_run_id: null,
  ...overrides
})

// Wrapper that provides a fresh QueryClient for each test (no shared cache)
function makeWrapper(): React.FC<{ children: React.ReactNode }> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  Wrapper.displayName = 'TestQueryClientWrapper'
  return Wrapper
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns isLoading=true initially and resolves with remote runs', async () => {
    const remoteRun = makeRun({ id: 'remote-1', ran_at: '2026-03-11T12:00:00Z' })
    vi.mocked(getRuns).mockResolvedValueOnce([remoteRun])
    mockGetOfflineRuns.mockResolvedValueOnce({ success: true, runs: [] })

    const { result } = renderHook(() => useHistory('user-1'), { wrapper: makeWrapper() })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.runs).toHaveLength(1)
    expect(result.current.runs[0].id).toBe('remote-1')
    expect(result.current.error).toBeNull()
  })

  it('does not fetch remote runs when userId is undefined', async () => {
    mockGetOfflineRuns.mockResolvedValueOnce({ success: true, runs: [] })

    const { result } = renderHook(() => useHistory(undefined), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(getRuns).not.toHaveBeenCalled()
    expect(result.current.runs).toHaveLength(0)
  })

  it('marks local-only runs as isPendingSync and deduplicates against remote runs', async () => {
    const sharedRun = makeRun({ id: 'shared', ran_at: '2026-03-11T09:00:00Z' })
    const localOnlyRun = makeRun({ id: 'local-only', ran_at: '2026-03-11T08:00:00Z' })

    vi.mocked(getRuns).mockResolvedValueOnce([sharedRun])
    mockGetOfflineRuns.mockResolvedValueOnce({
      success: true,
      runs: [sharedRun, localOnlyRun] // `sharedRun` appears in both — should be deduplicated
    })

    const { result } = renderHook(() => useHistory('user-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.runs).toHaveLength(2)

    const shared = result.current.runs.find((r) => r.id === 'shared')
    expect(shared?.isPendingSync).toBeUndefined() // came from remote, not marked pending

    const local = result.current.runs.find((r) => r.id === 'local-only')
    expect(local?.isPendingSync).toBe(true)
  })

  it('sorts combined runs by ran_at descending (newest first)', async () => {
    const old = makeRun({ id: 'old', ran_at: '2026-03-10T08:00:00Z' })
    const mid = makeRun({ id: 'mid', ran_at: '2026-03-11T08:00:00Z' })
    const newest = makeRun({ id: 'newest', ran_at: '2026-03-12T08:00:00Z' })

    // Remote has old + mid; local has newest (pending)
    vi.mocked(getRuns).mockResolvedValueOnce([old, mid])
    mockGetOfflineRuns.mockResolvedValueOnce({ success: true, runs: [newest] })

    const { result } = renderHook(() => useHistory('user-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const ids = result.current.runs.map((r) => r.id)
    expect(ids).toEqual(['newest', 'mid', 'old'])
  })

  it('surfaces a remote fetch error in the error field', async () => {
    vi.mocked(getRuns).mockRejectedValueOnce(new Error('Network error'))
    mockGetOfflineRuns.mockResolvedValueOnce({ success: true, runs: [] })

    const { result } = renderHook(() => useHistory('user-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.error).not.toBeNull())

    expect(result.current.error?.message).toBe('Network error')
  })

  it('surfaces a local fetch error in the error field', async () => {
    vi.mocked(getRuns).mockResolvedValueOnce([])
    mockGetOfflineRuns.mockResolvedValueOnce({ success: false, error: 'Disk read failure' })

    const { result } = renderHook(() => useHistory('user-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.error).not.toBeNull())

    expect(result.current.error?.message).toBe('Disk read failure')
  })
})
