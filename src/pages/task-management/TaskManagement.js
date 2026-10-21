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
    activeListId,
    addList,
    addTask,
    bulkComplete,
    bulkDelete,
    deleteList,
    deleteTask,
    form,
    lists,
    listTasks,
    progressPercent,
    selectedTaskIds,
    selectAll,
    selectList,
    selectOne,
    setForm,
    setView,
    stats,
    todayStr,
    toggleDone,
    updateTask,
    view,
  } = useTaskManager({ tasks, setTasks, search });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const activeList = lists.find((list) => list.id === activeListId);

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
        lists={lists}
        activeListId={activeListId}
        onSelectList={selectList}
        onAddList={addList}
        onDeleteList={deleteList}
        onOpenAddTask={() => setIsTaskModalOpen(true)}
      />
      <TaskMetrics progressPercent={progressPercent} stats={stats} />
      <TaskQuickAdd
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        listName={activeList?.name}
        form={form}
        setForm={setForm}
        onSubmit={handleAddTask}
        selectedCount={selectedTaskIds.length}
        onBulkComplete={bulkComplete}
        onBulkDelete={bulkDelete}
      />
      {view === "table" ? (
        <TaskTableView
          tasks={listTasks}
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
