import { Navigate } from 'react-router-dom'
import { useGuest } from '../context/GuestContext'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Blocks access to auth-required routes.
 * Redirects to /login if:
 *   - the user is in guest mode (isGuest = true), OR
 *   - there is no authenticated Supabase session (after auth has loaded).
 * Renders nothing while auth state is still loading.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps): React.JSX.Element | null {
  const { isGuest } = useGuest()
  const { session, loading } = useAuth()

  if (isGuest) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return null
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
