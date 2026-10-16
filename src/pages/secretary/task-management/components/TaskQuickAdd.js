import "./TaskQuickAdd.css";

const priorities = ["High", "Medium", "Low"];

function TaskQuickAdd({
  form,
  setForm,
  onSubmit,
  selectedCount,
  onBulkComplete,
  onBulkDelete,
}) {
  return (
    <div className="deptdesk-card add-and-filter-card">
      <form className="quick-add-form" onSubmit={onSubmit}>
        <input
          type="text"
          className="input-field title-input"
          placeholder="+ Add a task to this list..."
          value={form.title || ""}
          onChange={(event) =>
            setForm({ ...form, title: event.target.value })
          }
          required
        />
        <select
          className="input-field"
          value={form.priority}
          onChange={(event) =>
            setForm({ ...form, priority: event.target.value })
          }
        >
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="input-field date-input"
          value={form.due}
          onChange={(event) => setForm({ ...form, due: event.target.value })}
        />
        <button type="submit" className="btn-primary">
          + Add Task
        </button>
      </form>
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
  );
}

export default TaskQuickAdd;
