import { useEffect } from "react";
import "./Header.css";
import HeaderNotifications from "./HeaderNotifications";
import HeaderProfile from "./HeaderProfile";
import HeaderSearch from "./HeaderSearch";
import { useHeader } from "./useHeader";
import { useStoredState } from "../../hooks/useStoredState";
import { getSearchResults } from "../../utils/headerHelpers";

function Header({
  role,
  onLogout,
  requests = [],
  tasks = [],
  inventory = [],
  search = "",
  onSearchChange,
  onNavigate,
  onToggleSidebar,
  isSidebarOpen = false,
  theme,
  onThemeChange,
}) {
  const [storedTheme, setStoredTheme] = useStoredState(
    "officeflow.theme",
    "light",
    { raw: true },
  );
  const resolvedTheme = (theme || storedTheme) === "dark" ? "dark" : "light";
  const updateTheme = onThemeChange || setStoredTheme;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", resolvedTheme);
    }
  }, [resolvedTheme]);

  const isStaff = role?.id === "staff";
  const {
    areNotificationsOpen,
    closeNotifications,
    closeMenu,
    isMenuOpen,
    isSearchOpen,
    notificationButtonRef,
    notificationRef,
    profileButtonRef,
    profileRef,
    searchInputRef,
    searchRef,
    setIsSearchOpen,
    toggleNotifications,
    toggleProfileMenu,
  } = useHeader();
  // Faculty & Staff must not see documents, requests, or tasks in search.
  const searchResults = getSearchResults(
    isStaff ? [] : requests,
    isStaff ? [] : tasks,
    inventory,
    search,
  );

  return (
    <header className="app-header">
      <div className="app-header__mobile-bar">
        <button
          className="app-header__menu-button"
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          title={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isSidebarOpen}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span
          className="app-header__brand-mobile"
          onClick={() => onNavigate?.(role?.pages?.[0] || "dashboard")}
          aria-hidden="true"
        >
          <span className="app-header__brand-mark">D</span>
        </span>
      </div>

      <HeaderSearch
        isOpen={isSearchOpen}
        onClose={setIsSearchOpen}
        onNavigate={onNavigate}
        onSearchChange={onSearchChange}
        results={searchResults}
        search={search}
        searchInputRef={searchInputRef}
        searchRef={searchRef}
      />
      <div className="app-header__actions">
        {role && (
          <span
            className={`app-header__role-badge app-header__role-badge--${role.id}`}
            title={role.description}
          >
            <span className="app-header__role-badge-dot" aria-hidden="true" />
            {role.id === "dean"
              ? "Executive · View Only"
              : role.id === "staff"
                ? "Staff Portal"
                : "Admin Workspace"}
          </span>
        )}
        <label
          className="switch"
          title={
            resolvedTheme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          <input
            type="checkbox"
            checked={resolvedTheme === "light"}
            aria-label="Toggle light and dark theme"
            onChange={(event) =>
              updateTheme(event.target.checked ? "light" : "dark")
            }
          />
          <span className="slider">
            <div className="star star_1" />
            <div className="star star_2" />
            <div className="star star_3" />
            <svg
              viewBox="0 0 16 16"
              className="cloud_1 cloud"
              aria-hidden="true"
            >
              <path
                transform="matrix(.77976 0 0 .78395-299.99-418.63)"
                fill="#fff"
                d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
              />
            </svg>
          </span>
        </label>
        {!isStaff && (
          <HeaderNotifications
            requests={requests}
            tasks={tasks}
            inventory={inventory}
            isOpen={areNotificationsOpen}
            onClose={closeNotifications}
            onToggle={toggleNotifications}
            onNavigate={onNavigate}
            notificationRef={notificationRef}
            notificationButtonRef={notificationButtonRef}
          />
        )}
        <HeaderProfile
          role={role}
          onLogout={onLogout}
          isOpen={isMenuOpen}
          onNavigate={onNavigate}
          onClose={closeMenu}
          onToggle={toggleProfileMenu}
          profileRef={profileRef}
          profileButtonRef={profileButtonRef}
        />
      </div>
    </header>
  );
}

export default Header;
