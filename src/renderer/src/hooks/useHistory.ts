import { useQuery } from '@tanstack/react-query'
import { getRuns } from '../lib/runs'
import type { QueuedRun } from '../../../shared/ipcChannels'

export type UnifiedRun = QueuedRun & { isPendingSync?: boolean }

export function useHistory(userId: string | undefined): {
  runs: UnifiedRun[]
  isLoading: boolean
  error: Error | null
} {
  const {
    data: remoteRuns,
    isLoading: isRemoteLoading,
    error: remoteError
  } = useQuery({
    queryKey: ['runs', userId],
    queryFn: () => getRuns(userId!),
    enabled: !!userId
  })

  // We could also fetch local runs via useQuery to keep it simple and reactive.
  const {
    data: localRuns,
    isLoading: isLocalLoading,
    error: localError
  } = useQuery({
    queryKey: ['localRuns'],
    queryFn: async () => {
      const { success, runs, error } = await window.api.getOfflineRuns()
      if (!success) {
        throw new Error(error || 'Failed to fetch offline runs')
      }
      return runs || []
    }
  })

  const isLoading = isRemoteLoading || isLocalLoading
  const error = (remoteError as Error) || (localError as Error) || null

  // Combine and sort remote and local
  // Local ones that aren't on remote yet
  const combined: UnifiedRun[] = [...(remoteRuns || [])]

  if (localRuns) {
    const existingIds = new Set(combined.map((r) => r.id))
    for (const lr of localRuns) {
      if (!existingIds.has(lr.id)) {
        combined.push({ ...lr, isPendingSync: true })
      }
    }
  }

  combined.sort((a, b) => new Date(b.ran_at).getTime() - new Date(a.ran_at).getTime())

  return { runs: combined, isLoading, error }
}
