import "./styles/Dashboard.css";
import {
  getRequestStatus,
  isRequestOpen,
  isRequestWaiting,
} from "../../utils/requestStatus";

function Dashboard({
  requests = [],
  tasks = [],
  inventory = [],
  search = "",
  onNavigate = () => {
    throw new Error("Dashboard requires an onNavigate callback.");
  },
}) {
  const requestItems = Array.isArray(requests) ? requests.filter(Boolean) : [];
  const taskItems = Array.isArray(tasks) ? tasks.filter(Boolean) : [];
  const inventoryItems = Array.isArray(inventory)
    ? inventory.filter(Boolean)
    : [];
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : "Good evening";
  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const query = String(search || "")
    .trim()
    .toLowerCase();
  const matchesSearch = (...values) =>
    !query ||
    values.some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(query),
    );
  const filteredRequests = requestItems.filter((request) =>
    matchesSearch(
      request.student,
      request.document,
      request.description,
      request.notes,
      request.id,
      request.office || request.location,
      request.category || request.type,
      getRequestStatus(request.status),
      request.dateTime,
    ),
  );
  const filteredTasks = taskItems.filter((task) =>
    matchesSearch(
      task.title,
      task.category,
      task.priority,
      task.status,
      task.due,
      task.assignee,
      task.id,
      task.done ? "done" : "open",
    ),
  );
  const filteredInventory = inventoryItems.filter((item) =>
    matchesSearch(
      item.name,
      item.productId,
      item.id,
      item.unit,
      item.quantity,
      item.lowStockAt,
    ),
  );
  const openDocuments = requestItems.filter(
    (request) =>
      (request.type || request.category) === "Document" &&
      isRequestOpen(request.status),
  ).length;
  const waitingRequests = requestItems.filter((request) =>
    isRequestWaiting(request.status),
  ).length;
  const openTasks = taskItems.filter((task) => !task.done).length;
  const lowStockItems = inventoryItems.filter(
    (item) =>
      Number.isFinite(Number(item.quantity)) &&
      Number(item.quantity) <= Number(item.lowStockAt || 0),
  ).length;
  const recentRequests = filteredRequests.slice(0, 4);
  const recentDocuments = filteredRequests
    .filter((request) => request.type === "Document")
    .slice(0, 4);
  const recentTasks = filteredTasks.slice(0, 5);

  return (
    <div className="dashboard">
      <div className="dashboard-overview">
        <section className="dashboard-welcome" aria-label="Dashboard welcome">
          <div className="dashboard-welcome-copy">
            <h1>
              {greeting}, Cha Gamay{" "}
              <svg
                className="welcome-sparkle"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="m12 2 1.8 7.1L21 11l-7.2 1.9L12 20l-1.8-7.1L3 11l7.2-1.9L12 2Z" />
                <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
              </svg>
            </h1>
            <p>Here’s what’s happening in your department today.</p>
          </div>
          <div className="dashboard-date-badge">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
            <time dateTime={dateTime}>{formattedDate}</time>
          </div>
        </section>
        <section className="metrics-grid" aria-label="Office summary">
          <article className="card metric-card">
            <div className="metric-top">
              <span>Open documents</span>
              <span className="metric-icon">▤</span>
            </div>
            <p className="metric-value">{openDocuments}</p>
            <p className="metric-foot">Documents being tracked</p>
          </article>
          <article className="card metric-card">
            <div className="metric-top">
              <span>Waiting for action</span>
              <span className="metric-icon orange">◷</span>
            </div>
            <p className="metric-value">{waitingRequests}</p>
            <p className="metric-foot">
              Requests waiting on a person or office
            </p>
          </article>
          <article className="card metric-card">
            <div className="metric-top">
              <span>Open tasks</span>
              <span className="metric-icon green">✓</span>
            </div>
            <p className="metric-value">{openTasks}</p>
            <p className="metric-foot">Assigned to your workspace</p>
          </article>
          <article className="card metric-card">
            <div className="metric-top">
              <span>Low-stock supplies</span>
              <span className="metric-icon orange">!</span>
            </div>
            <p className="metric-value">{lowStockItems}</p>
            <p className="metric-foot">Items at or below their reorder level</p>
          </article>
        </section>
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-main-column">
          <section
            className="card panel recent-module"
            aria-labelledby="requests-title"
          >
            <div className="panel-heading">
              <h2 id="requests-title">Recent Requests</h2>
              <button
                className="text-button"
                type="button"
                onClick={() => onNavigate("transactions")}
              >
                All requests →
              </button>
            </div>
            {recentRequests.length > 0 ? (
              <div className="table-scroll">
                <table className="request-table requests-table">
                  <thead>
                    <tr>
                      <th>Requested by</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <strong>{request.student}</strong>
                          <span>{request.id}</span>
                        </td>
                        <td>{request.description || request.document}</td>
                        <td>
                          <span
                            className={`status-pill status-${getRequestStatus(request.status).toLowerCase().replaceAll(" ", "-")}`}
                          >
                            {getRequestStatus(request.status)}
                          </span>
                        </td>
                        <td>{request.office || request.location || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">
                {query
                  ? "No requests match your search."
                  : "No requests yet. Create the first one to get started."}
              </p>
            )}
          </section>

          <section
            className="card panel recent-module"
            aria-labelledby="documents-title"
          >
            <div className="panel-heading">
              <h2 id="documents-title">Recent Documents</h2>
              <button
                className="text-button"
                type="button"
                onClick={() => onNavigate("transactions")}
              >
                All documents →
              </button>
            </div>
            {recentDocuments.length > 0 ? (
              <div className="table-scroll">
                <table className="request-table documents-table">
                  <thead>
                    <tr>
                      <th>Document name</th>
                      <th>Requested by</th>
                      <th>Status</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocuments.map((document) => (
                      <tr key={document.id}>
                        <td>
                          <strong>{document.document}</strong>
                          <span>{document.id}</span>
                        </td>
                        <td>{document.student}</td>
                        <td>
                          <span
                            className={`status-pill status-${getRequestStatus(document.status).toLowerCase().replaceAll(" ", "-")}`}
                          >
                            {getRequestStatus(document.status)}
                          </span>
                        </td>
                        <td>{document.office || document.location || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">
                {query
                  ? "No documents match your search."
                  : "No documents yet. Add a document transaction to get started."}
              </p>
            )}
          </section>

          <section
            className="card panel inventory-panel"
            aria-labelledby="inventory-title"
          >
            <div className="panel-heading">
              <h2 id="inventory-title">Supply &amp; Inventory</h2>
              <button
                className="text-button"
                type="button"
                onClick={() => onNavigate("inventory")}
              >
                Manage inventory →
              </button>
            </div>
            {filteredInventory.length > 0 ? (
              <div className="inventory-summary">
                {filteredInventory.slice(0, 4).map((item) => {
                  const isLow =
                    Number(item.quantity) <= Number(item.lowStockAt || 0);
                  return (
                    <article className="supply-item" key={item.id}>
                      <span
                        className={`supply-icon${isLow ? " supply-icon-low" : ""}`}
                        aria-hidden="true"
                      >
                        ▤
                      </span>
                      <div className="supply-details">
                        <h3>{item.name}</h3>
                        <p>
                          {item.quantity} {item.unit} on hand
                        </p>
                      </div>
                      <span
                        className={`supply-status${isLow ? " supply-status-low" : ""}`}
                      >
                        {isLow ? "Low stock" : "In stock"}
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="empty-state">
                {query
                  ? "No inventory items match your search."
                  : "No inventory items yet. Add supplies to start tracking stock."}
              </p>
            )}
          </section>
        </div>

        <div className="dashboard-side-column">
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
              <button
                className="quick-action"
                type="button"
                onClick={() => onNavigate("transactions")}
              >
                <span
                  className="quick-action-icon quick-action-document"
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
                    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <path d="M14 3v6h6M8 13h8M8 17h8" />
                  </svg>
                </span>
                <span className="quick-action-label">Create Document</span>
                <span className="quick-action-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </span>
              </button>
              <button
                className="quick-action"
                type="button"
                onClick={() => onNavigate("inventory")}
              >
                <span
                  className="quick-action-icon quick-action-inventory"
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
                    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
                    <path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" />
                  </svg>
                </span>
                <span className="quick-action-label">Update Inventory</span>
                <span className="quick-action-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </span>
              </button>
              <button
                className="quick-action"
                type="button"
                onClick={() => onNavigate("transactions")}
              >
                <span
                  className="quick-action-icon quick-action-request"
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
                    <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                    <path d="M3 10h18" />
                  </svg>
                </span>
                <span className="quick-action-label">Process Request</span>
                <span className="quick-action-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </span>
              </button>
              <button
                className="quick-action"
                type="button"
                onClick={() => onNavigate("tasks")}
              >
                <span
                  className="quick-action-icon quick-action-task"
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
                    <rect x="4" y="4" width="16" height="17" rx="2" />
                    <path d="m8 10 2 2 5-5M8 16h8" />
                  </svg>
                </span>
                <span className="quick-action-label">Add To-Do List</span>
                <span className="quick-action-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </span>
              </button>
            </div>
          </section>

          <section
            className="card panel team-tasks-panel"
            aria-labelledby="tasks-title"
          >
            <div className="panel-heading">
              <h2 id="tasks-title">Tasks Management</h2>
              <button
                className="text-button"
                type="button"
                onClick={() => onNavigate("tasks")}
              >
                All tasks →
              </button>
            </div>
            {recentTasks.length > 0 ? (
              <div className="office-task-list">
                {recentTasks.map((task) => {
                  const status = task.done
                    ? "Done"
                    : task.status || "Not started";
                  return (
                    <article className="office-task" key={task.id}>
                      <div className="office-task-content">
                        <h3>{task.title}</h3>
                        <p>
                          {task.category} · {task.assignee}
                        </p>
                      </div>
                      <span
                        className={`status-pill status-${String(
                          status || "Not started",
                        )
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        {status}
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="empty-state">
                {query
                  ? "No tasks match your search."
                  : "No tasks yet. Add a task to get started."}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
