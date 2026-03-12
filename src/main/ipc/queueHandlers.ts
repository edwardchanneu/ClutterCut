import { ipcMain } from 'electron'
import {
  SAVE_RUN_OFFLINE,
  GET_OFFLINE_RUNS,
  REMOVE_OFFLINE_RUN,
  SaveRunOfflineRequest,
  RemoveOfflineRunRequest
} from '../../shared/ipcChannels'
import { enqueueRun, getPendingRuns, removeRun } from '../services/offlineQueueService'

export function registerQueueHandlers(): void {
  ipcMain.handle(SAVE_RUN_OFFLINE, async (_event, req: SaveRunOfflineRequest) => {
    try {
      await enqueueRun(req.run)
      return { success: true }
    } catch (error) {
      console.error(`Error in ${SAVE_RUN_OFFLINE}:`, error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(GET_OFFLINE_RUNS, async () => {
    try {
      const runs = await getPendingRuns()
      return { success: true, runs }
    } catch (error) {
      console.error(`Error in ${GET_OFFLINE_RUNS}:`, error)
      return { success: false, runs: [], error: (error as Error).message }
    }
  })

  ipcMain.handle(REMOVE_OFFLINE_RUN, async (_event, req: RemoveOfflineRunRequest) => {
    try {
      await removeRun(req.runId)
      return { success: true }
    } catch (error) {
      console.error(`Error in ${REMOVE_OFFLINE_RUN}:`, error)
      return { success: false, error: (error as Error).message }
    }
  })
}
