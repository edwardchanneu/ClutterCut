import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { undoRun } from './undoService'
import fs from 'fs/promises'
import path from 'path'
import type { UndoRunRequest } from '../../shared/ipcChannels'

describe('undoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.spyOn(fs, 'access')
    vi.spyOn(fs, 'rename').mockResolvedValue(undefined)
    vi.spyOn(fs, 'rm').mockResolvedValue(undefined)
    vi.spyOn(fs, 'rmdir').mockResolvedValue(undefined)
    vi.spyOn(fs, 'unlink').mockResolvedValue(undefined)
  })

  afterEach(() => {
    expect(fs.rm).not.toHaveBeenCalled()
    expect(fs.rmdir).not.toHaveBeenCalled()
    expect(fs.unlink).not.toHaveBeenCalled()
  })

  it('moves files back and reports touchedFolders successfully', async () => {
    vi.mocked(fs.access).mockImplementation(async (filePath) => {
      if (typeof filePath === 'string') {
        const strPath = filePath.toString()
        if (strPath.includes('Docs') || strPath.includes('Other Folder')) {
          return Promise.resolve()
        }
        if (
          strPath === path.join('test-root', 'report.pdf') ||
          strPath === path.join('test-root', 'invoice.pdf') ||
          strPath === path.join('test-root', 'data.csv')
        ) {
          return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
        }
      }
      return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    })

    const req: UndoRunRequest = {
      run: {
        id: '123',
        user_id: 'user',
        folder_path: 'test-root',
        ran_at: 'now',
        rules: [],
        before_snapshot: {},
        after_snapshot: {
          'test-root': [
            { Docs: ['report.pdf', 'invoice.pdf'] },
            'untouchedFile.txt',
            { 'Other Folder': ['data.csv'] }
          ]
        },
        files_affected: 3,
        is_undo: false,
        undone: false,
        parent_run_id: null
      }
    }

    const result = await undoRun(req)

    expect(result.success).toBe(true)
    expect(result.restoredFiles.length).toBe(3)
    expect(result.restoredFiles).toContain('report.pdf')
    expect(result.restoredFiles).toContain('invoice.pdf')
    expect(result.restoredFiles).toContain('data.csv')

    expect(result.touchedFolders.length).toBe(2)
    expect(result.touchedFolders).toContain('Docs')
    expect(result.touchedFolders).toContain('Other Folder')

    expect(fs.rename).toHaveBeenCalledTimes(3)
  })

  it('skips missing files with a report and sets success to false', async () => {
    vi.mocked(fs.access).mockImplementation(async () => {
      return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    })

    const req: UndoRunRequest = {
      run: {
        id: '123',
        user_id: 'user',
        folder_path: 'test-root',
        ran_at: 'now',
        rules: [],
        before_snapshot: {},
        after_snapshot: {
          'test-root': [{ Docs: ['missing.pdf'] }]
        },
        files_affected: 1,
        is_undo: false,
        undone: false,
        parent_run_id: null
      }
    }

    const result = await undoRun(req)

    expect(result.success).toBe(false)
    expect(result.restoredFiles.length).toBe(0)
    expect(result.skippedFiles.length).toBe(1)
    expect(result.skippedFiles[0].fileName).toBe('missing.pdf')
    expect(result.skippedFiles[0].reason).toBe('File no longer exists at moved location.')
    expect(fs.rename).not.toHaveBeenCalled()
  })
})
