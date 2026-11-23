import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DATA_KEYS,
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
import { getProductId } from "./hooks/useInventoryActions";
import { useOfficeData } from "./hooks/useOfficeData";
import { useStoredState } from "./hooks/useStoredState";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import { getRolePages } from "./pages";
import Login from "./pages/auth/Login";
import { supabase } from "./supabase/supabaseClient";
import {
  confirmInventoryReturn,
  PENDING_RETURN_STATUS,
  reconcileBorrowReturnState,
} from "./utils/inventory";

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

function clearCachedWorkspaceStorage() {
  if (typeof window === "undefined") return;
  try {
    Object.values(DATA_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Could not clear cached workspace data.", error);
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const taskOwnerAuthId = useRef(null);
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
  const [navigationContext, setNavigationContext] = useState(null);
  const navigationKeyRef = useRef(0);
  const skipNextNavResetRef = useRef(false);
  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== "undefined"
      ? window.innerWidth > 768 && settings?.sidebarDefault !== "collapsed"
      : true,
  );
  const data = useOfficeData({ isAuthenticated, roleId: role.id });
  const { setTasks, setRequests, setInventory, setInventoryRecords } = data;
  const safeSearch = typeof search === "string" ? search : "";

  const clearSessionData = useCallback(() => {
    taskOwnerAuthId.current = null;
    setTasks([]);
    setRequests([]);
    setInventory([]);
    setInventoryRecords([]);
    setProfiles(EMPTY_PROFILES);
    clearCachedWorkspaceStorage();
  }, [setInventory, setInventoryRecords, setRequests, setTasks]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) return;
    setIsSidebarOpen(settings?.sidebarDefault !== "collapsed");
  }, [settings?.sidebarDefault]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    function handleViewportChange(event) {
      if (event.matches) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(settings?.sidebarDefault !== "collapsed");
      }
    }

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleViewportChange);
      return () => mediaQuery.removeEventListener("change", handleViewportChange);
    }
    if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleViewportChange);
      return () => mediaQuery.removeListener(handleViewportChange);
    }
    return undefined;
  }, [settings?.sidebarDefault]);

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
        clearSessionData();
        setIsAuthenticated(false);
        return;
      }

      const sessionUserId = session.user.id || null;
      if (taskOwnerAuthId.current !== sessionUserId) {
        if (taskOwnerAuthId.current) {
          clearSessionData();
        } else {
          setTasks([]);
        }
        taskOwnerAuthId.current = sessionUserId;
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
          clearSessionData();
          setIsAuthenticated(false);
          return;
        }

        const { data: claimsData, error: claimsError } =
          await supabase.auth.getClaims(session.access_token);
        if (claimsError) throw claimsError;

        const sessionRole = claimsData?.claims?.app_metadata?.role;
        if (Object.prototype.hasOwnProperty.call(ROLES, sessionRole)) {
          const sessionUserId = session.user.id || null;
          if (taskOwnerAuthId.current !== sessionUserId) {
            if (taskOwnerAuthId.current) {
              clearSessionData();
            } else {
              setTasks([]);
            }
            taskOwnerAuthId.current = sessionUserId;
          }
          setRoleId(sessionRole);
          syncSessionProfile(session.user, sessionRole);
          setIsAuthenticated(true);
        } else {
          clearSessionData();
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
  }, [clearSessionData, setProfiles, setRoleId, setTasks]);

  // Never show a page the current role is not allowed to open.
  const activePage = canAccessPage(role.id, page) ? page : getHomePage(role.id);

  function navigate(nextPage) {
    if (canAccessPage(role.id, nextPage)) {
      if (skipNextNavResetRef.current) {
        skipNextNavResetRef.current = false;
      } else {
        setNavigationContext(null);
      }
      setPage(nextPage);
      if (typeof window !== "undefined" && window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }
    }
  }

  function handleSelectNotification(notification) {
    skipNextNavResetRef.current = true;
    setNavigationContext({
      page: notification.page,
      tab: notification.tab || null,
      stockFilter: notification.stockFilter || null,
      key: ++navigationKeyRef.current,
    });
  }

  async function handleConfirmReturnFromNotification(notification) {
    if (!role?.can?.manageInventory) return false;
    const record = (data.inventoryRecords || []).find(
      (entry) =>
        entry &&
        entry.status === PENDING_RETURN_STATUS &&
        String(entry.id) === String(notification?.recordId),
    );
    if (!record) {
      throw new Error("This return request is no longer pending.");
    }

    const matchedItem = (data.inventory || []).find(
      (item) =>
        Number(item.item_id ?? item.id) === Number(record.itemId) ||
        getProductId(item) === record.productId,
    );
    if (!matchedItem) {
      throw new Error(
        "Could not find this product in the active inventory masterlist.",
      );
    }

    const confirmedBy = String(profile?.name || role?.name || "").trim() || "Secretary";
    const today = new Date().toISOString().slice(0, 10);
    const result = await confirmInventoryReturn({
      supabaseClient: supabase,
      record,
      item: matchedItem,
      receivedBy: confirmedBy,
    });
    const nextStock = result.updatedStock;
    const savedReturnDate = result.updatedTransaction?.return_date || today;

    data.setInventory((current) =>
      (Array.isArray(current) ? current : []).map((item) =>
        item?.id === matchedItem.id
          ? {
              ...item,
              quantity: nextStock,
              stock_onhand: nextStock,
            }
          : item,
      ),
    );
    data.setInventoryRecords((current) => {
      const existingList = Array.isArray(current) ? current : [];
      const updatedList = existingList.map((entry) =>
        entry?.id === record.id
          ? {
              ...entry,
              status: "Returned",
              returnDate: savedReturnDate,
              receivedBy: confirmedBy,
              isPendingConfirmation: false,
            }
          : entry,
      );
      return reconcileBorrowReturnState(updatedList);
    });
    return true;
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
    const trimmedName = String(nextProfile?.name || "").trim();
    if (
      taskOwnerAuthId.current &&
      trimmedName &&
      typeof supabase?.from === "function"
    ) {
      Promise.resolve(
        supabase
          .from("users")
          .update({ username: trimmedName })
          .eq("auth_user_id", taskOwnerAuthId.current),
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

    const authUserId = user?.id || null;
    if (taskOwnerAuthId.current !== authUserId) {
      if (taskOwnerAuthId.current) {
        clearSessionData();
      } else {
        setTasks([]);
      }
      taskOwnerAuthId.current = authUserId;
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
    setNavigationContext(null);
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setTimeout(() => {
        clearSessionData();
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
    navigationContext,
    profile,
    onSaveProfile: saveProfile,
    settings,
    onSettingsChange: setSettings,
    theme: activeTheme,
    onThemeChange: setTheme,
    isSidebarOpen,
    onSidebarOpenChange: setIsSidebarOpen,
  });

  return (
    <MainLayout
      role={displayRole}
      onLogout={handleLogout}
      currentPage={activePage}
      requests={data.requests}
      tasks={data.tasks}
      inventory={data.inventory}
      inventoryRecords={data.inventoryRecords}
      settings={settings}
      isNotificationsReady={data.isReady}
      notificationStorageKey={`officeflow.notifications.${role.id}`}
      search={safeSearch}
      onSearchChange={setSearch}
      onNavigate={navigate}
      onSelectNotification={handleSelectNotification}
      onConfirmReturn={handleConfirmReturnFromNotification}
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
