import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { QueuedRun } from '../../../shared/ipcChannels'

export function useSaveRun(): {
  saveRun: (
    userId: string,
    folderPath: string,
    rules: unknown,
    beforeSnapshot: unknown,
    afterSnapshot: unknown,
    filesAffected: number
  ) => Promise<void>
  isSaving: boolean
  error: Error | null
} {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const saveRun = async (
    userId: string,
    folderPath: string,
    rules: unknown,
    beforeSnapshot: unknown,
    afterSnapshot: unknown,
    filesAffected: number
  ): Promise<void> => {
    setIsSaving(true)
    setError(null)

    const isOnline = navigator.onLine
    const runId = window.crypto.randomUUID()
    const now = new Date().toISOString()

    const runData: QueuedRun = {
      id: runId,
      user_id: userId,
      folder_path: folderPath,
      ran_at: now,
      rules,
      before_snapshot: beforeSnapshot,
      after_snapshot: afterSnapshot,
      files_affected: filesAffected,
      is_undo: false,
      undone: false,
      parent_run_id: null
    }

    try {
      if (isOnline) {
        // Prepare the payload for Supabase
        const payload = { ...runData, synced_at: now }

        const { error: dbError } = await supabase.from('organization_runs').insert(payload)

        if (dbError) throw dbError
      } else {
        // Save to offline queue via IPC
        const response = await window.api.saveRunOffline({ run: runData })
        if (!response.success) {
          throw new Error(response.error || 'Failed to save offline run')
        }
      }
    } catch (err: unknown) {
      console.error('Failed to save run:', err)
      setError(err instanceof Error ? err : new Error('Unknown error saving run'))
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  return { saveRun, isSaving, error }
}
