// IPC channel name constants — imported by both main process handlers and preload bridge.
// All names are SCREAMING_SNAKE_CASE per the project conventions.

export const SELECT_FOLDER = 'SELECT_FOLDER'
export const READ_FOLDER = 'READ_FOLDER'

// ---------------------------------------------------------------------------
// SELECT_FOLDER
// Renderer sends no payload; main opens a native folder-picker dialog.
// ---------------------------------------------------------------------------

export interface SelectFolderResponse {
  /** Absolute path chosen by the user, or null if the dialog was cancelled. */
  folderPath: string | null
}

// ---------------------------------------------------------------------------
// READ_FOLDER
// Renderer sends a folder path; main returns top-level file entries.
// ---------------------------------------------------------------------------

export interface ReadFolderRequest {
  folderPath: string
}

export interface ReadFolderEntry {
  name: string
  isFile: boolean
}

export interface ReadFolderResponse {
  /** Top-level file entries (subdirectories are excluded). */
  files: ReadFolderEntry[]
  /**
   * Human-readable error string when the operation failed (e.g., permission
   * denied), or null on success.
   */
  error: string | null
}
