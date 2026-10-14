import Header from "../components/header/Header";
import SideBar from "../components/sidebar/Sidebar";

function MainLayout({
  children,
  currentPage = "dashboard",
  requests = [],
  tasks = [],
  inventory = [],
  search = "",
  onNavigate,
  onSearchChange,
  isOpen = true,
  onToggle,
}) {
  return (
    <div className={`main-layout${isOpen ? "" : " main-layout--sidebar-closed"}`}>
      <SideBar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isOpen={isOpen}
        onToggle={onToggle}
      />
      <div className="main-layout-container">
        <Header
          requests={requests}
          tasks={tasks}
          inventory={inventory}
          search={search}
          onNavigate={onNavigate}
          onSearchChange={onSearchChange}
        />
        <main id={`page-${currentPage}`}>{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;