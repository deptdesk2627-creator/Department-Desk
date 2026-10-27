import "./SidebarLogout.css";

function SidebarLogout({ onLogout, isOpen = true }) {
  return (
    <footer className="workspace-sidebar__footer">
      <button
        className="workspace-sidebar__link workspace-sidebar__logout-link"
        type="button"
        onClick={onLogout}
        aria-label="Log out"
        title={!isOpen ? "Log out" : undefined}
        data-tooltip="Log out"
      >
        <span className="workspace-sidebar__icon">
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.85"
            viewBox="0 0 24 24"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </span>
        <span className="workspace-sidebar__link-label">Log out</span>
      </button>
    </footer>
  );
}

export default SidebarLogout;

