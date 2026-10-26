import "./TaskViews.css";
import TaskRow, { TASK_STATUSES } from "./TaskRow";

function TaskStatusView({
  tasks,
  statusFilter = "All",
  todayStr,
  onToggleDone,
  onUpdateTask,
  onDeleteTask,
}) {
  const visibleStatuses =
    statusFilter && statusFilter !== "All"
      ? TASK_STATUSES.filter((statusName) => statusName === statusFilter)
      : TASK_STATUSES;

  return (
    <div className="status-groups-container">
      {visibleStatuses.map((statusName) => {
        const groupTasks = tasks.filter((task) => {
          const effectiveStatus =
            task.status === "Done" || task.done
              ? "Done"
              : task.status || "Not started";
          return effectiveStatus === statusName;
        });
        return (
          <div key={statusName} className="deptdesk-card status-group-card">
            <div className="status-group-header">
              <span
                className={`deptdesk-badge status-${statusName.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {statusName}
              </span>
              <span className="count-pill">{groupTasks.length} tasks</span>
            </div>
            <table className="deptdesk-table">
              <tbody>
                {groupTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    todayStr={todayStr}
                    onToggleDone={onToggleDone}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                  />
                ))}
                {!groupTasks.length && (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      No tasks in this status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export default TaskStatusView;
