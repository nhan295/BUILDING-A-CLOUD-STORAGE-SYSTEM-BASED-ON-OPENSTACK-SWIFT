import { Routes,Route } from 'react-router-dom'
import Login from './pages/template/Login.jsx'
import Dashboard from './pages/template/Dashboard.jsx'
import Layout from './components/template/Layout.jsx'
import UserManagement from './pages/template/UserManagement.jsx'
import FileUpload from './pages/template/FileUpload.jsx'
import ContainerManagement from './pages/template/ContainerManagement.jsx'
import ProjectManagement from './pages/template/ProjectManagement.jsx'

function App() {

  return (
   <Routes>
      <Route path="/" element={<Login />} />

      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />  
        <Route path="/user-manager" element={<UserManagement/>}/> 
        <Route path="/upload" element={<FileUpload/>}/>
        <Route path="/container-manager" element={<ContainerManagement/>}/>
        <Route path="/project-manager" element={<ProjectManagement/>}/>
      </Route>

      
   </Routes>
  )
}

export default App
