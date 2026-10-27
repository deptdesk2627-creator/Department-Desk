import { useMemo } from "react";
import {
  getRequestStatus,
  isRequestOpen,
  isRequestWaiting,
} from "../../../constants/requestStatus";
import { isLowStock } from "../../../utils/inventory";
import { matchesQuery, normalizeQuery } from "../../../utils/search";

export function useDashboardData({
  requests = [],
  tasks = [],
  inventory = [],
  search = "",
}) {
  const query = normalizeQuery(search);

  return useMemo(() => {
    const requestItems = Array.isArray(requests) ? requests.filter(Boolean) : [];
    const taskItems = Array.isArray(tasks) ? tasks.filter(Boolean) : [];
    const inventoryItems = Array.isArray(inventory)
      ? inventory.filter(Boolean)
      : [];

    const now = new Date();
    const greeting =
      now.getHours() < 12
        ? "Good morning"
        : now.getHours() < 17
          ? "Good afternoon"
          : "Good evening";
    const formattedDate = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const filteredRequests = requestItems.filter((request) =>
      matchesQuery(
        query,
        request.student,
        request.document,
        request.description,
        request.notes,
        request.id,
        request.office || request.location,
        request.category || request.type,
        request.signedByOffice,
        request.forwardedTo,
        getRequestStatus(request.status),
        request.dateTime,
      ),
    );

    const outgoingRequests = filteredRequests.filter(
      (request) => request.direction !== "incoming",
    );
    const incomingRequests = filteredRequests.filter(
      (request) => request.direction === "incoming",
    );

    const filteredTasks = taskItems.filter((task) =>
      matchesQuery(
        query,
        task.title,
        task.category,
        task.priority,
        task.status,
        task.due,
        task.assignee,
        task.id,
        task.done ? "done" : "open",
      ),
    );

    const filteredInventory = inventoryItems.filter((item) =>
      matchesQuery(
        query,
        item.name,
        item.productId,
        item.id,
        item.unit,
        item.quantity,
        item.lowStockAt,
      ),
    );

    const metrics = {
      openDocuments: requestItems.filter(
        (request) =>
          (request.type || request.category) === "Document" &&
          isRequestOpen(request.status),
      ).length,
      waitingRequests: requestItems.filter((request) =>
        isRequestWaiting(request.status),
      ).length,
      openTasks: taskItems.filter((task) => !task.done).length,
      lowStockItems: inventoryItems.filter(isLowStock).length,
    };

    return {
      query,
      greeting,
      formattedDate,
      dateTime,
      metrics,
      recentOutgoing: outgoingRequests.slice(0, 5),
      recentIncoming: incomingRequests.slice(0, 5),
      recentRequests: outgoingRequests.slice(0, 5),
      recentDocuments: incomingRequests.slice(0, 5),
      recentInventory: filteredInventory.slice(0, 5),
      recentTasks: filteredTasks.slice(0, 5),
    };
  }, [requests, tasks, inventory, query]);
}
