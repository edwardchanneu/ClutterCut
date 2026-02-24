import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Guards a route so only authenticated users can access it.
 * Renders nothing while the session is loading, redirects to /login
 * when there is no session, and renders children when authenticated.
 */
export default function ProtectedRoute({
  children
}: ProtectedRouteProps): React.JSX.Element | null {
  const { session, loading } = useAuth()

  if (loading) return null

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
