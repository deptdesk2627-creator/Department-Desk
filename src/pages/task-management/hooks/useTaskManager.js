import { useMemo, useState } from "react";
import { matchesQuery } from "../../../utils/search";
import { useTodoListManager } from "./useTodoListManager";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function createInitialForm() {
  return {
    title: "",
    priority: "Medium",
    status: "Not started",
    due: getTodayStr(),
  };
}

export function useTaskManager({ tasks = [], setTasks, search = "" }) {
  const { activeListId, addList, deleteList, lists, setActiveListId } =
    useTodoListManager(setTasks);
  const [view, setView] = useState("table");
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [form, setForm] = useState(createInitialForm);
  const todayStr = getTodayStr();

  const taskItems = useMemo(
    () => (Array.isArray(tasks) ? tasks.filter(Boolean) : []),
    [tasks],
  );

  const listTasks = useMemo(() => {
    const hasSearch = Boolean(String(search || "").trim());
    return taskItems.filter((task) => {
      if (!hasSearch && (task.listId || "main") !== activeListId) return false;
      return matchesQuery(search, task.title);
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
    setForm(createInitialForm());
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

  return {
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
  };
}
