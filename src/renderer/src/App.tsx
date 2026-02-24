import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GuestProvider } from './context/GuestProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginScreen from './screens/LoginScreen'
import OrganizeScreen from './screens/OrganizeScreen'
// TODO: re-wrap /organize in <ProtectedRoute> once Issue #4 wires in real Supabase auth
// import ProtectedRoute from './components/ProtectedRoute'
import SignUpScreen from './screens/SignUpScreen'
import { HistoryScreen } from './screens/HistoryScreen'

function App(): React.JSX.Element {
  return (
    <GuestProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />
          <Route path="/organize" element={<OrganizeScreen />} />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryScreen />
              </ProtectedRoute>
            }
          />
          {/* Catch-all: redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    </GuestProvider>
  )
}

export default App
