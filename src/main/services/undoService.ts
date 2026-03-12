import fs from 'fs/promises'
import path from 'path'
import type { UndoRunRequest, UndoRunResponse } from '../../shared/ipcChannels'

/**
 * Helper to get all files that were moved into a ClutterCut-touched folder
 * based on the after-snapshot.
 *
 * @param afterSnapshot Record<string, (string | Record<string, string[]>)[]>
 * @returns Map<folderName, fileName[]>
 */
function extractMovedFiles(
  afterSnapshot: Record<string, (string | Record<string, string[]>)[]>
): Map<string, string[]> {
  const movedFilesMap = new Map<string, string[]>()

  for (const rootPath of Object.keys(afterSnapshot)) {
    const list = afterSnapshot[rootPath]
    for (const item of list) {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        // This is a ClutterCut-touched directory
        for (const [folderName, files] of Object.entries(item)) {
          if (!movedFilesMap.has(folderName)) {
            movedFilesMap.set(folderName, [])
          }
          if (Array.isArray(files)) {
            movedFilesMap.get(folderName)!.push(...files)
          }
        }
      }
    }
  }

  return movedFilesMap
}

/**
 * Reverts an organization run by moving files back to their original root folder.
 * Does NOT delete any folders or files (no `rm`, `rmdir`, `unlink`).
 */
export async function undoRun(req: UndoRunRequest): Promise<UndoRunResponse> {
  const { run } = req
  const folderPath = run.folder_path
  const afterSnapshot = run.after_snapshot as Record<string, (string | Record<string, string[]>)[]>

  const response: UndoRunResponse = {
    success: true,
    restoredFiles: [],
    skippedFiles: [],
    touchedFolders: []
  }

  try {
    if (!afterSnapshot || Object.keys(afterSnapshot).length === 0) {
      return response // no-op
    }

    const movedFilesMap = extractMovedFiles(afterSnapshot)

    for (const [folderName, files] of movedFilesMap.entries()) {
      response.touchedFolders.push(folderName)

      for (const fileName of files) {
        const sourcePath = path.join(folderPath, folderName, fileName)
        const destPath = path.join(folderPath, fileName)

        try {
          // Check if file still exists in the moved location
          await fs.access(sourcePath)

          // We move it back to the root folderPath.
          // If a file with the same name already exists in the root, we need to handle it.
          // For simplicity and safety, we will append a suffix just like executionService does.
          let newFileName = fileName
          let finalDestPath = destPath
          let counter = 1

          while (true) {
            try {
              await fs.access(finalDestPath)
              // File exists, append suffix
              const ext = path.extname(fileName)
              const base = path.basename(fileName, ext)
              newFileName = `${base}_${counter}${ext}`
              finalDestPath = path.join(folderPath, newFileName)
              counter++
            } catch {
              // File does not exist, safe to move
              break
            }
          }

          await fs.rename(sourcePath, finalDestPath)
          response.restoredFiles.push(newFileName)
        } catch (err: unknown) {
          response.success = false
          response.skippedFiles.push({
            fileName,
            reason:
              err instanceof Error && 'code' in err && err.code === 'ENOENT'
                ? 'File no longer exists at moved location.'
                : err instanceof Error
                  ? err.message
                  : String(err)
          })
        }
      }
    }
  } catch (err: unknown) {
    response.success = false
    response.skippedFiles.push({
      fileName: 'System Error',
      reason: err instanceof Error ? err.message : String(err)
    })
  }

  return response
}
