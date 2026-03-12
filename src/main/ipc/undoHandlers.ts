import { ipcMain } from 'electron'
import { UNDO_RUN } from '../../shared/ipcChannels'
import type { UndoRunRequest } from '../../shared/ipcChannels'
import { undoRun } from '../services/undoService'

/**
 * Registers ipcMain handlers for undo-related channels.
 */
export function registerUndoHandlers(): void {
  ipcMain.handle(UNDO_RUN, async (_event, req: UndoRunRequest) => {
    if (!req || !req.run || typeof req.run.folder_path !== 'string') {
      return {
        success: false,
        restoredFiles: [],
        skippedFiles: [{ fileName: 'System Error', reason: 'Invalid parameters sent to undo.' }],
        touchedFolders: []
      }
    }
    return undoRun(req)
  })
}
