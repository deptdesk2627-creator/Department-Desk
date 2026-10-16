import "./HeaderProfile.css";

function HeaderProfile({
  role,
  onLogout,
  isOpen,
  onClose,
  onToggle,
  profileRef,
  profileButtonRef,
}) {
  const name = role?.name || "Cha Gamay";
  const initials = role?.initials || "CG";

  function handleLogout() {
    onClose?.();
    onLogout?.();
  }

  return (
    <div className="app-header__profile" ref={profileRef}>
      <button
        className="app-header__profile-button"
        id="profile-menu-trigger"
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="profile-menu"
        onClick={onToggle}
        ref={profileButtonRef}
      >
        <span className="app-header__avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="app-header__name">{name}</span>
        <svg
          className={`app-header__chevron${isOpen ? " app-header__chevron--open" : ""}`}
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="app-header__menu"
          id="profile-menu"
          role="menu"
          aria-labelledby="profile-menu-trigger"
        >
          <div className="app-header__menu-heading">
            <span>Signed in as</span>
            <strong>{name}</strong>
            {role && <span>{role.label}</span>}
          </div>
          <div className="app-header__menu-divider" />
          <button type="button" role="menuitem" onClick={onClose}>
            Profile
          </button>
          <button type="button" role="menuitem" onClick={onClose}>
            Settings
          </button>
          <button
            className="app-header__logout"
            type="button"
            role="menuitem"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default HeaderProfile;
