import { ipcMain, BrowserWindow } from 'electron'
import { SELECT_FOLDER, READ_FOLDER } from '../../shared/ipcChannels'
import type { ReadFolderRequest } from '../../shared/ipcChannels'
import { selectFolder, readFolder } from '../services/folderService'

/**
 * Registers ipcMain handlers for folder-related channels.
 * Must be called once after the app is ready.
 */
export function registerFolderHandlers(): void {
  ipcMain.handle(SELECT_FOLDER, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) {
      return { folderPath: null }
    }
    return selectFolder(window)
  })

  ipcMain.handle(READ_FOLDER, async (_event, req: ReadFolderRequest) => {
    // Validate input — treat renderer as untrusted per security requirements
    if (!req || typeof req.folderPath !== 'string' || req.folderPath.trim() === '') {
      return { files: [], error: 'Invalid folder path.' }
    }
    return readFolder(req)
  })
}
