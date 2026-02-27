import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import { executeRules } from './executionService'
import type { ExecuteRulesRequest, Rule } from '../../shared/ipcChannels'

describe('executionService', () => {
  const folderPath = '/mock/root/folder'
  let rules: Rule[]

  beforeEach(() => {
    vi.clearAllMocks()

    // Spy on fs methods
    vi.spyOn(fs, 'readdir')
    vi.spyOn(fs, 'mkdir')
    vi.spyOn(fs, 'access')
    vi.spyOn(fs, 'rename')
    vi.spyOn(fs, 'unlink').mockResolvedValue(undefined as unknown as void)
    vi.spyOn(fs, 'rm').mockResolvedValue(undefined as unknown as void)
    vi.spyOn(fs, 'rmdir').mockResolvedValue(undefined as unknown as void)

    rules = [
      { conditionType: 'file_extension', conditionValue: 'pdf', destinationFolder: 'Documents' },
      { conditionType: 'name_contains', conditionValue: 'report', destinationFolder: 'Reports' }
    ]
  })

  afterEach(() => {
    // Assert no destructive fs operations are ever called
    expect(fs.unlink).not.toHaveBeenCalled()
    expect(fs.rm).not.toHaveBeenCalled()
    expect(fs.rmdir).not.toHaveBeenCalled()
  })

  it('handles successful file moves with before and after snapshots', async () => {
    // Mock readdir to return files
    const mockEntries = [
      { name: 'file1.pdf', isFile: () => true, isDirectory: () => false },
      { name: 'random.txt', isFile: () => true, isDirectory: () => false },
      { name: '.hidden', isFile: () => true, isDirectory: () => false }
    ]

    vi.mocked(fs.readdir)
      .mockResolvedValueOnce(mockEntries as unknown as any[])
      .mockResolvedValueOnce([
        { name: 'random.txt', isFile: () => true, isDirectory: () => false },
        { name: 'Documents', isFile: () => false, isDirectory: () => true }
      ] as unknown as any[])

    vi.mocked(fs.mkdir).mockResolvedValue(undefined as unknown as string)
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'))
    vi.mocked(fs.rename).mockResolvedValue(undefined as unknown as void)

    const request: ExecuteRulesRequest = { folderPath, rules }
    const response = await executeRules(request)

    expect(response.success).toBe(true)
    expect(response.movedCount).toBe(1)
    expect(response.failedCount).toBe(0)
    expect(response.errors).toEqual([])

    expect(fs.mkdir).toHaveBeenCalledWith(path.join(folderPath, 'Documents'), { recursive: true })
    expect(fs.rename).toHaveBeenCalledWith(
      path.join(folderPath, 'file1.pdf'),
      path.join(folderPath, 'Documents', 'file1.pdf')
    )

    // Verify before snapshot
    expect(response.beforeSnapshot[folderPath]).toEqual(['file1.pdf', 'random.txt'])

    // Verify after snapshot ('ClutterCut-touched folders as objects')
    expect(response.afterSnapshot[folderPath]).toEqual(['random.txt', { Documents: ['file1.pdf'] }])
  })

  it('resolves filename conflicts by appending numeric suffixes', async () => {
    // Both files match '.pdf'
    const mockEntries = [{ name: 'duplicate.pdf', isFile: () => true, isDirectory: () => false }]
    vi.mocked(fs.readdir)
      .mockResolvedValueOnce(mockEntries as unknown as any[])
      .mockResolvedValueOnce([
        { name: 'Documents', isFile: () => false, isDirectory: () => true }
      ] as unknown as any[])
    vi.mocked(fs.mkdir).mockResolvedValue(undefined as unknown as string)

    // First access succeeds (file exists), second fails (name available)
    vi.mocked(fs.access)
      .mockResolvedValueOnce(undefined as unknown as void) // duplicate.pdf exists
      .mockRejectedValueOnce(new Error('ENOENT')) // duplicate_1.pdf available

    vi.mocked(fs.rename).mockResolvedValue(undefined as unknown as void)

    const request: ExecuteRulesRequest = { folderPath, rules }
    const response = await executeRules(request)

    expect(response.success).toBe(true)
    expect(response.movedCount).toBe(1)

    expect(fs.access).toHaveBeenCalledTimes(2)
    expect(fs.rename).toHaveBeenCalledWith(
      path.join(folderPath, 'duplicate.pdf'),
      path.join(folderPath, 'Documents', 'duplicate_1.pdf')
    )

    expect(response.afterSnapshot[folderPath]).toEqual([{ Documents: ['duplicate_1.pdf'] }])
  })

  it('reports partial failures when rename throws', async () => {
    const mockEntries = [
      { name: 'fail.pdf', isFile: () => true, isDirectory: () => false },
      { name: 'success.pdf', isFile: () => true, isDirectory: () => false }
    ]

    vi.mocked(fs.readdir).mockResolvedValue(mockEntries as unknown as any[])
    vi.mocked(fs.mkdir).mockResolvedValue(undefined as unknown as string)
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'))

    // First rename fails, second succeeds
    vi.mocked(fs.rename)
      .mockRejectedValueOnce(new Error('EPERM Permission denied'))
      .mockResolvedValueOnce(undefined as unknown as void)

    const request: ExecuteRulesRequest = { folderPath, rules }
    const response = await executeRules(request)

    expect(response.success).toBe(false)
    expect(response.movedCount).toBe(1)
    expect(response.failedCount).toBe(1)
    expect(response.errors).toEqual([{ fileName: 'fail.pdf', reason: 'EPERM Permission denied' }])
  })
})
