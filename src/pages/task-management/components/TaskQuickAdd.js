import "./TaskQuickAdd.css";
import { Modal } from "../../../components/ui";
import { TASK_PRIORITIES, TASK_STATUSES } from "./TaskRow";

function TaskQuickAdd({
  isOpen = false,
  onClose,
  form,
  setForm,
  onSubmit,
  taskSearch = "",
  setTaskSearch = () => {},
  statusFilter = "All",
  setStatusFilter = () => {},
  priorityFilter = "All",
  setPriorityFilter = () => {},
  dueFilter = "All",
  setDueFilter = () => {},
  hasActiveFilters = false,
  onResetFilters = () => {},
  selectedCount = 0,
  onBulkComplete,
  onBulkDelete,
}) {
  return (
    <>
      <div
        className="deptdesk-card add-and-filter-card"
        role="region"
        aria-label="Task filters"
      >
        <div className="task-filter-controls">
          <label className="task-search-box">
            <span className="task-search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              value={taskSearch}
              onChange={(event) => setTaskSearch(event.target.value)}
              placeholder="Search tasks by title, priority, or status..."
              aria-label="Search tasks"
            />
          </label>
          <div className="task-filter-selects">
            <select
              className="task-filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All statuses</option>
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              className="task-filter-select"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              aria-label="Filter by priority"
            >
              <option value="All">All priorities</option>
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            <select
              className="task-filter-select"
              value={dueFilter}
              onChange={(event) => setDueFilter(event.target.value)}
              aria-label="Filter by due date"
            >
              <option value="All">All due dates</option>
              <option value="Overdue">Overdue</option>
              <option value="Due today">Due today</option>
              <option value="Upcoming">Upcoming</option>
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                className="task-filter-reset-btn"
                onClick={onResetFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        {selectedCount > 0 && (
          <div className="bulk-actions-group">
            <span className="selected-count">{selectedCount} selected</span>
            <button
              className="btn-secondary"
              type="button"
              onClick={onBulkComplete}
            >
              ✓ Mark Done
            </button>
            <button
              className="btn-danger"
              type="button"
              onClick={onBulkDelete}
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        eyebrow="OFFICE WORKSPACE · TASK MANAGEMENT"
        title="Add a new task"
        subtitle="Set the task title, priority, status, and due date."
        titleId="new-task-dialog-title"
        className="transaction-modal form-modal"
      >
        <form className="module-form task-modal-form" onSubmit={onSubmit}>
          <label className="task-form-title">
            Task title
            <input
              autoFocus
              type="text"
              placeholder="e.g. Prepare semester report"
              value={form.title || ""}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              required
            />
          </label>
          <label>
            Priority
            <select
              value={form.priority}
              onChange={(event) =>
                setForm({ ...form, priority: event.target.value })
              }
            >
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={form.status || "Not started"}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value })
              }
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="task-form-due">
            Due date
            <input
              type="date"
              value={form.due}
              onChange={(event) =>
                setForm({ ...form, due: event.target.value })
              }
            />
          </label>
          <div className="task-form-actions">
            {onClose && (
              <button
                className="secondary-button"
                type="button"
                onClick={onClose}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="primary-button">
              ＋ Add task
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default TaskQuickAdd;
