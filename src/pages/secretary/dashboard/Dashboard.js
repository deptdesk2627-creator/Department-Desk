import "./Dashboard.css";
import DashboardInventoryPanel from "./components/DashboardInventoryPanel";
import DashboardMetrics from "./components/DashboardMetrics";
import DashboardRecentTable from "./components/DashboardRecentTable";
import DashboardTasksPanel from "./components/DashboardTasksPanel";
import DashboardWelcome from "./components/DashboardWelcome";
import QuickActionsPanel from "./components/QuickActionsPanel";
import { useDashboardData } from "./hooks/useDashboardData";

function Dashboard({
  role,
  userName = "",
  requests = [],
  tasks = [],
  inventory = [],
  search = "",
  onNavigate = () => {
    throw new Error("Dashboard requires an onNavigate callback.");
  },
}) {
  const {
    query,
    greeting,
    formattedDate,
    dateTime,
    metrics,
    recentRequests,
    recentDocuments,
    recentInventory,
    recentTasks,
  } = useDashboardData({ requests, tasks, inventory, search });

  const displayName = userName || role?.name || "Ma'am Aubrey";
  const hasQuery = Boolean(query);

  return (
    <div className="dashboard">
      <div className="dashboard-overview">
        <DashboardWelcome
          greeting={greeting}
          displayName={displayName}
          dateTime={dateTime}
          formattedDate={formattedDate}
        />
        <DashboardMetrics metrics={metrics} />
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-main-column">
          <DashboardRecentTable
            title="Recent Requests"
            titleId="requests-title"
            actionLabel="All requests →"
            tableClassName="requests-table"
            items={recentRequests}
            onNavigate={onNavigate}
            hasQuery={hasQuery}
            emptyQueryMessage="No requests match your search."
            emptyDefaultMessage="No requests yet. Create the first one to get started."
          />

          <DashboardRecentTable
            title="Recent Documents"
            titleId="documents-title"
            actionLabel="All documents →"
            tableClassName="documents-table"
            items={recentDocuments}
            isDocumentMode
            onNavigate={onNavigate}
            hasQuery={hasQuery}
            emptyQueryMessage="No documents match your search."
            emptyDefaultMessage="No documents yet. Add a document transaction to get started."
          />

          <DashboardInventoryPanel
            items={recentInventory}
            hasQuery={hasQuery}
            onNavigate={onNavigate}
          />
        </div>

        <div className="dashboard-side-column">
          <QuickActionsPanel onNavigate={onNavigate} role={role} />
          <DashboardTasksPanel
            tasks={recentTasks}
            hasQuery={hasQuery}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
