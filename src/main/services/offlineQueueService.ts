import { app } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import type { QueuedRun } from '../../shared/ipcChannels'

const QUEUE_FILE_NAME = 'offline_queue.json'

function getQueueFilePath(): string {
  // Use userData directory for persistent application data
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, QUEUE_FILE_NAME)
}

export async function enqueueRun(run: QueuedRun): Promise<void> {
  const queuePath = getQueueFilePath()
  let currentQueue: QueuedRun[] = []

  try {
    const data = await fs.readFile(queuePath, 'utf8')
    currentQueue = JSON.parse(data)
  } catch (error) {
    // If the file does not exist, that's fine, we will create it.
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Failed to read offline queue:', error)
      throw error
    }
  }

  currentQueue.push(run)

  await fs.writeFile(queuePath, JSON.stringify(currentQueue, null, 2), 'utf8')
}

export async function getPendingRuns(): Promise<QueuedRun[]> {
  const queuePath = getQueueFilePath()
  try {
    const data = await fs.readFile(queuePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    console.error('Failed to read offline queue:', error)
    throw error
  }
}

export async function removeRun(runId: string): Promise<void> {
  const queuePath = getQueueFilePath()
  try {
    const data = await fs.readFile(queuePath, 'utf8')
    let currentQueue: QueuedRun[] = JSON.parse(data)

    currentQueue = currentQueue.filter((run) => run.id !== runId)

    await fs.writeFile(queuePath, JSON.stringify(currentQueue, null, 2), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Failed to update offline queue when removing run:', error)
      throw error
    }
  }
}
