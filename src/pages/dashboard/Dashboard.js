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
    recentOutgoing,
    recentIncoming,
    recentInventory,
    recentTasks,
  } = useDashboardData({ requests, tasks, inventory, search });
  const hasQuery = Boolean(query);
  const canCreateRequests = role ? Boolean(role.can?.createRequests) : true;
  const canManageInventory = role ? Boolean(role.can?.manageInventory) : true;

  return (
    <div className="dashboard">
      <div className="dashboard-overview">
        <DashboardWelcome
          greeting={greeting}
          dateTime={dateTime}
          formattedDate={formattedDate}
          role={role}
        />
        <DashboardMetrics metrics={metrics} />
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-main-column">
          <DashboardRecentTable
            title="Outgoing Requests"
            titleId="outgoing-requests-title"
            actionLabel="All outgoing →"
            tableClassName="requests-table"
            items={recentOutgoing}
            onNavigate={onNavigate}
            hasQuery={hasQuery}
            emptyQueryMessage="No outgoing requests match your search."
            emptyDefaultMessage={
              canCreateRequests
                ? "No outgoing requests yet. Create the first one to get started."
                : "No outgoing requests are currently logged in the tracker."
            }
          />

          <DashboardRecentTable
            title="Incoming Documents & Requests"
            titleId="incoming-requests-title"
            actionLabel="All incoming →"
            tableClassName="documents-table"
            items={recentIncoming}
            isIncomingMode
            onNavigate={onNavigate}
            hasQuery={hasQuery}
            emptyQueryMessage="No incoming documents match your search."
            emptyDefaultMessage={
              canCreateRequests
                ? "No incoming documents yet. Log an incoming document from another office to get started."
                : "No incoming office documents are currently being tracked."
            }
          />

          <DashboardInventoryPanel
            items={recentInventory}
            hasQuery={hasQuery}
            onNavigate={onNavigate}
            readOnly={!canManageInventory}
          />

          <DashboardTasksPanel
            tasks={recentTasks}
            hasQuery={hasQuery}
            onNavigate={onNavigate}
          />
        </div>

        <div className="dashboard-side-column">
          <QuickActionsPanel onNavigate={onNavigate} role={role} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
