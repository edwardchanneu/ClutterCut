import { describe, it, expect, vi, beforeEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { enqueueRun, getPendingRuns, removeRun } from './offlineQueueService'
import type { QueuedRun } from '../../shared/ipcChannels'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/userData')
  }
}))

vi.mock('fs', () => {
  const promises = {
    readFile: vi.fn(),
    writeFile: vi.fn()
  }
  return {
    promises,
    default: { promises }
  }
})

describe('offlineQueueService', () => {
  const MOCK_QUEUE_PATH = path.join('/mock/userData', 'offline_queue.json')

  const dummyRun: QueuedRun = {
    id: 'run-1',
    user_id: 'user-1',
    folder_path: '/some/path',
    ran_at: new Date().toISOString(),
    rules: [],
    before_snapshot: {},
    after_snapshot: {},
    files_affected: 2,
    is_undo: false,
    undone: false,
    parent_run_id: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enqueueRun', () => {
    it('should create new queue file if it does not exist', async () => {
      const enoentError = new Error('Not found')
      Object.assign(enoentError, { code: 'ENOENT' })
      vi.mocked(fs.readFile).mockRejectedValueOnce(enoentError)

      await enqueueRun(dummyRun)

      expect(fs.readFile).toHaveBeenCalledWith(MOCK_QUEUE_PATH, 'utf8')
      expect(fs.writeFile).toHaveBeenCalledWith(
        MOCK_QUEUE_PATH,
        JSON.stringify([dummyRun], null, 2),
        'utf8'
      )
    })

    it('should append to existing queue file', async () => {
      const existingRun = { ...dummyRun, id: 'run-0' }
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify([existingRun]))

      await enqueueRun(dummyRun)

      expect(fs.writeFile).toHaveBeenCalledWith(
        MOCK_QUEUE_PATH,
        JSON.stringify([existingRun, dummyRun], null, 2),
        'utf8'
      )
    })
  })

  describe('getPendingRuns', () => {
    it('should return empty array if file does not exist', async () => {
      const enoentError = new Error('Not found')
      Object.assign(enoentError, { code: 'ENOENT' })
      vi.mocked(fs.readFile).mockRejectedValueOnce(enoentError)

      const runs = await getPendingRuns()
      expect(runs).toEqual([])
    })

    it('should return queued runs if file exists', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify([dummyRun]))

      const runs = await getPendingRuns()
      expect(runs).toEqual([dummyRun])
    })
  })

  describe('removeRun', () => {
    it('should remove run by id and update file', async () => {
      const existingRun = { ...dummyRun, id: 'run-0' }
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify([existingRun, dummyRun]))

      await removeRun('run-1')

      expect(fs.writeFile).toHaveBeenCalledWith(
        MOCK_QUEUE_PATH,
        JSON.stringify([existingRun], null, 2),
        'utf8'
      )
    })

    it('should do nothing if file does not exist when removing', async () => {
      const enoentError = new Error('Not found')
      Object.assign(enoentError, { code: 'ENOENT' })
      vi.mocked(fs.readFile).mockRejectedValueOnce(enoentError)

      await removeRun('run-1')

      expect(fs.writeFile).not.toHaveBeenCalled()
    })
  })
})
