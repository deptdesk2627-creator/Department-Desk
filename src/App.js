import { useState } from "react";
import { useOfficeData } from "./hooks/useOfficeData";
import { useStoredState } from "./hooks/useStoredState";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/auth/Login";
import { getDeanPages } from "./pages/dean";
import { getSecretaryPages } from "./pages/secretary";
import { getStaffPages } from "./pages/staff";
import { canAccessPage, getHomePage, getRole } from "./utils/roles";

// Each role owns its own set of pages (see src/pages/<role>/index.js).
const PAGES_BY_ROLE = {
  secretary: getSecretaryPages,
  dean: getDeanPages,
  staff: getStaffPages,
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useStoredState(
    "officeflow.authenticated",
    false,
  );
  const [roleId, setRoleId] = useStoredState("officeflow.role", "secretary");
  const role = getRole(roleId);
  const [page, setPage] = useState(() => getHomePage(roleId));
  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth > 768 : true,
  );
  const data = useOfficeData();
  const safeSearch = typeof search === "string" ? search : "";

  // Never show a page the current role is not allowed to open.
  const activePage = canAccessPage(role.id, page) ? page : getHomePage(role.id);

  function navigate(nextPage) {
    if (canAccessPage(role.id, nextPage)) {
      setPage(nextPage);
      if (typeof window !== "undefined" && window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }
    }
  }

  function handleLogin(nextRoleId) {
    const resolvedRole = getRole(nextRoleId).id;
    setRoleId(resolvedRole);
    setSearch("");
    setPage(getHomePage(resolvedRole));
    setIsAuthenticated(true);
  }

  function handleLogout() {
    setSearch("");
    setIsAuthenticated(false);
  }

  if (!isAuthenticated) {
    return (
      <AuthLayout>
        <Login onLogin={handleLogin} defaultRoleId={role.id} />
      </AuthLayout>
    );
  }

  const getPages = PAGES_BY_ROLE[role.id] || getSecretaryPages;
  const pages = getPages({ role, data, search: safeSearch, navigate });

  return (
    <MainLayout
      role={role}
      onLogout={handleLogout}
      currentPage={activePage}
      requests={data.requests}
      tasks={data.tasks}
      inventory={data.inventory}
      search={safeSearch}
      onSearchChange={setSearch}
      onNavigate={navigate}
      isOpen={isSidebarOpen}
      onToggle={() => setIsSidebarOpen((open) => !open)}
      onCloseSidebar={() => setIsSidebarOpen(false)}
    >
      {pages[activePage]}
    </MainLayout>
  );
}

export default App;
