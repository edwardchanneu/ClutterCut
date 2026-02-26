import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../lib/auth'
import { useFolderSelection } from '../hooks/useFolderSelection'
import { useGuest } from '../context/GuestContext'
import { useAuth } from '../hooks/useAuth'

export default function OrganizeScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const { isGuest } = useGuest()
  const { session } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const { folderPath, files, isLoading, error, selectFolder } = useFolderSelection()

  // Determine actual guest status: if they have a real session, they are NOT a guest, even if isGuest=true was stuck in state
  const isEffectivelyGuest = isGuest && !session

  const handleSignOut = async (): Promise<void> => {
    setSigningOut(true)
    setSignOutError('')
    const err = await signOut()
    if (err) {
      setSignOutError('Sign out failed. Please try again.')
      setSigningOut(false)
    } else {
      navigate('/login', { replace: true })
    }
  }

  const hasEntries = files.length > 0

  const entries = files.map((f) => f)

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFB]">
      {/* App header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm">
        <span className="text-lg font-semibold text-primary">ClutterCut</span>
        <nav className="flex items-center gap-4">
          {isEffectivelyGuest ? (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 transition-colors"
            >
              Log in to view history
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="text-sm text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 transition-colors"
            >
              History
            </button>
          )}
          {!isEffectivelyGuest && (
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

      {signOutError && (
        <div role="alert" className="mx-6 mt-3 text-red-500 text-sm">
          {signOutError}
        </div>
      )}

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="bg-white w-full max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-4xl rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-semibold mb-6 text-primary text-center">
            Select Folder to Organize
          </h1>

          {/* Browse row */}
          <div className="flex items-center gap-3 mb-4">
            <button
              id="browse-btn"
              type="button"
              onClick={selectFolder}
              disabled={isLoading}
              aria-label="Browse for a folder to organize"
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-primary hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors disabled:opacity-50 shrink-0"
            >
              {isLoading ? 'Opening…' : 'Browse'}
            </button>

            {folderPath ? (
              <code
                id="selected-path"
                className="flex-1 text-xs font-mono bg-gray-100 rounded px-3 py-2 truncate text-primary"
                title={folderPath}
              >
                {folderPath}
              </code>
            ) : (
              <span className="flex-1 text-sm text-muted">No folder selected</span>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div role="alert" id="folder-error" className="mb-4 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* File list / empty state */}
          {folderPath && !error && (
            <div className="mb-6">
              {hasEntries ? (
                <>
                  <p className="text-xs text-muted mb-2">{entries.length} item(s) found</p>
                  <ul
                    aria-label="Contents of selected folder"
                    className="max-h-52 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-lg"
                  >
                    {entries.map((entry) => (
                      <li
                        key={entry.name}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary font-mono"
                      >
                        <span aria-hidden="true">{entry.isFile ? '📄' : '📁'}</span>
                        {entry.name}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p
                  id="empty-folder-msg"
                  role="status"
                  className="text-sm text-muted text-center py-4"
                >
                  This folder is empty. Please choose a different folder.
                </p>
              )}
            </div>
          )}

          {/* Start Organizing CTA */}
          <button
            id="start-organizing-btn"
            type="button"
            disabled={!hasEntries}
            aria-disabled={!hasEntries}
            className="w-full py-3 rounded-lg bg-[#0A0A0A] text-white text-sm font-semibold transition-opacity disabled:opacity-40 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            onClick={() => {
              navigate('/organize/rules', { state: { folderPath, files } })
            }}
          >
            Start Organizing
          </button>
        </div>
      </main>
    </div>
  )
}
