import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './screens/LoginScreen'
import OrganizeScreen from './screens/OrganizeScreen'
// TODO: re-wrap /organize in <ProtectedRoute> once Issue #4 wires in real Supabase auth
// import ProtectedRoute from './components/ProtectedRoute'
import SignUpScreen from './screens/SignUpScreen'

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/organize" element={<OrganizeScreen />} />
        {/* Catch-all: redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
