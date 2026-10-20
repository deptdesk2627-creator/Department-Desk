import "./TaskMetrics.css";
import { MetricCard } from "../../../components/ui";

const METRIC_ITEMS = [
  { key: "open", label: "Open Tasks" },
  { key: "highPriority", label: "High Priority" },
  { key: "inProgress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

function TaskMetrics({ progressPercent, stats }) {
  return (
    <>
      <div className="deptdesk-card progress-card">
        <div className="progress-header">
          <span>Completion Rate</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <div className="metrics-grid task-metrics-grid">
        {METRIC_ITEMS.map(({ key, label }) => (
          <MetricCard key={key} label={label} value={stats[key]} />
        ))}
      </div>
    </>
  );
}

export default TaskMetrics;
