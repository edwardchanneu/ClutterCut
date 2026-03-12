import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSyncQueue(): {
  isSyncing: boolean
  isOnline: boolean
  syncError: string | null
} {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncError, setSyncError] = useState<string | null>(null)

  const syncRuns = useCallback(async (): Promise<void> => {
    if (!navigator.onLine || isSyncing) return

    setIsSyncing(true)
    setSyncError(null)

    try {
      const { success, runs, error } = await window.api.getOfflineRuns()

      if (!success) {
        console.error('Failed to get offline runs:', error)
        setSyncError(error || 'Failed to read local queue.')
        setIsSyncing(false)
        return
      }

      if (runs && runs.length > 0) {
        let hasError = false
        for (const run of runs) {
          const payload = { ...run, synced_at: new Date().toISOString() }
          const { error: dbError } = await supabase.from('organization_runs').insert(payload)

          if (!dbError) {
            await window.api.removeOfflineRun({ runId: run.id })
          } else {
            console.error('Failed to sync offline run:', dbError)
            hasError = true
            setSyncError(dbError.message || 'Failed to sync with cloud.')
            // Stop syncing the rest on first error to preserve order and avoid spamming
            break
          }
        }
        if (!hasError) {
          setSyncError(null)
        }
      } else {
        setSyncError(null)
      }
    } catch (err) {
      console.error('Error during queue sync:', err)
      setSyncError(err instanceof Error ? err.message : 'Unknown sync error')
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing])

  useEffect(() => {
    const handleOnline = (): void => {
      setIsOnline(true)
      syncRuns()
    }
    const handleOffline = (): void => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncRuns])

  useEffect(() => {
    // Try syncing immediately on mount if online
    if (isOnline) {
      syncRuns()
    }

    // Retry interval if there is a sync error
    let retryTimer: NodeJS.Timeout | null = null
    if (isOnline && syncError) {
      retryTimer = setInterval(() => {
        syncRuns()
      }, 30000) // Retry every 30 seconds
    }

    return () => {
      if (retryTimer) clearInterval(retryTimer)
    }
  }, [isOnline, syncError, syncRuns])

  return { isSyncing, isOnline, syncError }
}
