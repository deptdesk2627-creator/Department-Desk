import "./TaskViews.css";

const priorities = ["High", "Medium", "Low"];
const statuses = ["Not started", "In progress", "Waiting", "Done"];

function TaskTableView({
  tasks,
  selectedTaskIds,
  todayStr,
  onSelectAll,
  onSelectOne,
  onToggleDone,
  onUpdateTask,
  onDeleteTask,
}) {
  return (
    <div className="deptdesk-card table-card">
      <table className="deptdesk-table">
        <thead>
          <tr>
            <th style={{ width: "30px" }}>
              <input
                type="checkbox"
                checked={
                  tasks.length > 0 && selectedTaskIds.length === tasks.length
                }
                onChange={onSelectAll}
              />
            </th>
            <th style={{ width: "30px" }}>Done</th>
            <th>Task Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
            <th style={{ width: "40px" }}></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const isDone = task.status === "Done" || task.done;
            const isOverdue = task.due && task.due < todayStr && !isDone;
            return (
              <tr
                key={task.id}
                className={`${isDone ? "row-completed" : ""} ${isOverdue ? "row-overdue" : ""}`}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.includes(task.id)}
                    onChange={() => onSelectOne(task.id)}
                  />
                </td>
                <td className="text-center">
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
                      onUpdateTask(task.id, { priority: event.target.value })
                    }
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className={`deptdesk-badge status-${(task.status || "not started").toLowerCase().replace(/\s+/g, "-")}`}
                    value={task.status || "Not started"}
                    onChange={(event) =>
                      onUpdateTask(task.id, {
                        status: event.target.value,
                        done: event.target.value === "Done",
                      })
                    }
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="due-date-wrapper">
                    <input
                      type="date"
                      className="inline-date-edit"
                      value={task.due || ""}
                      onChange={(event) =>
                        onUpdateTask(task.id, { due: event.target.value })
                      }
                    />
                    {isOverdue && <span className="overdue-tag">Overdue</span>}
                  </div>
                </td>
                <td>
                  <button
                    className="btn-icon-delete"
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    title="Delete Task"
                    aria-label={`Delete ${task.title || "task"}`}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
          {!tasks.length && (
            <tr>
              <td colSpan="7" className="empty-state">
                No tasks in this list. Click above to add a new task!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TaskTableView;
