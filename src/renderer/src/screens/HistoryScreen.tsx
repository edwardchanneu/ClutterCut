import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../lib/auth'
import { useGuest } from '../context/GuestContext'
import { useAuth } from '../hooks/useAuth'
import { useHistory, UnifiedRun } from '../hooks/useHistory'
import type { Rule } from '../../../shared/ipcChannels'

export default function HistoryScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const { isGuest } = useGuest()
  const { session } = useAuth()
  const userId = session?.user?.id
  const { runs, isLoading, error: fetchError } = useHistory(userId)

  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')
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
              {runs.map((run) => (
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
      </main>
    </div>
  )
}

function HistoryEntry({
  run,
  isExpanded,
  onToggle
}: {
  run: UnifiedRun
  isExpanded: boolean
  onToggle: () => void
}): React.JSX.Element {
  const date = new Date(run.ran_at)
  const formattedDate = date.toLocaleDateString()
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-sm">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-primary">{formattedDate}</span>
            <span className="text-muted text-xs">{formattedTime}</span>
            {run.undone && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                Undone
              </span>
            )}
            {run.isPendingSync && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-xs rounded-full font-medium">
                Pending Sync
              </span>
            )}
          </div>
          <span
            className="text-primary font-mono text-xs truncate max-w-md"
            title={run.folder_path}
          >
            {run.folder_path}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted tabular-nums">{run.files_affected} file(s) affected</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-6">
          {/* Rules Section */}
          {Array.isArray(run.rules) && run.rules.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Rules Applied
              </h3>
              <ol className="list-decimal list-inside text-primary space-y-1 ml-1">
                {(run.rules as Rule[]).map((rule, idx) => (
                  <li key={idx}>
                    If <span className="font-medium">{rule.conditionType}</span> is{' '}
                    <span className="font-mono bg-white px-1 rounded border border-gray-200">
                      {rule.conditionValue}
                    </span>
                    , move to{' '}
                    <span className="font-medium text-blue-600">{rule.destinationFolder}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Snapshots Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Before
              </h3>
              <div className="bg-white border border-gray-200 p-3 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
                <pre className="text-xs text-primary font-mono">
                  {JSON.stringify(run.before_snapshot, null, 2)}
                </pre>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                After
              </h3>
              <div className="bg-white border border-gray-200 p-3 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
                <pre className="text-xs text-primary font-mono">
                  {JSON.stringify(run.after_snapshot, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
