import { useState } from "react";
import "./TaskManagement.css";
import { ConfirmModal } from "../../components/ui";
import TaskMetrics from "./components/TaskMetrics";
import TaskQuickAdd from "./components/TaskQuickAdd";
import TaskStatusView from "./components/TaskStatusView";
import TaskTabBar from "./components/TaskTabBar";
import TaskTableView from "./components/TaskTableView";
import { useTaskManager } from "./hooks/useTaskManager";
import { useSupabaseTasks } from "./hooks/useSupabaseTasks";

function TaskManagement({
  tasks = [],
  setTasks = () => {
    throw new Error("TaskManagement requires a setTasks callback.");
  },
  search = "",
  defaultView = "table",
}) {
  const taskPersistence = useSupabaseTasks({ tasks, setTasks });
  const {
    addTask,
    bulkComplete,
    bulkDelete,
    deleteTask,
    dueFilter,
    form,
    hasActiveFilters,
    listTasks,
    priorityFilter,
    progressPercent,
    resetFilters,
    selectedTaskIds,
    selectAll,
    selectOne,
    setDueFilter,
    setForm,
    setPriorityFilter,
    setStatusFilter,
    setTaskSearch,
    setView,
    stats,
    statusFilter,
    taskSearch,
    todayStr,
    toggleDone,
    totalTasks,
    updateTask,
    view,
  } = useTaskManager({
    tasks,
    setTasks,
    search,
    defaultView,
    onTaskAdd: taskPersistence.persistTaskAdd,
    onTaskUpdate: taskPersistence.persistTaskUpdate,
    onTaskDelete: taskPersistence.persistTaskDelete,
    onTaskError: taskPersistence.reportAddError,
  });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskPendingDelete, setTaskPendingDelete] = useState(null);
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);

  async function handleAddTask(event) {
    if (await addTask(event)) {
      setIsTaskModalOpen(false);
    }
  }

  function requestDeleteTask(id) {
    const target = (Array.isArray(tasks) ? tasks : []).find(
      (task) => task?.id === id,
    );
    if (target) {
      setTaskPendingDelete(target);
    }
  }

  function handleConfirmDeleteTask() {
    if (!taskPendingDelete) return;
    deleteTask(taskPendingDelete.id);
    setTaskPendingDelete(null);
  }

  function handleConfirmBulkDelete() {
    bulkDelete();
    setIsConfirmingBulkDelete(false);
  }

  if (taskPersistence.isLoading) {
    return (
      <p className="empty-state" role="status">
        Loading tasks...
      </p>
    );
  }

  if (!taskPersistence.isReady) {
    return (
      <div className="deptdesk-task-container">
        <p className="empty-state" role="alert">
          {taskPersistence.error || "Tasks are unavailable."}
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={taskPersistence.reload}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="deptdesk-task-container">
      {taskPersistence.error && (
        <p className="empty-state" role="alert">
          {taskPersistence.error}
        </p>
      )}
      <TaskTabBar
        view={view}
        setView={setView}
        onOpenAddTask={() => setIsTaskModalOpen(true)}
      />
      <TaskMetrics progressPercent={progressPercent} stats={stats} />
      <TaskQuickAdd
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        form={form}
        setForm={setForm}
        onSubmit={handleAddTask}
        taskSearch={taskSearch}
        setTaskSearch={setTaskSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        dueFilter={dueFilter}
        setDueFilter={setDueFilter}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        selectedCount={selectedTaskIds.length}
        onBulkComplete={bulkComplete}
        onBulkDelete={() => setIsConfirmingBulkDelete(true)}
      />
      {view === "table" ? (
        <TaskTableView
          tasks={listTasks}
          totalTasks={totalTasks}
          selectedTaskIds={selectedTaskIds}
          todayStr={todayStr}
          onSelectAll={selectAll}
          onSelectOne={selectOne}
          onToggleDone={toggleDone}
          onUpdateTask={updateTask}
          onDeleteTask={requestDeleteTask}
        />
      ) : (
        <TaskStatusView
          tasks={listTasks}
          statusFilter={statusFilter}
          todayStr={todayStr}
          onToggleDone={toggleDone}
          onUpdateTask={updateTask}
          onDeleteTask={requestDeleteTask}
        />
      )}
      <ConfirmModal
        isOpen={Boolean(taskPendingDelete)}
        onClose={() => setTaskPendingDelete(null)}
        onConfirm={handleConfirmDeleteTask}
        eyebrow="TASK MANAGEMENT"
        title={
          taskPendingDelete?.title
            ? `Delete "${taskPendingDelete.title}"?`
            : "Delete task?"
        }
        titleId="confirm-delete-task-title"
        message={
          taskPendingDelete?.title
            ? `Are you sure you want to permanently delete "${taskPendingDelete.title}"? This cannot be undone.`
            : "Are you sure you want to permanently delete this task? This cannot be undone."
        }
        confirmLabel="Yes, delete task"
        cancelLabel="Cancel"
        danger
      />
      <ConfirmModal
        isOpen={isConfirmingBulkDelete}
        onClose={() => setIsConfirmingBulkDelete(false)}
        onConfirm={handleConfirmBulkDelete}
        eyebrow="TASK MANAGEMENT · BULK DELETE"
        title={`Delete ${selectedTaskIds.length} selected ${selectedTaskIds.length === 1 ? "task" : "tasks"}?`}
        titleId="confirm-bulk-delete-tasks-title"
        message={`Are you sure you want to permanently delete ${selectedTaskIds.length} selected ${selectedTaskIds.length === 1 ? "task" : "tasks"}? This cannot be undone.`}
        confirmLabel="Yes, delete selected"
        cancelLabel="Cancel"
        danger
      />
    </div>
  );
}

export default TaskManagement;
