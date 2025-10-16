import Header from '../template/Header.jsx'
import SideBar from '../template/SideBar.jsx'
import '../../components/style/Layout.css'
import { Outlet } from 'react-router-dom'

export default function Layout(){
    return(
        <div className="layout-container">
            <Header/>
            <div className="layout-body">
                <SideBar/>
                <div className="layout-content">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}