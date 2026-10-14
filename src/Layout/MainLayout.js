import Header from "../Components/Header";
import SideBar from "../Components/Sidebar";

function MainLayout({children}){
    return(
        <div className="main-layout">
            <SideBar/>

            <div className="main-layout-container">
                <Header/>
                <main id="dashboard">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default MainLayout;