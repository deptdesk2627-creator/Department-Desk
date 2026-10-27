import "./SidebarProfile.css";

const STATUS_LABELS = {
  available: "Available",
  meeting: "In a meeting",
  away: "Out of office",
  leave: "On leave",
};

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
  const status = role?.status || "available";
  const statusLabel = STATUS_LABELS[status] || STATUS_LABELS.available;

  return (
    <footer className="workspace-sidebar__footer">
      <button
        className="workspace-sidebar__profile-summary"
        type="button"
        onClick={() => onNavigate("profile")}
        aria-label={`Open profile for ${name} (${statusLabel})`}
        title={`${name} · ${statusLabel}`}
      >
        <span className="workspace-sidebar__avatar" aria-hidden="true">
          {role?.initials || "OS"}
          <span
            className="workspace-sidebar__online-indicator"
            data-status={status}
          />
        </span>
        <span className="workspace-sidebar__profile">
          <strong>{name}</strong>
          <span>{subtitle}</span>
        </span>
      </button>
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
              onClick={() => onNavigate("profile")}
            >
              My profile
            </button>
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
              Help &amp; FAQ
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
