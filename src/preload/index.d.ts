import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  SelectFolderResponse,
  ReadFolderRequest,
  ReadFolderResponse,
  ExecuteRulesRequest,
  ExecuteRulesResponse,
  QueuedRun,
  SaveRunOfflineRequest,
  RemoveOfflineRunRequest
} from '../shared/ipcChannels'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectFolder: () => Promise<SelectFolderResponse>
      readFolder: (req: ReadFolderRequest) => Promise<ReadFolderResponse>
      executeRules: (req: ExecuteRulesRequest) => Promise<ExecuteRulesResponse>
      saveRunOffline: (req: SaveRunOfflineRequest) => Promise<{ success: boolean; error?: string }>
      getOfflineRuns: () => Promise<{ success: boolean; runs: QueuedRun[]; error?: string }>
      removeOfflineRun: (
        req: RemoveOfflineRunRequest
      ) => Promise<{ success: boolean; error?: string }>
    }
  }
}
