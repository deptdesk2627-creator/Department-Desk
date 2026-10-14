const workspaceItems = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  {
    id: "transactions",
    label: "Transactions & Requests",
    icon: "transactions",
  },
  { id: "tasks", label: "Task Management", icon: "tasks" },
  { id: "inventory", label: "Supply & Inventory", icon: "inventory" },
];

const systemItems = [
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "help", label: "Help & Support", icon: "help" },
];

function NavigationIcon({ name }) {
  const sharedProps = {
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
  };

  if (name === "dashboard") {
    return (
      <svg {...sharedProps}>
        <path d="M4 19V5M4 19h16" />
        <path d="m7 15 4-4 3 2 5-6" />
        <path d="M16 7h3v3" />
      </svg>
    );
  }

  if (name === "transactions") {
    return (
      <svg {...sharedProps}>
        <path d="M7 3.75h7l4 4v12.5H7z" />
        <path d="M14 3.75v4h4M10 12h5M10 15.5h5" />
      </svg>
    );
  }

  if (name === "tasks") {
    return (
      <svg {...sharedProps}>
        <rect x="4" y="4" width="16" height="16" rx="2.5" />
        <path d="m8 12 2.5 2.5L16 9M8 7.5h8" />
      </svg>
    );
  }

  if (name === "inventory") {
    return (
      <svg {...sharedProps}>
        <path d="m4 7 8-4 8 4v10l-8 4-8-4z" />
        <path d="m4 7 8 4 8-4M12 11v10M8 5l8 4" />
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

function NavigationSection({ label, items, currentPage, isOpen, onNavigate, system }) {
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
            >
              <span className="workspace-sidebar__icon">
                <NavigationIcon name={item.icon} />
              </span>
              <span className="workspace-sidebar__link-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SidebarNavigation({ currentPage, isOpen, onNavigate }) {
  return (
    <>
      <NavigationSection
        label="Workspace"
        items={workspaceItems}
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
