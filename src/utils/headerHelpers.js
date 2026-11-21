import {
  getRequestStatus,
  isRequestWaiting,
} from "../constants/requestStatus";
import {
  isLowStock,
  PENDING_RETURN_STATUS,
  RETURN_DECLINED_STATUS,
} from "./inventory";
import { matchesQuery, normalizeQuery } from "./search";

export function getNotifications(
  requests,
  tasks,
  inventory,
  settings = {},
  inventoryRecords = [],
  roleId = "secretary",
) {
  const showRequests = roleId !== "staff" && settings?.notifyRequests !== false;
  const showPendingReturns = settings?.notifyPendingReturns !== false;
  const showLowStock = roleId !== "staff" && settings?.notifyLowStock !== false;
  const showOverdueTasks = settings?.notifyOverdueTasks !== false;

  const waitingRequests = showRequests
    ? (Array.isArray(requests) ? requests : [])
        .filter((request) => request && isRequestWaiting(request.status))
        .map((request) => ({
          id:
            request.direction === "incoming"
              ? `request:incoming:${request.id}`
              : `request:${request.id}`,
          title: "Request waiting",
          message: `${request.student || "A request"}${request.document ? ` · ${request.document}` : ""} is waiting for action.`,
          page: "transactions",
          tab: request.direction === "incoming" ? "incoming" : "outgoing",
        }))
    : [];

  const records = Array.isArray(inventoryRecords) ? inventoryRecords : [];
  const pendingReturnAlerts = showPendingReturns
    ? roleId === "staff"
      ? records
          .filter(
            (record) =>
              record &&
              (record.status === RETURN_DECLINED_STATUS ||
                record.status === PENDING_RETURN_STATUS),
          )
          .map((record) =>
            record.status === RETURN_DECLINED_STATUS
              ? {
                  id: `return-declined:${record.id}`,
                  title: "Return declined",
                  message: `Return of ${record.quantity} ${record.unit || "units"} of ${record.productName || "an item"} was declined.`,
                  page: "staff-inventory",
                }
              : {
                  id: `return-awaiting:${record.id}`,
                  title: "Return awaiting confirmation",
                  message: `${record.quantity} ${record.unit || "units"} of ${record.productName || "an item"} is waiting for secretary confirmation.`,
                  page: "staff-inventory",
                },
          )
      : records
          .filter((record) => record && record.status === PENDING_RETURN_STATUS)
          .map((record) => ({
            id: `return-pending:${record.id}`,
            recordId: record.id,
            title: "Pending return",
            message: `${record.person || record.returnedBy || "Staff"} returned ${record.quantity} ${record.unit || "units"} of ${record.productName || "an item"} for confirmation.`,
            page: "inventory",
            tab: "pending",
          }))
    : [];

  const lowStockItems = showLowStock
    ? (Array.isArray(inventory) ? inventory : [])
        .filter(isLowStock)
        .map((item) => ({
          id: `inventory:${item.id}:${item.quantity}`,
          title: "Low stock",
          message: `${item.name}: ${item.quantity} ${item.unit} remaining.`,
          page: "inventory",
          tab: "master",
          stockFilter: "Low stock",
        }))
    : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = showOverdueTasks
    ? (Array.isArray(tasks) ? tasks : [])
        .filter((task) => {
          if (!task || task.done || task.status === "Done") return false;
          const dueDateStr = String(task.due || "").slice(0, 10);
          if (!dueDateStr) return false;
          const dueDate = new Date(`${dueDateStr}T00:00:00`);
          return !Number.isNaN(dueDate.getTime()) && dueDate < today;
        })
        .map((task) => {
          const dueDateStr = String(task.due || "").slice(0, 10);
          return {
            id: `task:${task.id}:${dueDateStr}`,
            title: "Overdue task",
            message: `${task.title} was due ${dueDateStr}.`,
            page: "tasks",
          };
        })
    : [];

  return [
    ...waitingRequests,
    ...pendingReturnAlerts,
    ...lowStockItems,
    ...overdueTasks,
  ];
}

export function getSearchResults(
  requests,
  tasks,
  inventory,
  search,
  roleId = "secretary",
) {
  const query = normalizeQuery(search);
  if (!query) {
    return [];
  }

  const matchesFields = (...fields) => matchesQuery(query, ...fields);
  const inventoryPage = roleId === "staff" ? "staff-inventory" : "inventory";

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
        page: inventoryPage,
      })),
  ].slice(0, 6);
}
