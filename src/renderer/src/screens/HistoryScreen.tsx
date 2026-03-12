import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../lib/auth'
import { useGuest } from '../context/GuestContext'
import { useAuth } from '../hooks/useAuth'
import { useHistory } from '../hooks/useHistory'
import { HistoryEntry } from '../components/HistoryEntry'

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
