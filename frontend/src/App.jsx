import { Routes,Route } from 'react-router-dom'
import Login from './pages/template/Login.jsx'
import Dashboard from './pages/template/Dashboard.jsx'
import Layout from './components/template/Layout.jsx'

function App() {

  return (
   <Routes>
      <Route path="/" element={<Login />} />

      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      
   </Routes>
  )
}

export default App
