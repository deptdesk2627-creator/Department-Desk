function TaskMetrics({ progressPercent, stats }) {
  return (
    <>
      <div className="deptdesk-card progress-card">
        <div className="progress-header">
          <span>Completion Rate</span>
          <span className="progress-num">{progressPercent}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Open Tasks</span>
          <span className="metric-value">{stats.open}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">High Priority</span>
          <span className="metric-value badge-high">{stats.highPriority}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">In Progress</span>
          <span className="metric-value badge-progress">{stats.inProgress}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Completed</span>
          <span className="metric-value badge-done">{stats.completed}</span>
        </div>
      </div>
    </>
  );
}

export default TaskMetrics;
