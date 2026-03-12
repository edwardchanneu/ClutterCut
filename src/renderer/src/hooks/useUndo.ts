import { useState } from 'react'
import type { QueuedRun, UndoRunResponse } from '../../../shared/ipcChannels'
import { updateRunStatus, insertRun } from '../lib/runs'

export function useUndo(): {
  undoRunAction: (run: QueuedRun) => Promise<UndoRunResponse>
  isUndoing: boolean
  error: Error | null
} {
  const [isUndoing, setIsUndoing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const undoRunAction = async (originalRun: QueuedRun): Promise<UndoRunResponse> => {
    setIsUndoing(true)
    setError(null)

    try {
      const isOnline = navigator.onLine
      if (!isOnline) {
        throw new Error('Undo requires an active internet connection.')
      }

      // 1. Invoke the main process to move files back
      const req = { run: originalRun }
      const response: UndoRunResponse = await window.api.undoRun(req)

      if (!response.success && response.restoredFiles.length === 0) {
        // If it failed completely without moving anything, abort early
        if (response.skippedFiles.length > 0) {
          throw new Error(response.skippedFiles[0].reason)
        }
        throw new Error('Undo execution failed.')
      }

      // 2. Update the original run visually as undone
      await updateRunStatus(originalRun.id, true)

      // 3. Create a new history entry demonstrating the inverse diff
      const newRunId = window.crypto.randomUUID()
      const now = new Date().toISOString()

      const newRunRecord: QueuedRun & { synced_at: string } = {
        id: newRunId,
        user_id: originalRun.user_id,
        folder_path: originalRun.folder_path,
        ran_at: now,
        synced_at: now,
        // The rules for the undo run are technically none, or could mirror the original run's rules.
        // We leave them as empty array or copy them. We'll use the original rules so they can be seen.
        rules: originalRun.rules,
        // Inverse the snapshots:
        // Before undo = the post-organize snapshot
        before_snapshot: originalRun.after_snapshot,
        // After undo = the pre-organize snapshot (ideally, what we restored)
        after_snapshot: originalRun.before_snapshot,
        files_affected: response.restoredFiles.length,
        is_undo: true,
        undone: false,
        parent_run_id: originalRun.id
      }

      await insertRun(newRunRecord)

      return response
    } catch (err: unknown) {
      console.error('Failed to undo run:', err)
      const errObj = err instanceof Error ? err : new Error('Unknown error during undo')
      setError(errObj)
      throw errObj
    } finally {
      setIsUndoing(false)
    }
  }

  return { undoRunAction, isUndoing, error }
}
