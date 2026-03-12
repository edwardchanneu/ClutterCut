import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  SELECT_FOLDER,
  READ_FOLDER,
  EXECUTE_RULES,
  SAVE_RUN_OFFLINE,
  GET_OFFLINE_RUNS,
  REMOVE_OFFLINE_RUN,
  UNDO_RUN
} from '../shared/ipcChannels'
import type {
  ReadFolderRequest,
  ReadFolderResponse,
  SelectFolderResponse,
  ExecuteRulesRequest,
  ExecuteRulesResponse,
  QueuedRun,
  SaveRunOfflineRequest,
  RemoveOfflineRunRequest,
  UndoRunRequest,
  UndoRunResponse
} from '../shared/ipcChannels'

// Custom APIs exposed to the renderer via contextBridge
const api = {
  selectFolder: (): Promise<SelectFolderResponse> => ipcRenderer.invoke(SELECT_FOLDER),
  readFolder: (req: ReadFolderRequest): Promise<ReadFolderResponse> =>
    ipcRenderer.invoke(READ_FOLDER, req),
  executeRules: (req: ExecuteRulesRequest): Promise<ExecuteRulesResponse> =>
    ipcRenderer.invoke(EXECUTE_RULES, req),
  saveRunOffline: (req: SaveRunOfflineRequest): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(SAVE_RUN_OFFLINE, req),
  getOfflineRuns: (): Promise<{ success: boolean; runs: QueuedRun[]; error?: string }> =>
    ipcRenderer.invoke(GET_OFFLINE_RUNS),
  removeOfflineRun: (req: RemoveOfflineRunRequest): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(REMOVE_OFFLINE_RUN, req),
  undoRun: (req: UndoRunRequest): Promise<UndoRunResponse> => ipcRenderer.invoke(UNDO_RUN, req)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
