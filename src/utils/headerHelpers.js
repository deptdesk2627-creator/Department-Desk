import {
  getRequestStatus,
  isRequestWaiting,
} from "./requestStatus";

export function getNotifications(requests, tasks, inventory) {
  const waitingRequests = (Array.isArray(requests) ? requests : [])
    .filter((request) => request && isRequestWaiting(request.status))
    .map((request) => ({
      id: `request:${request.id}`,
      title: "Request waiting",
      message: `${request.student || "A request"}${request.document ? ` · ${request.document}` : ""} is waiting for action.`,
      page: "transactions",
    }));

  const lowStockItems = (Array.isArray(inventory) ? inventory : [])
    .filter(
      (item) =>
        item &&
        Number.isFinite(Number(item.quantity)) &&
        Number(item.quantity) <= Number(item.lowStockAt || 0),
    )
    .map((item) => ({
      id: `inventory:${item.id}:${item.quantity}`,
      title: "Low stock",
      message: `${item.name}: ${item.quantity} ${item.unit} remaining.`,
      page: "inventory",
    }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = (Array.isArray(tasks) ? tasks : [])
    .filter(
      (task) =>
        task &&
        !task.done &&
        task.due &&
        !Number.isNaN(new Date(`${task.due}T00:00:00`).getTime()) &&
        new Date(`${task.due}T00:00:00`) < today,
    )
    .map((task) => ({
      id: `task:${task.id}:${task.due}`,
      title: "Overdue task",
      message: `${task.title} was due ${task.due}.`,
      page: "tasks",
    }));

  return [...waitingRequests, ...lowStockItems, ...overdueTasks];
}

export function getSearchResults(requests, tasks, inventory, search) {
  const query = String(search || "").trim().toLowerCase();
  if (!query) {
    return [];
  }

  const matchesFields = (...fields) =>
    fields.some(
      (value) =>
        (typeof value === "string" || typeof value === "number") &&
        String(value).toLowerCase().includes(query),
    );

  return [
    ...(Array.isArray(requests) ? requests : [])
      .filter(
        (request) =>
          request &&
          matchesFields(request.document, request.student, request.id),
      )
      .map((request) => ({
        id: `request:${request.id}`,
        type: "request",
        title: request.document || request.student || "Request",
        subtitle: `Request · ${request.id || "No ID"} · ${getRequestStatus(request.status)}`,
        page: "transactions",
      })),
    ...(Array.isArray(tasks) ? tasks : [])
      .filter((task) => task && matchesFields(task.title))
      .map((task) => ({
        id: `task:${task.id}`,
        type: "task",
        title: task.title || "Untitled task",
        subtitle: `Task · ${task.id || "No ID"} · ${task.status || (task.done ? "Done" : "Open")}`,
        page: "tasks",
      })),
    ...(Array.isArray(inventory) ? inventory : [])
      .filter((item) => item && matchesFields(item.name, item.productId))
      .map((item) => ({
        id: `inventory:${item.id}`,
        type: "inventory",
        title: item.name || "Supply",
        subtitle: `Supply · ${item.productId || item.id || "No ID"} · ${item.quantity ?? 0} ${item.unit || "units"}`,
        page: "inventory",
      })),
  ].slice(0, 6);
}
