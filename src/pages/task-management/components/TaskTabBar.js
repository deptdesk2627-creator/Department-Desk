import "./TaskTabBar.css";

function TaskIcon({ name }) {
  const props = {
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
  };

  if (name === "table") {
    return (
      <svg {...props}>
        <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
        <path d="M3.5 9.5h17M9 9.5v10M15 9.5v10" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M8 5h12M8 12h12M8 19h12" />
      <circle cx="4" cy="5" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="19" r="1" />
    </svg>
  );
}

function TaskTabBar({ view, setView, onOpenAddTask }) {
  return (
    <div className="deptdesk-header">
      <div>
        <h2>Task Management</h2>
        <p className="subtitle">
          Track and organize tasks by status and priority.
        </p>
      </div>
      <div className="deptdesk-header-actions">
        <div className="view-toggle-buttons">
          <button
            className={`toggle-btn ${view === "table" ? "active" : ""}`}
            type="button"
            onClick={() => setView("table")}
          >
            <TaskIcon name="table" />
            Table View
          </button>
          <button
            className={`toggle-btn ${view === "status" ? "active" : ""}`}
            type="button"
            onClick={() => setView("status")}
          >
            <TaskIcon name="status" />
            By Status
          </button>
        </div>
        {onOpenAddTask && (
          <button
            type="button"
            className="primary-button"
            aria-haspopup="dialog"
            onClick={onOpenAddTask}
          >
            ＋ Add task
          </button>
        )}
      </div>
    </div>
  );
}

export default TaskTabBar;
