import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './screens/LoginScreen'
import OrganizeScreen from './screens/OrganizeScreen'
import SignUpScreen from './screens/SignUpScreen'

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/organize" element={<OrganizeScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
