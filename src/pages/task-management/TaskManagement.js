import { useState } from "react";
import "./TaskManagement.css";
import TaskMetrics from "./components/TaskMetrics";
import TaskQuickAdd from "./components/TaskQuickAdd";
import TaskStatusView from "./components/TaskStatusView";
import TaskTabBar from "./components/TaskTabBar";
import TaskTableView from "./components/TaskTableView";
import { useTaskManager } from "./hooks/useTaskManager";

function TaskManagement({
  tasks = [],
  setTasks = () => {
    throw new Error("TaskManagement requires a setTasks callback.");
  },
  search = "",
}) {
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
  } = useTaskManager({ tasks, setTasks, search });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  function handleAddTask(event) {
    if (addTask(event)) {
      setIsTaskModalOpen(false);
    }
  }

  return (
    <div className="deptdesk-task-container">
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
