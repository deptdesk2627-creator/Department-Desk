import Header from "../components/header/Header";
import SideBar from "../components/sidebar/Sidebar";

function MainLayout({
  children,
  role,
  onLogout,
  currentPage = "dashboard",
  requests = [],
  tasks = [],
  inventory = [],
  search = "",
  onNavigate,
  onSearchChange,
  isOpen = true,
  onToggle,
  onCloseSidebar,
}) {
  return (
    <div
      className={`main-layout${isOpen ? "" : " main-layout--sidebar-closed"}`}
    >
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => (onCloseSidebar ? onCloseSidebar() : onToggle?.())}
          aria-hidden="true"
        />
      )}
      <SideBar
        role={role}
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        isOpen={isOpen}
        onToggle={onToggle}
      />
      <div className="main-layout-container">
        <Header
          role={role}
          onLogout={onLogout}
          requests={requests}
          tasks={tasks}
          inventory={inventory}
          search={search}
          onNavigate={onNavigate}
          onSearchChange={onSearchChange}
          onToggleSidebar={onToggle}
          isSidebarOpen={isOpen}
        />
        <main
          id={`page-${currentPage}`}
          key={role ? `${role.id}-${currentPage}` : currentPage}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;