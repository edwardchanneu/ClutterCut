import { dialog, BrowserWindow } from 'electron'
import fs from 'fs/promises'
import type {
  SelectFolderResponse,
  ReadFolderRequest,
  ReadFolderResponse
} from '../../shared/ipcChannels'

/**
 * Opens the native OS folder-picker dialog attached to the given window.
 * Returns the chosen absolute path, or null if the user cancelled.
 */
export async function selectFolder(window: BrowserWindow): Promise<SelectFolderResponse> {
  const result = await dialog.showOpenDialog(window, {
    properties: ['openDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { folderPath: null }
  }

  return { folderPath: result.filePaths[0] }
}

/**
 * Reads the top-level entries in the specified folder.
 * Returns both files and subdirectories, excluding OS metadata files
 * (.DS_Store, Thumbs.db, desktop.ini).
 * Permission errors are returned as a human-readable error string.
 */
export async function readFolder(req: ReadFolderRequest): Promise<ReadFolderResponse> {
  try {
    const entries = await fs.readdir(req.folderPath, { withFileTypes: true })
    const files = entries
      .filter((e) => !e.name.startsWith('.'))
      .map((e) => ({ name: e.name, isFile: e.isFile() }))
    return { files, error: null }
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'EACCES' || code === 'EPERM') {
      return {
        files: [],
        error: 'Permission denied. ClutterCut cannot read this folder.'
      }
    }
    const message = err instanceof Error ? err.message : String(err)
    return { files: [], error: `Failed to read folder: ${message}` }
  }
}
