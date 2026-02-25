import { useState, useCallback } from 'react'
import type { ReadFolderEntry } from '../../../shared/ipcChannels'

interface UseFolderSelectionReturn {
  folderPath: string | null
  files: ReadFolderEntry[]
  isLoading: boolean
  error: string | null
  selectFolder: () => Promise<void>
}

/**
 * Handles the folder selection flow:
 *   1. Opens the native OS folder picker via IPC
 *   2. Reads the top-level files in the selected folder via IPC
 *
 * Never accesses fs directly — all file system work is delegated to the main process.
 */
export function useFolderSelection(): UseFolderSelectionReturn {
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [files, setFiles] = useState<ReadFolderEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectFolder = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const { folderPath: chosen } = await window.api.selectFolder()

      if (chosen === null) {
        // User cancelled the dialog — leave current state unchanged
        setIsLoading(false)
        return
      }

      setFolderPath(chosen)

      const { files: entries, error: readError } = await window.api.readFolder({
        folderPath: chosen
      })

      if (readError) {
        setError(readError)
        setFiles([])
      } else {
        setFiles(entries)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { folderPath, files, isLoading, error, selectFolder }
}
