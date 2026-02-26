import { describe, it, expect, vi, beforeEach } from 'vitest'
import { selectFolder, readFolder } from './folderService'

// ---------------------------------------------------------------------------
// Mock electron's dialog and BrowserWindow
// ---------------------------------------------------------------------------
vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: vi.fn()
  },
  BrowserWindow: vi.fn()
}))

// ---------------------------------------------------------------------------
// Mock fs/promises
// ---------------------------------------------------------------------------
vi.mock('fs/promises', () => ({
  default: {
    readdir: vi.fn()
  }
}))

import { dialog } from 'electron'
import fs from 'fs/promises'

const mockDialog = vi.mocked(dialog)
const mockFs = vi.mocked(fs)

// Helper to create a minimal Dirent-like object
function makeDirent(
  name: string,
  isFile: boolean
): { name: string; isFile: () => boolean; isDirectory: () => boolean } {
  return {
    name,
    isFile: () => isFile,
    isDirectory: () => !isFile
  }
}

// A stub BrowserWindow instance
const fakeWindow = {} as Electron.BrowserWindow

describe('folderService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // selectFolder
  // -------------------------------------------------------------------------

  describe('selectFolder', () => {
    it('returns the chosen path when the user selects a folder', async () => {
      mockDialog.showOpenDialog.mockResolvedValueOnce({
        canceled: false,
        filePaths: ['/home/user/Documents']
      })

      const result = await selectFolder(fakeWindow)
      expect(result).toEqual({ folderPath: '/home/user/Documents' })
    })

    it('returns null when the user cancels the dialog', async () => {
      mockDialog.showOpenDialog.mockResolvedValueOnce({
        canceled: true,
        filePaths: []
      })

      const result = await selectFolder(fakeWindow)
      expect(result).toEqual({ folderPath: null })
    })
  })

  // -------------------------------------------------------------------------
  // readFolder
  // -------------------------------------------------------------------------

  describe('readFolder', () => {
    it('returns file and dir entries, excluding hidden dot-prefixed entries', async () => {
      mockFs.readdir.mockResolvedValueOnce([
        makeDirent('report.pdf', true),
        makeDirent('.DS_Store', true), // hidden → excluded
        makeDirent('photos', false), // dir → included
        makeDirent('.ipynb_checkpoints', false), // hidden dir → excluded
        makeDirent('notes.txt', true)
      ] as never)

      const result = await readFolder({ folderPath: '/home/user/Documents' })

      expect(result.error).toBeNull()
      expect(result.files).toHaveLength(3)
      const fileEntries = result.files.filter((f) => f.isFile)
      const dirEntries = result.files.filter((f) => !f.isFile)
      expect(fileEntries.map((f) => f.name)).toEqual(['report.pdf', 'notes.txt'])
      expect(dirEntries[0].name).toBe('photos')
    })

    it('returns an empty files array and no error for an empty folder', async () => {
      mockFs.readdir.mockResolvedValueOnce([] as never)

      const result = await readFolder({ folderPath: '/home/user/empty' })

      expect(result.error).toBeNull()
      expect(result.files).toHaveLength(0)
    })

    it('returns directory entries with isFile: false', async () => {
      mockFs.readdir.mockResolvedValueOnce([
        makeDirent('subfolderA', false),
        makeDirent('subfolderB', false)
      ] as never)

      const result = await readFolder({ folderPath: '/home/user/dirs-only' })

      expect(result.error).toBeNull()
      expect(result.files).toHaveLength(2)
      expect(result.files.every((f) => !f.isFile)).toBe(true)
    })

    it('returns a permission-denied error when EACCES is thrown', async () => {
      const err = Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' })
      mockFs.readdir.mockRejectedValueOnce(err)

      const result = await readFolder({ folderPath: '/root/private' })

      expect(result.files).toHaveLength(0)
      expect(result.error).toMatch(/permission denied/i)
    })

    it('returns a permission-denied error when EPERM is thrown', async () => {
      const err = Object.assign(new Error('EPERM: operation not permitted'), { code: 'EPERM' })
      mockFs.readdir.mockRejectedValueOnce(err)

      const result = await readFolder({ folderPath: '/sys/protected' })

      expect(result.files).toHaveLength(0)
      expect(result.error).toMatch(/permission denied/i)
    })

    it('returns a generic error message for unexpected errors', async () => {
      mockFs.readdir.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'))

      const result = await readFolder({ folderPath: '/nonexistent' })

      expect(result.files).toHaveLength(0)
      expect(result.error).toMatch(/failed to read folder/i)
    })
  })
})
