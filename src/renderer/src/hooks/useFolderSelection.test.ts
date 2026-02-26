import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFolderSelection } from './useFolderSelection'
import type { ReadFolderResponse, SelectFolderResponse } from '../../../shared/ipcChannels'

// ---------------------------------------------------------------------------
// Stub window.api so the hook never touches real IPC
// ---------------------------------------------------------------------------

const mockSelectFolder = vi.fn()
const mockReadFolder = vi.fn()

vi.stubGlobal('window', {
  api: {
    selectFolder: mockSelectFolder,
    readFolder: mockReadFolder
  }
})

describe('useFolderSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with null path, empty files, no error, and not loading', () => {
    const { result } = renderHook(() => useFolderSelection())

    expect(result.current.folderPath).toBeNull()
    expect(result.current.files).toHaveLength(0)
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('populates folderPath and files when a valid folder is selected', async () => {
    mockSelectFolder.mockResolvedValueOnce({
      folderPath: '/home/user/docs'
    } satisfies SelectFolderResponse)
    mockReadFolder.mockResolvedValueOnce({
      files: [
        { name: 'resume.pdf', isFile: true },
        { name: 'notes.txt', isFile: true }
      ],
      error: null
    } satisfies ReadFolderResponse)

    const { result } = renderHook(() => useFolderSelection())

    await act(async () => {
      await result.current.selectFolder()
    })

    expect(result.current.folderPath).toBe('/home/user/docs')
    expect(result.current.files).toHaveLength(2)
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('sets files to empty array and no error when folder is empty', async () => {
    mockSelectFolder.mockResolvedValueOnce({
      folderPath: '/home/user/empty'
    } satisfies SelectFolderResponse)
    mockReadFolder.mockResolvedValueOnce({ files: [], error: null } satisfies ReadFolderResponse)

    const { result } = renderHook(() => useFolderSelection())

    await act(async () => {
      await result.current.selectFolder()
    })

    expect(result.current.folderPath).toBe('/home/user/empty')
    expect(result.current.files).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })

  it('sets error and empty files when readFolder returns a permission error', async () => {
    mockSelectFolder.mockResolvedValueOnce({
      folderPath: '/root/private'
    } satisfies SelectFolderResponse)
    mockReadFolder.mockResolvedValueOnce({
      files: [],
      error: 'Permission denied. ClutterCut cannot read this folder.'
    } satisfies ReadFolderResponse)

    const { result } = renderHook(() => useFolderSelection())

    await act(async () => {
      await result.current.selectFolder()
    })

    expect(result.current.files).toHaveLength(0)
    expect(result.current.error).toMatch(/permission denied/i)
    expect(result.current.isLoading).toBe(false)
  })

  it('does not update state when the user cancels the dialog', async () => {
    mockSelectFolder.mockResolvedValueOnce({ folderPath: null } satisfies SelectFolderResponse)

    const { result } = renderHook(() => useFolderSelection())

    await act(async () => {
      await result.current.selectFolder()
    })

    // readFolder should not be called if no folder was selected
    expect(mockReadFolder).not.toHaveBeenCalled()
    expect(result.current.folderPath).toBeNull()
    expect(result.current.files).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })
})
