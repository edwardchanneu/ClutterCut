import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueuedRun, UndoRunResponse } from '../../../shared/ipcChannels'
import { updateRunStatus, insertRun } from '../lib/runs'

export function useUndo(): {
  undoRunAction: (run: QueuedRun) => Promise<UndoRunResponse>
  isUndoing: boolean
  error: Error | null
} {
  const [isUndoing, setIsUndoing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const queryClient = useQueryClient()

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

      // Before undo = the post-organize snapshot (always correct)
      const beforeSnapshot = originalRun.after_snapshot

      // After undo snapshot must reflect actual reality:
      //   - Full undo: original before_snapshot is accurate (all files returned to root).
      //   - Partial undo: we must build an accurate snapshot because some files did NOT
      //     come back — they are still sitting in sub-folders. Naively swapping
      //     before/after would lie to the user about the true post-undo state.
      const afterSnapshot = buildUndoAfterSnapshot(originalRun, response)

      const newRunRecord: QueuedRun & { synced_at: string } = {
        id: newRunId,
        user_id: originalRun.user_id,
        folder_path: originalRun.folder_path,
        ran_at: now,
        synced_at: now,
        // The rules for the undo run are technically none, so use an empty array.
        rules: [],
        before_snapshot: beforeSnapshot,
        after_snapshot: afterSnapshot,
        files_affected: response.restoredFiles.length,
        is_undo: true,
        undone: false,
        parent_run_id: originalRun.id
      }

      await insertRun(newRunRecord)

      // Invalidate queries so the history automatically refetches
      queryClient.invalidateQueries({ queryKey: ['runs'] })
      queryClient.invalidateQueries({ queryKey: ['localRuns'] })

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

/**
 * Builds the `after_snapshot` for the new undo history entry.
 *
 * For a complete undo (`response.success === true`), the original
 * `before_snapshot` is a faithful representation of reality — all files
 * came back to root exactly as they were.
 *
 * For a partial undo (`response.success === false` but some files were
 * restored), the original `before_snapshot` is inaccurate: it shows the
 * fully-restored state, but some files are still sitting in sub-folders.
 * In this case we construct the snapshot from first principles:
 *   - Root-level files = untouched files already at root (plain strings from
 *     `after_snapshot`) + `response.restoredFiles` (moved back by this undo)
 *   - Sub-folder objects = only folders that still contain skipped files
 *     (successfully restored files are removed from each folder's list).
 */
function buildUndoAfterSnapshot(originalRun: QueuedRun, response: UndoRunResponse): unknown {
  // Complete undo: the original before_snapshot accurately describes reality.
  if (response.success) {
    return originalRun.before_snapshot
  }

  // Partial undo: derive snapshot from the post-organize (after) snapshot.
  const organizedSnapshot = originalRun.after_snapshot as Record<
    string,
    (string | Record<string, string[]>)[]
  >

  if (!organizedSnapshot || typeof organizedSnapshot !== 'object') {
    // Fallback — shouldn't happen in normal usage.
    return originalRun.before_snapshot
  }

  // Build a set of file names that were skipped (still in sub-folders).
  // Files NOT in this set were successfully restored so should be removed
  // from sub-folder objects and added to root instead.
  const skippedFileNames = new Set(response.skippedFiles.map((sf) => sf.fileName))

  const result: Record<string, (string | Record<string, string[]>)[]> = {}

  for (const [rootPath, items] of Object.entries(organizedSnapshot)) {
    const newItems: (string | Record<string, string[]>)[] = []

    for (const item of items) {
      if (typeof item === 'string') {
        // Plain file already at root — keep it unchanged.
        newItems.push(item)
      } else if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        // Sub-folder object: only retain files that were NOT restored (i.e., skipped).
        const updatedFolder: Record<string, string[]> = {}
        for (const [folderName, files] of Object.entries(item as Record<string, string[]>)) {
          const remaining = (files as string[]).filter((f) => skippedFileNames.has(f))
          if (remaining.length > 0) {
            updatedFolder[folderName] = remaining
          }
        }
        if (Object.keys(updatedFolder).length > 0) {
          newItems.push(updatedFolder)
        }
      }
    }

    // Append the files that were actually restored to the root level.
    for (const restoredFile of response.restoredFiles) {
      newItems.push(restoredFile)
    }

    result[rootPath] = newItems
  }

  return result
}
