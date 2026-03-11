import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  SelectFolderResponse,
  ReadFolderRequest,
  ReadFolderResponse,
  ExecuteRulesRequest,
  ExecuteRulesResponse
} from '../shared/ipcChannels'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectFolder: () => Promise<SelectFolderResponse>
      readFolder: (req: ReadFolderRequest) => Promise<ReadFolderResponse>
      executeRules: (req: ExecuteRulesRequest) => Promise<ExecuteRulesResponse>
    }
  }
}
