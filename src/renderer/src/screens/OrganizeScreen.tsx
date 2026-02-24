import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../lib/auth'

export default function OrganizeScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')

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
        <button
          id="sign-out-btn"
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="text-sm font-medium text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-3 py-1 transition-colors disabled:opacity-50"
        >
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
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
