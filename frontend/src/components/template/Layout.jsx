import Header from '../template/Header.jsx'
import SideBar from '../template/SideBar.jsx'
import '../../components/style/Layout.css'

export default function Layout(){
    return(
        <div className="layout-container">
            <Header/>
            <div className="layout-body">
                <SideBar/>
                <div className="layout-content">
                    {/* Content will go here */}
                </div>
            </div>
        </div>
    )
}