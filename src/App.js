import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SETTINGS,
  getInitials,
  getProfile,
  isPlainObject,
} from "./constants/system";
import { canAccessPage, getHomePage, getRole } from "./constants/roles";
import { useOfficeData } from "./hooks/useOfficeData";
import { useStoredState } from "./hooks/useStoredState";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import { getRolePages } from "./pages";
import Login from "./pages/auth/Login";

const EMPTY_PROFILES = {};
const storedObjectOptions = { validate: isPlainObject };

function App() {
  const [isAuthenticated, setIsAuthenticated] = useStoredState(
    "officeflow.authenticated",
    false,
  );
  const [roleId, setRoleId] = useStoredState("officeflow.role", "secretary");
  const [theme, setTheme] = useStoredState("officeflow.theme", "light", {
    raw: true,
  });
  const [profiles, setProfiles] = useStoredState(
    "officeflow.profiles",
    EMPTY_PROFILES,
    storedObjectOptions,
  );
  const [settings, setSettings] = useStoredState(
    "officeflow.settings",
    DEFAULT_SETTINGS,
    storedObjectOptions,
  );
  const activeTheme = theme === "dark" ? "dark" : "light";
  const role = getRole(roleId);
  const [page, setPage] = useState(() => getHomePage(roleId));
  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== "undefined"
      ? window.innerWidth > 768 && settings?.sidebarDefault !== "collapsed"
      : true,
  );
  const data = useOfficeData();
  const safeSearch = typeof search === "string" ? search : "";

  // Saved profile edits for the signed-in role, merged over role defaults.
  const storedProfile = profiles?.[role.id];
  const profile = useMemo(
    () => getProfile(role, storedProfile),
    [role, storedProfile],
  );
  const displayRole = useMemo(
    () => ({
      ...role,
      name: profile.name || role.name,
      initials: getInitials(profile.name, role.initials),
      status: profile.status,
    }),
    [role, profile],
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", activeTheme);
    }
  }, [activeTheme]);

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

  function saveProfile(nextProfile) {
    setProfiles((current) => ({
      ...(isPlainObject(current) ? current : {}),
      [role.id]: nextProfile,
    }));
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

  const pages = getRolePages({
    role,
    data,
    search: safeSearch,
    navigate,
    profile,
    onSaveProfile: saveProfile,
    settings,
    onSettingsChange: setSettings,
    theme: activeTheme,
    onThemeChange: setTheme,
  });

  return (
    <MainLayout
      role={displayRole}
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
      theme={activeTheme}
      onThemeChange={setTheme}
    >
      {pages[activePage]}
    </MainLayout>
  );
}

export default App;
