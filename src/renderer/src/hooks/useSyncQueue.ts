import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useSyncQueue(): { isSyncing: boolean } {
  const [isSyncing, setIsSyncing] = useState(false)
  const isSyncingRef = useRef(false)

  useEffect(() => {
    const syncRuns = async (): Promise<void> => {
      if (!navigator.onLine || isSyncingRef.current) return

      isSyncingRef.current = true
      setIsSyncing(true)
      try {
        const { success, runs, error } = await window.api.getOfflineRuns()

        if (!success) {
          console.error('Failed to get offline runs:', error)
          return
        }

        if (runs && runs.length > 0) {
          for (const run of runs) {
            const payload = { ...run, synced_at: new Date().toISOString() }
            const { error: dbError } = await supabase.from('organization_runs').insert(payload)

            if (!dbError) {
              await window.api.removeOfflineRun({ runId: run.id })
            } else {
              console.error('Failed to sync offline run:', dbError)
            }
          }
        }
      } catch (err) {
        console.error('Error during queue sync:', err)
      } finally {
        isSyncingRef.current = false
        setIsSyncing(false)
      }
    }

    // Try syncing immediately on mount if online
    syncRuns()

    window.addEventListener('online', syncRuns)

    return () => {
      window.removeEventListener('online', syncRuns)
    }
  }, [])

  return { isSyncing }
}
