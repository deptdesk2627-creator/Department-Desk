import "./SidebarNavigation.css";

const workspaceItems = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  {
    id: "transactions",
    label: "Transactions & Requests",
    icon: "transactions",
  },
  { id: "tasks", label: "Task Management", icon: "tasks" },
  { id: "inventory", label: "Supply & Inventory", icon: "inventory" },
  { id: "staff-inventory", label: "Office Supplies", icon: "inventory" },
];

const systemItems = [
  { id: "profile", label: "Profile", icon: "profile" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "help", label: "Help & FAQ", icon: "help" },
];

function NavigationIcon({ name }) {
  const sharedProps = {
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.85,
    viewBox: "0 0 24 24",
  };

  if (name === "dashboard") {
    return (
      <svg {...sharedProps}>
        <path d="M4.5 10.2 12 4l7.5 6.2V19a1.8 1.8 0 0 1-1.8 1.8H6.3A1.8 1.8 0 0 1 4.5 19v-8.8Z" />
        <path d="M9.5 20.8v-5.3a2.5 2.5 0 0 1 5 0v5.3" />
      </svg>
    );
  }

  if (name === "transactions") {
    return (
      <svg {...sharedProps}>
        <path d="M6.5 3.75h7.5l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 19V5.25a1.5 1.5 0 0 1 1.5-1.5Z" />
        <path d="M13.5 3.75v4.25H18M9 12h6M9 15.5h4.5" />
      </svg>
    );
  }

  if (name === "tasks") {
    return (
      <svg {...sharedProps}>
        <rect x="4" y="4.5" width="16" height="15.5" rx="3" />
        <path d="M8 3v3M16 3v3M4 9h16" />
        <path d="m9.2 14.2 2 2 3.8-3.8" />
      </svg>
    );
  }

  if (name === "inventory") {
    return (
      <svg {...sharedProps}>
        <path d="M11 4.2a8 8 0 1 0 8.8 8.8H11V4.2Z" />
        <path d="M14.5 3.5A8 8 0 0 1 20.5 9.5h-6v-6Z" />
      </svg>
    );
  }

  if (name === "profile") {
    return (
      <svg {...sharedProps}>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg {...sharedProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 1 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 1 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V4a1.7 1.7 0 1 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 1 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2.9Z" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.7 9a2.4 2.4 0 1 1 4.2 1.6c-1.1 1.1-1.9 1.4-1.9 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function NavigationSection({
  label,
  items,
  currentPage,
  isOpen,
  onNavigate,
  system,
}) {
  const sectionClassName = system
    ? "workspace-sidebar__navigation workspace-sidebar__system"
    : "workspace-sidebar__navigation";

  return (
    <nav className={sectionClassName} aria-label={label}>
      <p className="workspace-sidebar__label">{label}</p>
      <ul className="workspace-sidebar__list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              className="workspace-sidebar__link"
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={currentPage === item.id ? "page" : undefined}
              aria-label={item.label}
              title={!isOpen ? item.label : undefined}
              data-tooltip={item.label}
            >
              <span className="workspace-sidebar__icon">
                <NavigationIcon name={item.icon} />
              </span>
              <span className="workspace-sidebar__link-label">
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SidebarNavigation({ currentPage, isOpen, onNavigate, allowedPages }) {
  const visibleItems = Array.isArray(allowedPages)
    ? workspaceItems.filter((item) => allowedPages.includes(item.id))
    : workspaceItems;

  return (
    <>
      <NavigationSection
        label="Workspace"
        items={visibleItems}
        currentPage={currentPage}
        isOpen={isOpen}
        onNavigate={onNavigate}
      />
      <NavigationSection
        label="System"
        items={systemItems}
        currentPage={currentPage}
        isOpen={isOpen}
        onNavigate={onNavigate}
        system
      />
    </>
  );
}

export default SidebarNavigation;
