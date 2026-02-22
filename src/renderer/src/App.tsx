import { HashRouter, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Organize from './components/Organize'
import './assets/main.css'

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/organize" element={<Organize />} />
      </Routes>
    </HashRouter>
  )
}

export default App
