import "./Header.css";
import HeaderNotifications from "./HeaderNotifications";
import HeaderProfile from "./HeaderProfile";
import HeaderSearch from "./HeaderSearch";
import { useHeader } from "../../hooks/useHeader";
import { getSearchResults } from "../../utils/headerHelpers";

function Header({
  requests = [],
  tasks = [],
  inventory = [],
  search = "",
  onSearchChange,
  onNavigate,
}) {
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
  const searchResults = getSearchResults(requests, tasks, inventory, search);

  return (
    <header className="app-header">
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
        <button
          className="app-header__new-request"
          type="button"
          onClick={() => onNavigate?.("transactions")}
        >
          <span aria-hidden="true">＋</span> New request
        </button>
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
        <HeaderProfile
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
