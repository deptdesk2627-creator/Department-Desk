import "./QuickActionsPanel.css";

const ACTION_ICONS = {
  document: (
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M8 13h8M8 17h8" />
    </>
  ),
  inventory: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" />
    </>
  ),
  request: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M3 10h18" />
    </>
  ),
  task: (
    <>
      <rect x="4" y="4" width="16" height="17" rx="2" />
      <path d="m8 10 2 2 5-5M8 16h8" />
    </>
  ),
};

const QUICK_ACTIONS = [
  {
    label: "Create Document",
    targetPage: "transactions",
    permission: "createRequests",
    iconClass: "quick-action-document",
    svg: ACTION_ICONS.document,
  },
  {
    label: "Update Inventory",
    targetPage: "inventory",
    permission: "manageInventory",
    iconClass: "quick-action-inventory",
    svg: ACTION_ICONS.inventory,
  },
  {
    label: "Process Request",
    targetPage: "transactions",
    permission: "editDocuments",
    iconClass: "quick-action-request",
    svg: ACTION_ICONS.request,
  },
  {
    label: "Add To-Do List",
    targetPage: "tasks",
    permission: "createTasks",
    iconClass: "quick-action-task",
    svg: ACTION_ICONS.task,
  },
];

const DEAN_QUICK_ACTIONS = [
  {
    label: "Review Requests & Documents",
    targetPage: "transactions",
    iconClass: "quick-action-document",
    svg: ACTION_ICONS.document,
  },
  {
    label: "Inspect Supply & Inventory",
    targetPage: "inventory",
    iconClass: "quick-action-inventory",
    svg: ACTION_ICONS.inventory,
  },
  {
    label: "Add To-Do List",
    targetPage: "tasks",
    iconClass: "quick-action-task",
    svg: ACTION_ICONS.task,
  },
];

function QuickActionsPanel({ onNavigate, role }) {
  // Without a role (e.g. in tests), show every action; for Dean, show executive actions.
  const actions =
    role?.id === "dean"
      ? DEAN_QUICK_ACTIONS
      : role?.can
        ? QUICK_ACTIONS.filter((action) => role.can[action.permission])
        : QUICK_ACTIONS;

  if (!actions.length) return null;

  return (
    <section
      className="card panel quick-actions-panel"
      aria-labelledby="quick-actions-title"
    >
      <div className="panel-heading quick-actions-heading">
        <div>
          <h2 id="quick-actions-title">Quick Actions</h2>
          <p>Shortcut actions for common tasks</p>
        </div>
      </div>
      <div className="quick-actions-list">
        {actions.map((action) => (
          <button
            key={action.label}
            className="quick-action"
            type="button"
            onClick={() => onNavigate(action.targetPage)}
          >
            <span
              className={`quick-action-icon ${action.iconClass}`}
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {action.svg}
              </svg>
            </span>
            <span className="quick-action-label">{action.label}</span>
            <span className="quick-action-arrow" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickActionsPanel;
