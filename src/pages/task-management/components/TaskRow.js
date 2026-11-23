import { useEffect, useState } from "react";

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
  const [titleDraft, setTitleDraft] = useState(task.title || "");
  const isDone = task.status === "Done" || task.done;
  const isOverdue = Boolean(task.due && task.due < todayStr && !isDone);
  const taskLabel = task.title?.trim() || "untitled task";

  useEffect(() => {
    setTitleDraft(task.title || "");
  }, [task.title]);

  function commitTitle() {
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setTitleDraft(task.title || "");
      return;
    }
    if (trimmed !== (task.title || "")) {
      onUpdateTask(task.id, { title: trimmed });
    }
  }

  return (
    <tr
      className={`${isDone ? "row-completed" : ""} ${showStatus && isOverdue ? "row-overdue" : ""}`.trim()}
    >
      {showSelection && (
        <td data-label="Select">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectOne(task.id)}
            aria-label={`Select ${taskLabel}`}
          />
        </td>
      )}
      <td
        data-label="Done"
        style={!showSelection ? { width: "30px" } : undefined}
      >
        <input
          type="checkbox"
          className="deptdesk-checkbox"
          checked={isDone}
          onChange={() => onToggleDone(task)}
          aria-label={`Mark ${taskLabel} as ${isDone ? "not done" : "done"}`}
        />
      </td>
      <td className="mobile-card-primary" data-label="Task Title">
        <input
          type="text"
          className="inline-text-edit"
          value={titleDraft}
          placeholder="Task title"
          aria-label={`Task title for ${taskLabel}`}
          onChange={(event) => setTitleDraft(event.target.value)}
          onBlur={commitTitle}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            } else if (event.key === "Escape") {
              setTitleDraft(task.title || "");
              event.currentTarget.blur();
            }
          }}
        />
      </td>
      <td data-label="Priority">
        <select
          className={`deptdesk-badge priority-${(task.priority || "medium").toLowerCase()}`}
          value={task.priority || "Medium"}
          aria-label={`Priority for ${taskLabel}`}
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
        <td data-label="Status">
          <select
            className={`deptdesk-badge status-${(task.status || "not started").toLowerCase().replace(/\s+/g, "-")}`}
            value={task.status || "Not started"}
            aria-label={`Status for ${taskLabel}`}
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
      <td data-label="Due Date">
        <div className="due-date-wrapper">
          <input
            type="date"
            className="inline-date-edit"
            value={task.due || ""}
            aria-label={`Due date for ${taskLabel}`}
            onChange={(event) =>
              onUpdateTask(task.id, { due: event.target.value })
            }
          />
          {isOverdue && <span className="overdue-tag">Overdue</span>}
        </div>
      </td>
      <td
        className="mobile-card-actions"
        data-label="Actions"
        style={!showSelection ? { width: "30px" } : undefined}
      >
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
