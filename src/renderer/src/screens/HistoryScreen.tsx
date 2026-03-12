import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../lib/auth'
import { useGuest } from '../context/GuestContext'
import { useAuth } from '../hooks/useAuth'
import { useHistory, UnifiedRun } from '../hooks/useHistory'
import { HistoryEntry } from '../components/HistoryEntry'

export default function HistoryScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const { isGuest } = useGuest()
  const { session } = useAuth()
  const userId = session?.user?.id
  const { runs, isLoading, error: fetchError } = useHistory(userId)

  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')

  // Group runs by folder path
  const groupedRuns = useMemo(() => {
    const groups: Record<string, UnifiedRun[]> = {}
    for (const run of runs) {
      if (!groups[run.folder_path]) {
        groups[run.folder_path] = []
      }
      groups[run.folder_path].push(run)
    }
    return groups
  }, [runs])

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  const handleSignOut = async (): Promise<void> => {
    setSigningOut(true)
    setError('')
    const err = await signOut()
    if (err) {
      setError('Sign out failed. Please try again.')
      setSigningOut(false)
    } else {
      navigate('/login', { replace: true })
    }
  }

  const toggleFolder = (folderPath: string): void => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderPath)) {
        next.delete(folderPath)
      } else {
        next.add(folderPath)
      }
      return next
    })
  }

  const toggleExpand = (runId: string): void => {
    setExpandedRunId((prev) => (prev === runId ? null : runId))
  }

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFB]">
      {/* App header with sign-out control */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm shrink-0">
        <span className="text-lg font-semibold text-primary">ClutterCut</span>
        <nav className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/organize')}
            className="text-sm text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 transition-colors"
          >
            Organize
          </button>
          {!isGuest && (
            <button
              id="sign-out-btn"
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm font-medium text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-3 py-1 transition-colors disabled:opacity-50"
            >
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          )}
        </nav>
      </header>

      {error && (
        <div role="alert" className="mx-6 mt-3 text-red-500 text-sm shrink-0">
          {error}
        </div>
      )}

      {/* Main content area */}
      <main className="flex flex-1 flex-col items-center p-6 overflow-y-auto">
        <div className="w-full max-w-3xl">
          <h1 className="text-2xl font-semibold mb-6 text-primary">Organization History</h1>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted">Loading history...</div>
            </div>
          ) : fetchError ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
              Failed to load history: {fetchError.message}
            </div>
          ) : runs.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-100">
              <p className="text-muted">No runs found. Go organize some folders!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(groupedRuns).map(([folderPath, folderRuns]) => {
                const isFolderExpanded = expandedFolders.has(folderPath)
                return (
                  <div
                    key={folderPath}
                    className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
                  >
                    {/* Folder Header */}
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => toggleFolder(folderPath)}
                      aria-expanded={isFolderExpanded}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-slate-400 shrink-0"
                        >
                          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                        </svg>
                        <h2
                          className="text-lg font-bold text-slate-800 truncate"
                          title={folderPath}
                        >
                          {folderPath}
                        </h2>
                        <span className="text-sm font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                          {folderRuns.length} run{folderRuns.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${isFolderExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    {/* Folder Content (Runs) */}
                    {isFolderExpanded && (
                      <div className="border-t border-slate-100 p-4 flex flex-col gap-4 bg-slate-50/50">
                        {folderRuns.map((run) => (
                          <HistoryEntry
                            key={run.id}
                            run={run}
                            isExpanded={expandedRunId === run.id}
                            onToggle={() => toggleExpand(run.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
