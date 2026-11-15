import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SETTINGS,
  getInitials,
  getProfile,
  isPlainObject,
} from "./constants/system";
import {
  canAccessPage,
  getHomePage,
  getRole,
  ROLES,
} from "./constants/roles";
import { useOfficeData } from "./hooks/useOfficeData";
import { useStoredState } from "./hooks/useStoredState";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import { getRolePages } from "./pages";
import Login from "./pages/auth/Login";
import { supabase } from "./supabase/supabaseClient";

function extractMetadataProfilePatch(user) {
  const meta = user?.user_metadata || {};
  const patch = {};
  if (meta.full_name) patch.name = meta.full_name;
  if (user?.email) patch.email = user.email;
  if (typeof meta.title === "string") patch.title = meta.title;
  if (typeof meta.phone === "string") patch.phone = meta.phone;
  if (typeof meta.office === "string") patch.office = meta.office;
  if (typeof meta.status === "string") patch.status = meta.status;
  if (typeof meta.statusNote === "string") patch.statusNote = meta.statusNote;
  return patch;
}

const EMPTY_PROFILES = {};
const storedObjectOptions = { validate: isPlainObject };

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roleId, setRoleId] = useStoredState("officeflow.role", "secretary");
  const [theme, setTheme] = useStoredState("officeflow.theme", "light", {
    raw: true,
  });
  const [profiles, setProfiles] = useState(EMPTY_PROFILES);
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

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute(
        "data-density",
        settings?.tableDensity === "compact" ? "compact" : "comfortable",
      );
    }
  }, [settings?.tableDensity]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.removeItem("officeflow.profiles");
    } catch (error) {
      console.error("Could not clear saved profile data.", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    function syncSessionProfile(user, sessionRole) {
      const patch = extractMetadataProfilePatch(user);
      if (Object.keys(patch).length) {
        setProfiles((current) => ({
          ...(isPlainObject(current) ? current : {}),
          [sessionRole]: {
            ...getProfile(getRole(sessionRole), current?.[sessionRole]),
            ...patch,
          },
        }));
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      const sessionRole = session?.user?.app_metadata?.role;
      if (
        !session ||
        !Object.prototype.hasOwnProperty.call(ROLES, sessionRole)
      ) {
        setIsAuthenticated(false);
        return;
      }

      setRoleId(sessionRole);
      syncSessionProfile(session.user, sessionRole);
      setIsAuthenticated(true);
    });

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (error) throw error;
        if (!isMounted) return;

        const session = data.session;
        if (!session) {
          setIsAuthenticated(false);
          return;
        }

        const { data: claimsData, error: claimsError } =
          await supabase.auth.getClaims(session.access_token);
        if (claimsError) throw claimsError;

        const sessionRole = claimsData?.claims?.app_metadata?.role;
        if (Object.prototype.hasOwnProperty.call(ROLES, sessionRole)) {
          setRoleId(sessionRole);
          syncSessionProfile(session.user, sessionRole);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch((error) => {
        console.error("Could not restore the Supabase session.", error);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setProfiles, setRoleId]);

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
    if (typeof supabase?.auth?.updateUser === "function") {
      Promise.resolve(
        supabase.auth.updateUser({
          data: {
            full_name: nextProfile.name,
            title: nextProfile.title,
            phone: nextProfile.phone,
            office: nextProfile.office,
            status: nextProfile.status,
            statusNote: nextProfile.statusNote,
          },
        }),
      ).catch(() => {});
    }
  }

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function handleLogin(user) {
    const resolvedRole = user?.app_metadata?.role;
    if (!Object.prototype.hasOwnProperty.call(ROLES, resolvedRole)) {
      console.error("Cannot open workspace: the account role is invalid.");
      return;
    }

    setRoleId(resolvedRole);
    const patch = extractMetadataProfilePatch(user);
    if (Object.keys(patch).length) {
      setProfiles((current) => ({
        ...(isPlainObject(current) ? current : {}),
        [resolvedRole]: {
          ...getProfile(getRole(resolvedRole), current?.[resolvedRole]),
          ...patch,
        },
      }));
    }
    setSearch("");
    setPage(getHomePage(resolvedRole));
    setIsAuthenticated(true);
  }

  async function handleLogout() {
    setSearch("");
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setTimeout(() => {
        setIsAuthenticated(false);
        setIsLoggingOut(false);
      }, 220);
    } catch (error) {
      setIsLoggingOut(false);
      console.error("Could not sign out of Supabase.", error);
    }
  }

  if (!isAuthenticated) {
    return (
      <AuthLayout>
        <Login
          onLogin={handleLogin}
          defaultRoleId={role.id}
          theme={activeTheme}
          onThemeChange={setTheme}
        />
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
      settings={settings}
      search={safeSearch}
      onSearchChange={setSearch}
      onNavigate={navigate}
      isOpen={isSidebarOpen}
      onToggle={() => setIsSidebarOpen((open) => !open)}
      onCloseSidebar={() => setIsSidebarOpen(false)}
      theme={activeTheme}
      onThemeChange={setTheme}
      isLoggingOut={isLoggingOut}
    >
      {pages[activePage]}
    </MainLayout>
  );
}

export default App;
