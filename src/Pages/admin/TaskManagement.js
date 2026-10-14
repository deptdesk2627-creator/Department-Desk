import { useEffect, useMemo, useState } from "react";
import "./styles/TaskManagement.css";

const priorities = ["High", "Medium", "Low"];
const statuses = ["Not started", "In progress", "Waiting", "Done"];
const DEFAULT_LISTS = [
  { id: "main", name: "Main To-Do List" },
  { id: "urgent", name: "Urgent & Priority" },
];

function TaskManagementIcon({ name }) {
  const sharedProps = {
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
  };

  if (name === "table") {
    return (
      <svg {...sharedProps}>
        <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
        <path d="M3.5 9.5h17M9 9.5v10M15 9.5v10" />
      </svg>
    );
  }

  if (name === "status") {
    return (
      <svg {...sharedProps}>
        <path d="M8 5h12M8 12h12M8 19h12" />
        <circle cx="4" cy="5" r="1" />
        <circle cx="4" cy="12" r="1" />
        <circle cx="4" cy="19" r="1" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <path d="M7 4.5h10M7 8.5h10M7 12.5h10M7 16.5h7" />
      <rect x="4" y="2.5" width="16" height="19" rx="2" />
    </svg>
  );
}

function readStoredLists() {
  try {
    const storedLists = window.localStorage.getItem("officeflow.todo-lists");
    if (storedLists === null) return DEFAULT_LISTS;

    const parsedLists = JSON.parse(storedLists);
    if (
      !Array.isArray(parsedLists) ||
      parsedLists.length === 0 ||
      !parsedLists.every(
        (list) =>
          list && typeof list.id === "string" && typeof list.name === "string",
      )
    ) {
      console.error("Saved to-do lists are invalid; using the default lists.");
      return DEFAULT_LISTS;
    }

    return parsedLists;
  } catch (error) {
    console.error("Could not read saved to-do lists.", error);
    return DEFAULT_LISTS;
  }
}

export function TaskManagement({
  tasks = [],
  setTasks = () => {
    throw new Error("TaskManagement requires a setTasks callback.");
  },
  search = "",
}) {
  // Page / List Management State
  const [lists, setLists] = useState(() => readStoredLists());
  const [activeListId, setActiveListId] = useState(() => {
    try {
      return window.localStorage.getItem("officeflow.active-list-id") || "main";
    } catch (error) {
      console.error("Could not read the active to-do list.", error);
      return "main";
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "officeflow.todo-lists",
        JSON.stringify(lists),
      );
    } catch (error) {
      console.error("Could not save to-do lists.", error);
    }
  }, [lists]);

  useEffect(() => {
    if (!lists.some((list) => list.id === activeListId)) {
      setActiveListId(lists[0]?.id || "main");
      return;
    }

    try {
      window.localStorage.setItem("officeflow.active-list-id", activeListId);
    } catch (error) {
      console.error("Could not save the active to-do list.", error);
    }
  }, [activeListId, lists]);

  // View Mode: 'table' | 'status'
  const [view, setView] = useState("table");
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  // Form State
  const [form, setForm] = useState({
    title: "",
    priority: "Medium",
    status: "Not started",
    due: new Date().toISOString().split("T")[0],
  });

  const todayStr = new Date().toISOString().split("T")[0];

  // Filter Tasks by Active List & Search Input
  const taskItems = useMemo(
    () => (Array.isArray(tasks) ? tasks.filter(Boolean) : []),
    [tasks],
  );
  const listTasks = useMemo(() => {
    return taskItems.filter((task) => {
      // Default tasks without listId belong to 'main'
      const taskListId = task.listId || "main";
      if (taskListId !== activeListId) return false;

      const query = String(search || "")
        .trim()
        .toLowerCase();
      if (!query) return true;

      return [task.title, task.priority, task.status, task.due].some((val) =>
        String(val || "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [taskItems, activeListId, search]);

  // Overall Completion Percentage for Active List
  const progressPercent = useMemo(() => {
    if (listTasks.length === 0) return 0;
    const completed = listTasks.filter(
      (t) => t.status === "Done" || t.done,
    ).length;
    return Math.round((completed / listTasks.length) * 100);
  }, [listTasks]);

  // Metric Stats for Active List
  const stats = useMemo(() => {
    return {
      open: listTasks.filter((t) => t.status !== "Done" && !t.done).length,
      highPriority: listTasks.filter(
        (t) =>
          (t.priority === "High" || t.priority === "Top") &&
          t.status !== "Done",
      ).length,
      inProgress: listTasks.filter((t) => t.status === "In progress").length,
      completed: listTasks.filter((t) => t.status === "Done" || t.done).length,
    };
  }, [listTasks]);

  // Page / List Actions
  const handleAddList = () => {
    const listName = prompt("Enter a name for your new To-Do List page:");
    if (!listName || !listName.trim()) return;

    const newList = {
      id: `list-${Date.now()}`,
      name: listName.trim(),
    };

    setLists((prev) => [...prev, newList]);
    setActiveListId(newList.id);
  };

  const handleDeleteList = (id, e) => {
    e.stopPropagation();
    if (lists.length <= 1) {
      alert("You must keep at least one to-do list.");
      return;
    }

    if (
      window.confirm("Are you sure you want to delete this list and its tasks?")
    ) {
      setLists((prev) => prev.filter((l) => l.id !== id));
      setTasks((current) =>
        (Array.isArray(current) ? current : []).filter(
          (t) => (t?.listId || "main") !== id,
        ),
      );
      if (activeListId === id) {
        const remaining = lists.filter((l) => l.id !== id);
        setActiveListId(remaining[0].id);
      }
    }
  };

  // Task Actions
  const updateTask = (id, changes) => {
    setTasks((current) =>
      (Array.isArray(current) ? current : []).map((task) =>
        task?.id === id ? { ...task, ...changes } : task,
      ),
    );
  };

  const toggleDone = (task) => {
    const isDone = task.status === "Done" || task.done;
    updateTask(task.id, {
      status: isDone ? "In progress" : "Done",
      done: !isDone,
    });
  };

  const addTask = (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    const newTask = {
      ...form,
      id: `task-${Date.now()}`,
      listId: activeListId,
      done: form.status === "Done",
    };

    setTasks((current) => [
      newTask,
      ...(Array.isArray(current) ? current : []),
    ]);
    setForm({
      title: "",
      priority: "Medium",
      status: "Not started",
      due: new Date().toISOString().split("T")[0],
    });
  };

  const deleteTask = (id) => {
    setTasks((current) =>
      (Array.isArray(current) ? current : []).filter((task) => task?.id !== id),
    );
    setSelectedTaskIds((prev) => prev.filter((item) => item !== id));
  };

  // Bulk Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTaskIds(listTasks.map((t) => t.id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBulkComplete = () => {
    setTasks((current) =>
      (Array.isArray(current) ? current : []).map((task) =>
        selectedTaskIds.includes(task?.id)
          ? { ...task, status: "Done", done: true }
          : task,
      ),
    );
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    setTasks((current) =>
      (Array.isArray(current) ? current : []).filter(
        (task) => !selectedTaskIds.includes(task?.id),
      ),
    );
    setSelectedTaskIds([]);
  };

  return (
    <div className="deptdesk-task-container">
      {/* Top Header */}
      <div className="deptdesk-header">
        <div>
          <h2>Task Management</h2>
          <p className="subtitle">Organize tasks across custom to-do lists.</p>
        </div>

        {/* View Toggle */}
        <div className="view-toggle-buttons">
          <button
            className={`toggle-btn ${view === "table" ? "active" : ""}`}
            type="button"
            onClick={() => setView("table")}
          >
            <TaskManagementIcon name="table" />
            Table View
          </button>
          <button
            className={`toggle-btn ${view === "status" ? "active" : ""}`}
            type="button"
            onClick={() => setView("status")}
          >
            <TaskManagementIcon name="status" />
            By Status
          </button>
        </div>
      </div>

      {/* Page Tabs / Multiple To-Do Lists Bar */}
      <div className="todo-pages-tab-bar">
        {lists.map((list) => (
          <div
            key={list.id}
            className={`todo-page-tab ${activeListId === list.id ? "active" : ""}`}
            onClick={() => {
              setActiveListId(list.id);
              setSelectedTaskIds([]);
            }}
          >
            <span className="todo-page-tab__name">
              <TaskManagementIcon name="list" />
              {list.name}
            </span>
            {lists.length > 1 && (
              <button
                className="close-tab-btn"
                type="button"
                onClick={(e) => handleDeleteList(list.id, e)}
                title="Delete List"
                aria-label={`Delete ${list.name}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          className="add-page-tab-btn"
          type="button"
          onClick={handleAddList}
        >
          + New List
        </button>
      </div>

      {/* Progress Bar & Summary Metrics */}
      <div className="deptdesk-card progress-card">
        <div className="progress-header">
          <span>Completion Rate</span>
          <span className="progress-num">{progressPercent}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
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
          <span className="metric-value badge-progress">
            {stats.inProgress}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Completed</span>
          <span className="metric-value badge-done">{stats.completed}</span>
        </div>
      </div>

      {/* Quick Add Form & Bulk Actions */}
      <div className="deptdesk-card add-and-filter-card">
        <form className="quick-add-form" onSubmit={addTask}>
          <input
            type="text"
            className="input-field title-input"
            placeholder="+ Add a task to this list..."
            value={form.title || ""}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <select
            className="input-field"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input-field date-input"
            value={form.due}
            onChange={(e) => setForm({ ...form, due: e.target.value })}
          />
          <button type="submit" className="btn-primary">
            + Add Task
          </button>
        </form>

        {/* Bulk Action Controls */}
        {selectedTaskIds.length > 0 && (
          <div className="bulk-actions-group">
            <span className="selected-count">
              {selectedTaskIds.length} selected
            </span>
            <button
              className="btn-secondary"
              type="button"
              onClick={handleBulkComplete}
            >
              ✓ Mark Done
            </button>
            <button
              className="btn-danger"
              type="button"
              onClick={handleBulkDelete}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {view === "table" && (
        <div className="deptdesk-card table-card">
          <table className="deptdesk-table">
            <thead>
              <tr>
                <th style={{ width: "30px" }}>
                  <input
                    type="checkbox"
                    checked={
                      listTasks.length > 0 &&
                      selectedTaskIds.length === listTasks.length
                    }
                    onChange={handleSelectAll}
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
              {listTasks.map((task) => {
                const isDone = task.status === "Done" || task.done;
                const isOverdue = task.due && task.due < todayStr && !isDone;

                return (
                  <tr
                    key={task.id}
                    className={`${isDone ? "row-completed" : ""} ${
                      isOverdue ? "row-overdue" : ""
                    }`}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => handleSelectOne(task.id)}
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="deptdesk-checkbox"
                        checked={isDone}
                        onChange={() => toggleDone(task)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="inline-text-edit"
                        value={task.title || ""}
                        onChange={(e) =>
                          updateTask(task.id, { title: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <select
                        className={`deptdesk-badge priority-${(
                          task.priority || "medium"
                        ).toLowerCase()}`}
                        value={task.priority || "Medium"}
                        onChange={(e) =>
                          updateTask(task.id, { priority: e.target.value })
                        }
                      >
                        {priorities.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className={`deptdesk-badge status-${(
                          task.status || "not started"
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        value={task.status || "Not started"}
                        onChange={(e) =>
                          updateTask(task.id, {
                            status: e.target.value,
                            done: e.target.value === "Done",
                          })
                        }
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="due-date-wrapper">
                        <input
                          type="date"
                          className="inline-date-edit"
                          value={task.due || ""}
                          onChange={(e) =>
                            updateTask(task.id, { due: e.target.value })
                          }
                        />
                        {isOverdue && (
                          <span className="overdue-tag">Overdue</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn-icon-delete"
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        title="Delete Task"
                        aria-label={`Delete ${task.title || "task"}`}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
              {listTasks.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No tasks in this list. Click above to add a new task!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: BY STATUS VIEW */}
      {view === "status" && (
        <div className="status-groups-container">
          {statuses.map((statusName) => {
            const groupTasks = listTasks.filter(
              (t) => (t.status || "Not started") === statusName,
            );
            return (
              <div key={statusName} className="deptdesk-card status-group-card">
                <div className="status-group-header">
                  <span
                    className={`deptdesk-badge status-${statusName
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {statusName}
                  </span>
                  <span className="count-pill">{groupTasks.length} tasks</span>
                </div>

                <table className="deptdesk-table">
                  <tbody>
                    {groupTasks.map((task) => {
                      const isDone = task.status === "Done" || task.done;
                      const isOverdue =
                        task.due && task.due < todayStr && !isDone;

                      return (
                        <tr
                          key={task.id}
                          className={isDone ? "row-completed" : ""}
                        >
                          <td style={{ width: "30px" }}>
                            <input
                              type="checkbox"
                              className="deptdesk-checkbox"
                              checked={isDone}
                              onChange={() => toggleDone(task)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="inline-text-edit"
                              value={task.title || ""}
                              onChange={(e) =>
                                updateTask(task.id, { title: e.target.value })
                              }
                            />
                          </td>
                          <td>
                            <select
                              className={`deptdesk-badge priority-${(
                                task.priority || "medium"
                              ).toLowerCase()}`}
                              value={task.priority || "Medium"}
                              onChange={(e) =>
                                updateTask(task.id, {
                                  priority: e.target.value,
                                })
                              }
                            >
                              {priorities.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="date"
                              className="inline-date-edit"
                              value={task.due || ""}
                              onChange={(e) =>
                                updateTask(task.id, { due: e.target.value })
                              }
                            />
                            {isOverdue && (
                              <span className="overdue-tag">Overdue</span>
                            )}
                          </td>
                          <td style={{ width: "30px" }}>
                            <button
                              className="btn-icon-delete"
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              aria-label={`Delete ${task.title || "task"}`}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {groupTasks.length === 0 && (
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
      )}
    </div>
  );
}

export default TaskManagement;
