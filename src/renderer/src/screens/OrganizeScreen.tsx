import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../lib/auth'
import { useGuest } from '../context/GuestContext'
import { useAuth } from '../hooks/useAuth'

export default function OrganizeScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const { isGuest } = useGuest()
  const { session } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')

  // Determine actual guest status: if they have a real session, they are NOT a guest, even if isGuest=true was stuck in state
  const isEffectivelyGuest = isGuest && !session

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

  return (
    <div className="flex flex-col h-screen">
      {/* App header with sign-out control */}
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

      {error && (
        <div role="alert" className="mx-6 mt-3 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Main content area */}
      <main className="flex flex-1 items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <h1 className="text-2xl font-semibold mb-4 text-primary">Select Folder to Organize</h1>
          <p className="text-muted">Placeholder for the organization screen.</p>
        </div>
      </main>
    </div>
  )
}
