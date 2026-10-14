const priorities = ["High", "Medium", "Low"];
const statuses = ["Not started", "In progress", "Waiting", "Done"];

function TaskStatusView({ tasks, todayStr, onToggleDone, onUpdateTask, onDeleteTask }) {
  return (
    <div className="status-groups-container">
      {statuses.map((statusName) => {
        const groupTasks = tasks.filter(
          (task) => (task.status || "Not started") === statusName,
        );
        return (
          <div key={statusName} className="deptdesk-card status-group-card">
            <div className="status-group-header">
              <span className={`deptdesk-badge status-${statusName.toLowerCase().replace(/\s+/g, "-")}`}>
                {statusName}
              </span>
              <span className="count-pill">{groupTasks.length} tasks</span>
            </div>
            <table className="deptdesk-table">
              <tbody>
                {groupTasks.map((task) => {
                  const isDone = task.status === "Done" || task.done;
                  const isOverdue = task.due && task.due < todayStr && !isDone;
                  return (
                    <tr key={task.id} className={isDone ? "row-completed" : ""}>
                      <td style={{ width: "30px" }}>
                        <input
                          type="checkbox"
                          className="deptdesk-checkbox"
                          checked={isDone}
                          onChange={() => onToggleDone(task)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="inline-text-edit"
                          value={task.title || ""}
                          onChange={(event) =>
                            onUpdateTask(task.id, { title: event.target.value })
                          }
                        />
                      </td>
                      <td>
                        <select
                          className={`deptdesk-badge priority-${(task.priority || "medium").toLowerCase()}`}
                          value={task.priority || "Medium"}
                          onChange={(event) =>
                            onUpdateTask(task.id, {
                              priority: event.target.value,
                            })
                          }
                        >
                          {priorities.map((priority) => (
                            <option key={priority} value={priority}>{priority}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="date"
                          className="inline-date-edit"
                          value={task.due || ""}
                          onChange={(event) =>
                            onUpdateTask(task.id, { due: event.target.value })
                          }
                        />
                        {isOverdue && <span className="overdue-tag">Overdue</span>}
                      </td>
                      <td style={{ width: "30px" }}>
                        <button
                          className="btn-icon-delete"
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          aria-label={`Delete ${task.title || "task"}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
