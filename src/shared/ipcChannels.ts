// IPC channel name constants — imported by both main process handlers and preload bridge.
// All names are SCREAMING_SNAKE_CASE per the project conventions.

export const SELECT_FOLDER = 'SELECT_FOLDER'
export const READ_FOLDER = 'READ_FOLDER'

// ---------------------------------------------------------------------------
// Rule types — shared between renderer (UI) and main process (execution)
// ---------------------------------------------------------------------------

/** The type of condition a rule evaluates against a file. */
export type ConditionType = 'file_extension' | 'name_contains'

/**
 * A single user-defined rule.
 * Rules are evaluated top-to-bottom; a file matches the first rule it satisfies.
 */
export interface Rule {
  /** How the file is evaluated. */
  conditionType: ConditionType
  /**
   * The value to match against.
   * For file_extension: a bare extension string, e.g. "pdf" (no leading dot).
   * For name_contains: a substring to search for in the full filename.
   */
  conditionValue: string
  /** The name of the destination folder inside the selected root folder. */
  destinationFolder: string
}

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

// ---------------------------------------------------------------------------
// EXECUTE_RULES
// Renderer sends a target folder and user-defined rules.
// Main process moves the files according to the rules and returns a result snapshot.
// ---------------------------------------------------------------------------

export const EXECUTE_RULES = 'EXECUTE_RULES'

export interface ExecuteRulesRequest {
  folderPath: string
  rules: Rule[]
}

/** Represents a JSON snapshot of the folder tree. */
export interface FolderSnapshot {
  /** Root directory path as key, array of top-level filenames and subdirectory names as strings */
  [rootPath: string]: (string | Record<string, unknown>)[]
}

export interface ExecuteRulesResponse {
  success: boolean
  movedCount: number
  failedCount: number
  errors: { fileName: string; reason: string }[]
  beforeSnapshot: Record<string, string[]>
  /** ClutterCut-touched folders as objects with moved files as values; untouched subdirectories remain as plain strings */
  afterSnapshot: Record<string, (string | Record<string, string[]>)[]>
}
