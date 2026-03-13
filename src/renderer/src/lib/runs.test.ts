import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRuns, updateRunStatus, insertRun } from './runs'
import { supabase } from './supabase'
import type { QueuedRun } from '../../../shared/ipcChannels'

// Mock the Supabase client
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

describe('runs lib', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRuns', () => {
    it('fetches runs for a specific user ordered by ran_at', async () => {
      const mockData = [{ id: '1', user_id: 'user-123' }] as QueuedRun[]
      const mockFrom = vi.mocked(supabase.from)

      const orderMock = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const eqMock = vi.fn().mockReturnValue({ order: orderMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock })

      mockFrom.mockReturnValue({
        select: selectMock
      } as never)

      const result = await getRuns('user-123')

      expect(mockFrom).toHaveBeenCalledWith('organization_runs')
      expect(selectMock).toHaveBeenCalledWith('*')
      expect(eqMock).toHaveBeenCalledWith('user_id', 'user-123')
      expect(orderMock).toHaveBeenCalledWith('ran_at', { ascending: false })
      expect(result).toEqual(mockData)
    })

    it('throws an error if supabase returns an error', async () => {
      const mockError = { message: 'Fetch failed' }
      const mockFrom = vi.mocked(supabase.from)

      const orderMock = vi.fn().mockResolvedValue({ data: null, error: mockError })
      const eqMock = vi.fn().mockReturnValue({ order: orderMock })
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock })

      mockFrom.mockReturnValue({
        select: selectMock
      } as never)

      await expect(getRuns('user-123')).rejects.toEqual(mockError)
    })
  })

  describe('updateRunStatus', () => {
    it('updates the undone status of a run', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const eqMock = vi.fn().mockResolvedValue({ error: null })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

      mockFrom.mockReturnValue({
        update: updateMock
      } as never)

      await updateRunStatus('run-123', true)

      expect(mockFrom).toHaveBeenCalledWith('organization_runs')
      expect(updateMock).toHaveBeenCalledWith({ undone: true })
      expect(eqMock).toHaveBeenCalledWith('id', 'run-123')
    })

    it('throws an error if update fails', async () => {
      const mockError = { message: 'Update failed' }
      const mockFrom = vi.mocked(supabase.from)
      const eqMock = vi.fn().mockResolvedValue({ error: mockError })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

      mockFrom.mockReturnValue({
        update: updateMock
      } as never)

      await expect(updateRunStatus('run-123', true)).rejects.toEqual(mockError)
    })
  })

  describe('insertRun', () => {
    it('inserts a new run', async () => {
      const mockRunData = { id: 'run-123', user_id: 'user-123' } as QueuedRun
      const mockFrom = vi.mocked(supabase.from)
      const insertMock = vi.fn().mockResolvedValue({ error: null })

      mockFrom.mockReturnValue({
        insert: insertMock
      } as never)

      await insertRun(mockRunData)

      expect(mockFrom).toHaveBeenCalledWith('organization_runs')
      expect(insertMock).toHaveBeenCalledWith(mockRunData)
    })

    it('throws an error if insertion fails', async () => {
      const mockError = { message: 'Insert failed' }
      const mockFrom = vi.mocked(supabase.from)
      const insertMock = vi.fn().mockResolvedValue({ error: mockError })

      mockFrom.mockReturnValue({
        insert: insertMock
      } as never)

      await expect(insertRun({} as QueuedRun)).rejects.toEqual(mockError)
    })
  })
})
