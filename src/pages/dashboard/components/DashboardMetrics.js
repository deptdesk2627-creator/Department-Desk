import { MetricCard } from "../../../components/ui";

function DashboardMetrics({ metrics }) {
  return (
    <section className="metrics-grid" aria-label="Office summary">
      <MetricCard
        label="Open documents"
        icon="▤"
        value={metrics.openDocuments}
        footer="Documents being tracked"
      />
      <MetricCard
        label="Waiting for action"
        icon="◷"
        iconVariant="orange"
        value={metrics.waitingRequests}
        footer="Awaiting review or action"
      />
      <MetricCard
        label="Open tasks"
        icon="✓"
        iconVariant="green"
        value={metrics.openTasks}
        footer="Assigned to your workspace"
      />
      <MetricCard
        label="Low-stock supplies"
        icon="!"
        iconVariant="orange"
        value={metrics.lowStockItems}
        footer="At or below reorder level"
      />
    </section>
  );
}

export default DashboardMetrics;
