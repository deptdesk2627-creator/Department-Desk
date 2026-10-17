import Dashboard from "../secretary/dashboard/Dashboard";
import { getRequestStatus } from "../../utils/requestStatus";

// Dean overview: executive summary strip + dashboard widgets filtered by Dean's permissions.
function DeanDashboard({ role, data, search, navigate }) {
  const requests = Array.isArray(data.requests) ? data.requests : [];
  const inventory = Array.isArray(data.inventory) ? data.inventory : [];
  const totalRequests = requests.length;
  const approvedCount = requests.filter(
    (r) => getRequestStatus(r?.status) === "Approved",
  ).length;
  const actionNeededCount = requests.filter((r) => {
    const status = getRequestStatus(r?.status);
    return status === "Action Needed" || status === "Pending" || status === "Under Review";
  }).length;
  const approvalRate = totalRequests
    ? Math.round((approvedCount / totalRequests) * 100)
    : 0;
  const lowStockItems = inventory.filter(
    (item) => Number(item?.quantity) <= Number(item?.lowStockAt),
  ).length;

  return (
    <div className="dean-executive-wrapper">
      <section
        className="dean-executive-banner"
        aria-label="Executive oversight summary"
      >
        <div className="dean-executive-banner__copy">
          <span className="dean-executive-banner__pill">
            DEAN&apos;S EXECUTIVE BRIEFING
          </span>
          <h2>Departmental Operations &amp; Approval Health</h2>
          <p>
            Real-time read-only oversight of office requests, completion rates, and supply thresholds.
          </p>
        </div>
        <div className="dean-executive-banner__stats">
          <button
            type="button"
            className="dean-stat-chip"
            onClick={() => navigate("transactions")}
          >
            <span className="dean-stat-chip__label">Approval Rate</span>
            <strong>{approvalRate}%</strong>
            <span className="dean-stat-chip__meta">
              {approvedCount} of {totalRequests} approved
            </span>
          </button>
          <button
            type="button"
            className="dean-stat-chip"
            onClick={() => navigate("transactions")}
          >
            <span className="dean-stat-chip__label">In Queue / Review</span>
            <strong>{actionNeededCount}</strong>
            <span className="dean-stat-chip__meta">Active requests</span>
          </button>
          <button
            type="button"
            className="dean-stat-chip"
            onClick={() => navigate("inventory")}
          >
            <span className="dean-stat-chip__label">Supply Alerts</span>
            <strong>{lowStockItems}</strong>
            <span className="dean-stat-chip__meta">Low-stock items</span>
          </button>
        </div>
      </section>
      <Dashboard
        role={role}
        userName={role.name}
        requests={data.requests}
        tasks={data.tasks}
        inventory={data.inventory}
        search={search}
        onNavigate={navigate}
      />
    </div>
  );
}

export default DeanDashboard;
