import { useMemo, useState } from "react";
import { matchesQuery } from "../../../utils/search";

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
  const [view, setView] = useState("table");
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [form, setForm] = useState(createInitialForm);
  const [taskSearch, setTaskSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [dueFilter, setDueFilter] = useState("All");
  const todayStr = getTodayStr();

  const taskItems = useMemo(
    () => (Array.isArray(tasks) ? tasks.filter(Boolean) : []),
    [tasks],
  );

  const listTasks = useMemo(
    () =>
      taskItems.filter((task) => {
        const isDone = task.status === "Done" || Boolean(task.done);
        const taskStatus = isDone ? "Done" : task.status || "Not started";
        const taskPriority = task.priority || "Medium";
        const due = task.due || "";
        const isOverdue = Boolean(due && due < todayStr && !isDone);

        const matchesStatus =
          statusFilter === "All" || taskStatus === statusFilter;
        const matchesPriority =
          priorityFilter === "All" || taskPriority === priorityFilter;
        const matchesDue =
          dueFilter === "All" ||
          (dueFilter === "Overdue" && isOverdue) ||
          (dueFilter === "Due today" && Boolean(due && due === todayStr)) ||
          (dueFilter === "Upcoming" && Boolean(due && due > todayStr));

        const searchableFields = [
          task.title,
          taskStatus,
          taskPriority,
          due,
          isOverdue ? "Overdue" : "",
        ];

        return (
          matchesStatus &&
          matchesPriority &&
          matchesDue &&
          matchesQuery(search, ...searchableFields) &&
          matchesQuery(taskSearch, ...searchableFields)
        );
      }),
    [
      taskItems,
      search,
      taskSearch,
      statusFilter,
      priorityFilter,
      dueFilter,
      todayStr,
    ],
  );

  const hasActiveFilters = Boolean(
    taskSearch.trim() ||
      statusFilter !== "All" ||
      priorityFilter !== "All" ||
      dueFilter !== "All",
  );

  function resetFilters() {
    setTaskSearch("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setDueFilter("All");
  }

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
    if (!form.title.trim()) return false;
    const newTask = {
      ...form,
      id: `task-${Date.now()}`,
      done: form.status === "Done",
    };
    setTasks((current) => [
      newTask,
      ...(Array.isArray(current) ? current : []),
    ]);
    setForm(createInitialForm());
    return true;
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

  return {
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
    totalTasks: taskItems.length,
    updateTask,
    view,
  };
}
