import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUndo } from './useUndo'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock TanStack Query — we only need invalidateQueries
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() }))
}))

// Mock lib/runs so we don't touch Supabase
vi.mock('../lib/runs', () => ({
  updateRunStatus: vi.fn(),
  insertRun: vi.fn()
}))

import { updateRunStatus, insertRun } from '../lib/runs'
import type { QueuedRun, UndoRunResponse } from '../../../shared/ipcChannels'

// ---------------------------------------------------------------------------
// window.api and navigator.onLine setup
// ---------------------------------------------------------------------------

const mockUndoRun = vi.fn()
const originalOnLine = navigator.onLine

beforeAll(() => {
  window.api = {
    ...window.api,
    undoRun: mockUndoRun
  } as unknown as typeof window.api

  Object.defineProperty(window, 'crypto', {
    value: { randomUUID: () => 'mock-uuid-123' },
    configurable: true
  })
})

afterAll(() => {
  Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true })
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseRun: QueuedRun = {
  id: 'run-1',
  user_id: 'user-1',
  folder_path: '/root',
  ran_at: '2026-03-11T10:00:00Z',
  rules: [],
  before_snapshot: { '/root': ['a.pdf', 'b.txt'] },
  after_snapshot: {
    '/root': ['untouched.md', { Docs: ['a.pdf', 'b.txt'] }]
  },
  files_affected: 2,
  is_undo: false,
  undone: false,
  parent_run_id: null
}

const fullSuccessResponse: UndoRunResponse = {
  success: true,
  restoredFiles: ['a.pdf', 'b.txt'],
  skippedFiles: [],
  touchedFolders: ['Docs']
}

const partialResponse: UndoRunResponse = {
  success: false,
  restoredFiles: ['a.pdf'],
  skippedFiles: [{ fileName: 'b.txt', reason: 'File no longer exists at moved location.' }],
  touchedFolders: ['Docs']
}

const totalFailureResponse: UndoRunResponse = {
  success: false,
  restoredFiles: [],
  skippedFiles: [{ fileName: 'a.pdf', reason: 'File no longer exists at moved location.' }],
  touchedFolders: []
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useUndo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    // Suppress the hook's intentional console.error logging during error-path tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws immediately when offline, without calling undoRun', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })

    const { result } = renderHook(() => useUndo())

    await act(async () => {
      await expect(result.current.undoRunAction(baseRun)).rejects.toThrow(
        'Undo requires an active internet connection.'
      )
    })

    expect(mockUndoRun).not.toHaveBeenCalled()
    expect(updateRunStatus).not.toHaveBeenCalled()
    expect(insertRun).not.toHaveBeenCalled()
  })

  it('throws when the undo totally fails (0 files restored), without persisting anything', async () => {
    mockUndoRun.mockResolvedValueOnce(totalFailureResponse)

    const { result } = renderHook(() => useUndo())

    await act(async () => {
      await expect(result.current.undoRunAction(baseRun)).rejects.toThrow(
        'File no longer exists at moved location.'
      )
    })

    expect(updateRunStatus).not.toHaveBeenCalled()
    expect(insertRun).not.toHaveBeenCalled()
  })

  it('full undo: marks original as undone and inserts run with swapped snapshots', async () => {
    mockUndoRun.mockResolvedValueOnce(fullSuccessResponse)
    vi.mocked(updateRunStatus).mockResolvedValueOnce(undefined)
    vi.mocked(insertRun).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useUndo())

    let response!: UndoRunResponse
    await act(async () => {
      response = await result.current.undoRunAction(baseRun)
    })

    expect(response).toEqual(fullSuccessResponse)

    // Original run must be marked undone
    expect(updateRunStatus).toHaveBeenCalledWith('run-1', true)

    // Inserted undo run must have correct metadata
    expect(insertRun).toHaveBeenCalledOnce()
    const inserted = vi.mocked(insertRun).mock.calls[0][0]
    expect(inserted.is_undo).toBe(true)
    expect(inserted.undone).toBe(false)
    expect(inserted.parent_run_id).toBe('run-1')
    expect(inserted.files_affected).toBe(2) // restoredFiles.length

    // Full undo: before = original after, after = original before (simple swap)
    expect(inserted.before_snapshot).toBe(baseRun.after_snapshot)
    expect(inserted.after_snapshot).toEqual(baseRun.before_snapshot)

    expect(result.current.error).toBeNull()
    expect(result.current.isUndoing).toBe(false)
  })

  it('partial undo: after_snapshot reflects only actually-restored files and retains skipped sub-folders', async () => {
    mockUndoRun.mockResolvedValueOnce(partialResponse)
    vi.mocked(updateRunStatus).mockResolvedValueOnce(undefined)
    vi.mocked(insertRun).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useUndo())

    await act(async () => {
      await result.current.undoRunAction(baseRun)
    })

    const inserted = vi.mocked(insertRun).mock.calls[0][0]
    expect(inserted.files_affected).toBe(1) // only a.pdf was restored

    // before_snapshot is still the organized state
    expect(inserted.before_snapshot).toBe(baseRun.after_snapshot)

    // after_snapshot must be built accurately:
    const afterSnap = inserted.after_snapshot as Record<
      string,
      (string | Record<string, string[]>)[]
    >
    const rootItems = afterSnap['/root']
    expect(rootItems).toBeDefined()

    // Untouched root file from organized snapshot must be preserved
    expect(rootItems).toContain('untouched.md')

    // Restored file must appear at root
    expect(rootItems).toContain('a.pdf')

    // b.txt was skipped, so Docs sub-folder must still contain it
    const docsFolder = rootItems.find(
      (item): item is Record<string, string[]> =>
        typeof item === 'object' && item !== null && 'Docs' in item
    )
    expect(docsFolder).toBeDefined()
    expect(docsFolder!['Docs']).toContain('b.txt')

    // a.pdf was restored, so it must NOT remain in the Docs sub-folder
    expect(docsFolder!['Docs']).not.toContain('a.pdf')
  })

  it('sets isUndoing to true during the operation and false after', async () => {
    let resolveUndo!: (value: UndoRunResponse) => void
    mockUndoRun.mockReturnValueOnce(
      new Promise<UndoRunResponse>((resolve) => {
        resolveUndo = resolve
      })
    )
    vi.mocked(updateRunStatus).mockResolvedValue(undefined)
    vi.mocked(insertRun).mockResolvedValue(undefined)

    const { result } = renderHook(() => useUndo())

    act(() => {
      result.current.undoRunAction(baseRun).catch(() => {})
    })

    // Should be undoing immediately after kickoff
    expect(result.current.isUndoing).toBe(true)

    await act(async () => {
      resolveUndo(fullSuccessResponse)
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(result.current.isUndoing).toBe(false)
  })

  it('sets error state when undoRun rejects unexpectedly', async () => {
    mockUndoRun.mockRejectedValueOnce(new Error('Disk I/O error'))

    const { result } = renderHook(() => useUndo())

    await act(async () => {
      await expect(result.current.undoRunAction(baseRun)).rejects.toThrow('Disk I/O error')
    })

    expect(result.current.error).toEqual(new Error('Disk I/O error'))
    expect(updateRunStatus).not.toHaveBeenCalled()
    expect(insertRun).not.toHaveBeenCalled()
  })
})
