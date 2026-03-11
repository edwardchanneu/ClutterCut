import fs from 'fs/promises'
import path from 'path'
import type { Rule } from '../../shared/ipcChannels'
import type { ExecuteRulesRequest, ExecuteRulesResponse } from '../../shared/ipcChannels'

/**
 * Computes which rule a file matches, checking top-to-bottom.
 * Returns the first matching rule, or null if none match.
 */
export function computeFileMatch(fileName: string, rules: Rule[]): Rule | null {
  for (const rule of rules) {
    if (rule.conditionType === 'file_extension') {
      const ext = path.extname(fileName).toLowerCase().replace(/^\./, '')
      const ruleExt = rule.conditionValue.toLowerCase().replace(/^\./, '')
      if (ext === ruleExt) {
        return rule
      }
    } else if (rule.conditionType === 'name_contains') {
      if (fileName.toLowerCase().includes(rule.conditionValue.toLowerCase())) {
        return rule
      }
    }
  }
  return null
}

/**
 * Executes file organization rules safely, capturing snapshots and resolving conflicts.
 * Zero destructive fs operations (unlink, rm, rmdir) are used.
 */
export async function executeRules(req: ExecuteRulesRequest): Promise<ExecuteRulesResponse> {
  const { folderPath, rules } = req

  const response: ExecuteRulesResponse = {
    success: true,
    movedCount: 0,
    failedCount: 0,
    errors: [],
    beforeSnapshot: {},
    afterSnapshot: {}
  }

  try {
    // 1. Generate before-snapshot
    const entries = await fs.readdir(folderPath, { withFileTypes: true })
    const allNames = entries.map((e) => e.name).filter((name) => !name.startsWith('.'))
    response.beforeSnapshot[folderPath] = allNames

    const filesToMove = entries.filter((e) => e.isFile() && !e.name.startsWith('.'))

    // Group files by destination
    const destinationMap = new Map<string, string[]>()
    const unmodifiedItems = new Set<string>(allNames)

    for (const file of filesToMove) {
      const match = computeFileMatch(file.name, rules)
      if (match) {
        const sourcePath = path.join(folderPath, file.name)
        const destFolder = match.destinationFolder
        const destFolderPath = path.join(folderPath, destFolder)

        try {
          // Ensure destination folder exists (recursively)
          await fs.mkdir(destFolderPath, { recursive: true })

          // Resolve filename conflicts
          let newFileName = file.name
          let destFilePath = path.join(destFolderPath, newFileName)
          let counter = 1

          while (true) {
            try {
              await fs.access(destFilePath)
              // File exists, append suffix
              const ext = path.extname(file.name)
              const base = path.basename(file.name, ext)
              newFileName = `${base}_${counter}${ext}`
              destFilePath = path.join(destFolderPath, newFileName)
              counter++
            } catch {
              // File does not exist, safe to move
              break
            }
          }

          // Move the file safely using rename natively
          await fs.rename(sourcePath, destFilePath)

          response.movedCount++

          if (!destinationMap.has(destFolder)) {
            destinationMap.set(destFolder, [])
          }
          destinationMap.get(destFolder)!.push(newFileName)

          unmodifiedItems.delete(file.name)
        } catch (err: unknown) {
          response.success = false
          response.failedCount++
          response.errors.push({
            fileName: file.name,
            reason: err instanceof Error ? err.message : String(err)
          })
        }
      }
    }

    // 2. Generate after-snapshot
    // Read the folder again to get actual untouched directory names
    const finalEntries = await fs.readdir(folderPath, { withFileTypes: true })
    const afterList: (string | Record<string, string[]>)[] = []

    for (const entry of finalEntries) {
      if (entry.name.startsWith('.')) continue

      if (entry.isDirectory() && destinationMap.has(entry.name)) {
        // ClutterCut-touched folder
        afterList.push({ [entry.name]: destinationMap.get(entry.name)! })
      } else {
        // Untouched subdirectory or file
        afterList.push(entry.name)
      }
    }

    response.afterSnapshot[folderPath] = afterList
  } catch (err: unknown) {
    response.success = false
    response.errors.push({
      fileName: 'System Error',
      reason: err instanceof Error ? err.message : String(err)
    })
  }

  return response
}
