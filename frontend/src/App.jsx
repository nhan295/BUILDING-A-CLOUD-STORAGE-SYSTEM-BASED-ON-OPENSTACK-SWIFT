import { Routes,Route } from 'react-router-dom'
import Login from './pages/template/Login.jsx'
import Dashboard from './pages/template/Dashboard.jsx'

function App() {

  return (
   <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/homepage" element={<Dashboard />} />
   </Routes>
  )
}

export default App
