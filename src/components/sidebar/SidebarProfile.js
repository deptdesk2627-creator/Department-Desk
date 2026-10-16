import "./SidebarProfile.css";

function SidebarProfile({
  role,
  isMenuOpen,
  onToggleMenu,
  onNavigate,
  onLogout,
}) {
  const name = role?.name || "Office Staff";
  const subtitle = role
    ? `${role.label} · ${role.description}`
    : "Dean · Secretary · Assistants";

  return (
    <footer className="workspace-sidebar__footer">
      <div className="workspace-sidebar__profile-summary">
        <span className="workspace-sidebar__avatar" aria-hidden="true">
          {role?.initials || "OS"}
          <span className="workspace-sidebar__online-indicator" />
        </span>
        <span className="workspace-sidebar__profile">
          <strong>{name}</strong>
          <span>{subtitle}</span>
        </span>
      </div>
      <div className="workspace-sidebar__profile-actions">
        <button
          className="workspace-sidebar__profile-menu-button"
          type="button"
          aria-label={`${name} menu`}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          onClick={onToggleMenu}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="12" cy="19" r="1.6" />
          </svg>
        </button>
        {isMenuOpen && (
          <div className="workspace-sidebar__profile-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => onNavigate("settings")}
            >
              Settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => onNavigate("help")}
            >
              Help &amp; Support
            </button>
            <div className="workspace-sidebar__profile-divider" />
            <button
              className="workspace-sidebar__logout"
              type="button"
              role="menuitem"
              onClick={onLogout}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </footer>
  );
}

export default SidebarProfile;
