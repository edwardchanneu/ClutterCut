import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GuestProvider } from './context/GuestProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import HistoryScreen from './screens/HistoryScreen'
import LoginScreen from './screens/LoginScreen'
import OrganizeScreen from './screens/OrganizeScreen'
import SignUpScreen from './screens/SignUpScreen'
import { RulesScreen } from './screens/RulesScreen'
import { useAuth } from './hooks/useAuth'

export function AppRoutes(): React.JSX.Element {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-[#F8FAFB]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="text-muted text-sm tracking-wide">Checking session...</div>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/organize" replace /> : <LoginScreen />}
      />
      <Route
        path="/signup"
        element={session ? <Navigate to="/organize" replace /> : <SignUpScreen />}
      />
      <Route path="/organize" element={<OrganizeScreen />} />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organize/rules"
        element={
          <ProtectedRoute>
            <RulesScreen />
          </ProtectedRoute>
        }
      />
      {/* Catch-all: redirect to organize if session exists, else login */}
      <Route path="*" element={<Navigate to={session ? '/organize' : '/login'} replace />} />
    </Routes>
  )
}

function App(): React.JSX.Element {
  return (
    <GuestProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </GuestProvider>
  )
}

export default App
