import "./Header.css";
import HeaderNotifications from "./HeaderNotifications";
import HeaderProfile from "./HeaderProfile";
import HeaderSearch from "./HeaderSearch";
import { useHeader } from "./useHeader";
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
}) {
  const isStaff = role?.id === "staff";
  const canCreateRequests = role ? role.can.createRequests : true;
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
          onClick={() => onNavigate?.("dashboard")}
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
        {canCreateRequests && (
          <button
            className="app-header__new-request"
            type="button"
            onClick={() => onNavigate?.("transactions")}
          >
            <span aria-hidden="true">＋</span> <span className="app-header__new-request-label">New request</span>
          </button>
        )}
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
