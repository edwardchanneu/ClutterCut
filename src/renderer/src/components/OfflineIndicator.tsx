import { useSyncQueue } from '../hooks/useSyncQueue'

export function OfflineIndicator(): React.JSX.Element | null {
  const { isOnline, isSyncing, syncError } = useSyncQueue()

  if (isOnline && !syncError && !isSyncing) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full text-center py-1.5 text-xs font-semibold shrink-0 shadow-sm z-50 transition-colors ${
        !isOnline
          ? 'bg-amber-100 text-amber-800 border-b border-amber-200'
          : syncError
            ? 'bg-red-100 text-red-800 border-b border-red-200'
            : 'bg-blue-100 text-blue-800 border-b border-blue-200' // isSyncing
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {!isOnline && (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>You are offline. Changes will be saved locally and synced later.</span>
          </>
        )}
        {isOnline && isSyncing && (
          <>
            <svg
              className="animate-spin h-3 w-3 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Syncing offline runs...</span>
          </>
        )}
        {isOnline && !isSyncing && syncError && (
          <>
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>Sync failed: {syncError}. Retrying in background...</span>
          </>
        )}
      </div>
    </div>
  )
}
