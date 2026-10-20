export const TASK_PRIORITIES = ["High", "Medium", "Low"];
export const TASK_STATUSES = ["Not started", "In progress", "Waiting", "Done"];

function TaskRow({
  task,
  todayStr,
  showSelection = false,
  isSelected = false,
  showStatus = false,
  onSelectOne,
  onToggleDone,
  onUpdateTask,
  onDeleteTask,
}) {
  const isDone = task.status === "Done" || task.done;
  const isOverdue = Boolean(task.due && task.due < todayStr && !isDone);

  return (
    <tr
      className={`${isDone ? "row-completed" : ""} ${showStatus && isOverdue ? "row-overdue" : ""}`.trim()}
    >
      {showSelection && (
        <td>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectOne(task.id)}
          />
        </td>
      )}
      <td style={!showSelection ? { width: "30px" } : undefined}>
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
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </td>
      {showStatus && (
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
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </td>
      )}
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
      <td style={!showSelection ? { width: "30px" } : undefined}>
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
}

export default TaskRow;
