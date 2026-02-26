import { ipcMain } from 'electron'
import { EXECUTE_RULES } from '../../shared/ipcChannels'
import type { ExecuteRulesRequest } from '../../shared/ipcChannels'
import { executeRules } from '../services/executionService'

/**
 * Registers ipcMain handlers for execution-related channels.
 */
export function registerExecutionHandlers(): void {
  ipcMain.handle(EXECUTE_RULES, async (_event, req: ExecuteRulesRequest) => {
    if (!req || typeof req.folderPath !== 'string' || !Array.isArray(req.rules)) {
      return {
        success: false,
        movedCount: 0,
        failedCount: 0,
        errors: [{ fileName: 'System Error', reason: 'Invalid parameters sent to execute.' }],
        beforeSnapshot: {},
        afterSnapshot: {}
      }
    }
    return executeRules(req)
  })
}
