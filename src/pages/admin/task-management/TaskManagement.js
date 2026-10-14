import { useMemo, useState } from "react";
import "./TaskManagement.css";
import { useTodoListManager } from "../../../hooks/useTodoListManager";
import TaskQuickAdd from "./components/TaskQuickAdd";
import TaskMetrics from "./components/TaskMetrics";
import TaskStatusView from "./components/TaskStatusView";
import TaskTabBar from "./components/TaskTabBar";
import TaskTableView from "./components/TaskTableView";

function TaskManagement({
  tasks = [],
  setTasks = () => {
    throw new Error("TaskManagement requires a setTasks callback.");
  },
  search = "",
}) {
  const { activeListId, addList, deleteList, lists, setActiveListId } =
    useTodoListManager(setTasks);
  const [view, setView] = useState("table");
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [form, setForm] = useState({
    title: "",
    priority: "Medium",
    status: "Not started",
    due: new Date().toISOString().split("T")[0],
  });
  const todayStr = new Date().toISOString().split("T")[0];
  const taskItems = useMemo(
    () => (Array.isArray(tasks) ? tasks.filter(Boolean) : []),
    [tasks],
  );
  const listTasks = useMemo(() => {
    const query = String(search || "").trim().toLowerCase();
    return taskItems.filter((task) => {
      if ((task.listId || "main") !== activeListId) return false;
      if (!query) return true;
      return [task.title, task.priority, task.status, task.due].some((value) =>
        String(value || "").toLowerCase().includes(query),
      );
    });
  }, [taskItems, activeListId, search]);
  const progressPercent = useMemo(() => {
    if (!listTasks.length) return 0;
    const completed = listTasks.filter(
      (task) => task.status === "Done" || task.done,
    ).length;
    return Math.round((completed / listTasks.length) * 100);
  }, [listTasks]);
  const stats = useMemo(
    () => ({
      open: listTasks.filter((task) => task.status !== "Done" && !task.done)
        .length,
      highPriority: listTasks.filter(
        (task) =>
          (task.priority === "High" || task.priority === "Top") &&
          task.status !== "Done",
      ).length,
      inProgress: listTasks.filter((task) => task.status === "In progress")
        .length,
      completed: listTasks.filter(
        (task) => task.status === "Done" || task.done,
      ).length,
    }),
    [listTasks],
  );

  function updateTask(id, changes) {
    setTasks((current) =>
      (Array.isArray(current) ? current : []).map((task) =>
        task?.id === id ? { ...task, ...changes } : task,
      ),
    );
  }

  function toggleDone(task) {
    const isDone = task.status === "Done" || task.done;
    updateTask(task.id, {
      status: isDone ? "In progress" : "Done",
      done: !isDone,
    });
  }

  function addTask(event) {
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
  }

  function deleteTask(id) {
    setTasks((current) =>
      (Array.isArray(current) ? current : []).filter((task) => task?.id !== id),
    );
    setSelectedTaskIds((current) => current.filter((taskId) => taskId !== id));
  }

  function selectAll(event) {
    setSelectedTaskIds(
      event.target.checked ? listTasks.map((task) => task.id) : [],
    );
  }

  function selectOne(id) {
    setSelectedTaskIds((current) =>
      current.includes(id)
        ? current.filter((taskId) => taskId !== id)
        : [...current, id],
    );
  }

  function bulkComplete() {
    setTasks((current) =>
      (Array.isArray(current) ? current : []).map((task) =>
        selectedTaskIds.includes(task?.id)
          ? { ...task, status: "Done", done: true }
          : task,
      ),
    );
    setSelectedTaskIds([]);
  }

  function bulkDelete() {
    setTasks((current) =>
      (Array.isArray(current) ? current : []).filter(
        (task) => !selectedTaskIds.includes(task?.id),
      ),
    );
    setSelectedTaskIds([]);
  }

  function selectList(listId) {
    setActiveListId(listId);
    setSelectedTaskIds([]);
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
      />
      <TaskMetrics progressPercent={progressPercent} stats={stats} />
      <TaskQuickAdd
        form={form}
        setForm={setForm}
        onSubmit={addTask}
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
