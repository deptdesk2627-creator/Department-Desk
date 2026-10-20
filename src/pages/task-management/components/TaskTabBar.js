import { useState } from "react";
import "./TaskTabBar.css";
import { Modal } from "../../../components/ui";

function TaskIcon({ name }) {
  const props = {
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
      <svg {...props}>
        <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
        <path d="M3.5 9.5h17M9 9.5v10M15 9.5v10" />
      </svg>
    );
  }
  if (name === "status") {
    return (
      <svg {...props}>
        <path d="M8 5h12M8 12h12M8 19h12" />
        <circle cx="4" cy="5" r="1" />
        <circle cx="4" cy="12" r="1" />
        <circle cx="4" cy="19" r="1" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M7 4.5h10M7 8.5h10M7 12.5h10M7 16.5h7" />
      <rect x="4" y="2.5" width="16" height="19" rx="2" />
    </svg>
  );
}

function TaskTabBar({
  view,
  setView,
  lists,
  activeListId,
  onSelectList,
  onAddList,
  onDeleteList,
}) {
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");

  function closeModal() {
    setNewListName("");
    setIsAddingList(false);
  }

  function submitNewList(event) {
    event.preventDefault();
    const name = newListName.trim();
    if (!name) return;
    onAddList(name);
    closeModal();
  }

  return (
    <>
      <div className="deptdesk-header">
        <div>
          <h2>Task Management</h2>
          <p className="subtitle">Organize tasks across custom to-do lists.</p>
        </div>
        <div className="view-toggle-buttons">
          <button
            className={`toggle-btn ${view === "table" ? "active" : ""}`}
            type="button"
            onClick={() => setView("table")}
          >
            <TaskIcon name="table" />
            Table View
          </button>
          <button
            className={`toggle-btn ${view === "status" ? "active" : ""}`}
            type="button"
            onClick={() => setView("status")}
          >
            <TaskIcon name="status" />
            By Status
          </button>
        </div>
      </div>
      <div className="todo-pages-tab-bar">
        {lists.map((list) => (
          <div
            key={list.id}
            className={`todo-page-tab ${activeListId === list.id ? "active" : ""}`}
            onClick={() => onSelectList(list.id)}
          >
            <span className="todo-page-tab__name">
              <TaskIcon name="list" />
              {list.name}
            </span>
            {lists.length > 1 && (
              <button
                className="close-tab-btn"
                type="button"
                onClick={(event) => onDeleteList(list.id, event)}
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
          onClick={() => setIsAddingList(true)}
        >
          + New List
        </button>
      </div>
      <Modal
        isOpen={isAddingList}
        onClose={closeModal}
        eyebrow="TASK MANAGEMENT"
        title="Create a task list"
        titleId="new-list-dialog-title"
      >
        <p className="action-product-name">
          Give your new list a name to keep tasks organized.
        </p>
        <form className="module-form action-form" onSubmit={submitNewList}>
          <label htmlFor="new-task-list-name">
            List name
            <input
              autoFocus
              id="new-task-list-name"
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="e.g. Projects"
              required
            />
          </label>
          <div className="form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button className="primary-button" type="submit">
              Create list
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default TaskTabBar;
