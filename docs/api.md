# ClutterCut API Documentation

## Overview
This document describes the internal IPC (Inter-Process Communication) API exposed by ClutterCut's Electron main process to the React renderer, rather than a traditional HTTP API, as the application runs natively on the desktop.
Authentication and Database interactions are handled directly by the Supabase React SDK on the frontend.

## Authentication
ClutterCut utilizes Supabase for authentication using Email and Password. Session management is handled by the Supabase client directly in the renderer process (React), via the `GuestProvider` and `useAuth` hook. 

## Endpoints (IPC Channels)

### 1. Select Folder
**Channel:** `dialog:selectFolder` (invoked via `ipcRenderer.invoke`)
- **Description**: Opens a native OS folder picker dialog for the user to select a directory to organize.
- **Request Parameters**: None
- **Response**: `{ folderPath: string | null }` - Returns the absolute path of the selected folder, or `null` if the user cancelled the dialog.

### 2. Read Folder
**Channel:** `fileSystem:readFolder` (invoked via `ipcRenderer.invoke`)
- **Description**: Reads the contents of a specified folder, excluding OS-specific metadata files like `.DS_Store`.
- **Request parameters**: `{ folderPath: string }`
- **Response**: 
  ```typescript
  {
    files: Array<{ name: string, isFile: boolean }>;
    error: string | null;
  }
  ```
- **Error Conditions**: Returns an error string if the path is invalid, or if the user lacks OS-level read permissions (`EACCES` or `EPERM`).

### 3. Execute Rules
**Channel:** `EXECUTE_RULES` (invoked via `ipcRenderer.invoke`)
- **Description**: Evaluates files in the target folder against user-defined rules, moving them to their respective destination folders. Returns a snapshot of the folder before and after the move.
- **Request Parameters**: `{ folderPath: string, rules: Rule[] }`
- **Response**: `{ success: boolean, movedCount: number, failedCount: number, errors: {fileName: string, reason: string}[], beforeSnapshot: FolderSnapshot, afterSnapshot: FolderSnapshot }`

### 4. Undo Run
**Channel:** `UNDO_RUN` (invoked via `ipcRenderer.invoke`)
- **Description**: Reverts a previous organization run by executing a reverse-move of the files based on the stored `after_snapshot` and `before_snapshot`.
- **Request Parameters**: `{ run: QueuedRun }`
- **Response**: `{ success: boolean, restoredFiles: string[], skippedFiles: {fileName: string, reason: string}[], touchedFolders: string[] }`

### 5. Offline Queue
**Channels:** `SAVE_RUN_OFFLINE`, `GET_OFFLINE_RUNS`, `REMOVE_OFFLINE_RUN` (invoked via `ipcRenderer.invoke`)
- **Description**: Manages offline fallback for organization runs when the Supabase cloud connection is unavailable.
- **`SAVE_RUN_OFFLINE` Request**: `{ run: QueuedRun }`
- **`GET_OFFLINE_RUNS` Response**: `QueuedRun[]`
- **`REMOVE_OFFLINE_RUN` Request**: `{ runId: string }`

### 6. Database Sync (Supabase)
**Interaction Type:** Direct SDK Calls
- **Description**: The React frontend communicates directly with Supabase via `supabase.auth` and `supabase.from('organization_runs')` to manage sessions, store rule configurations, and keep a history of folder organizations for authenticated users.
