import { useState } from "react";
import "./TaskManagement.css";
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

  async function handleAddTask(event) {
    if (await addTask(event)) {
      setIsTaskModalOpen(false);
    }
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
        onBulkDelete={bulkDelete}
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
          onDeleteTask={deleteTask}
        />
      ) : (
        <TaskStatusView
          tasks={listTasks}
          statusFilter={statusFilter}
          todayStr={todayStr}
          onToggleDone={toggleDone}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      )}
    </div>
  );
}

export default TaskManagement;
