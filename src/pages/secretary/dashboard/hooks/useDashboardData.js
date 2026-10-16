import { useMemo } from "react";
import {
  getRequestStatus,
  isRequestOpen,
  isRequestWaiting,
} from "../../../../utils/requestStatus";
import { matchesQuery, normalizeQuery } from "../../../../utils/search";

export function useDashboardData({ requests = [], tasks = [], inventory = [], search = "" }) {
  const query = normalizeQuery(search);

  return useMemo(() => {
    const requestItems = Array.isArray(requests) ? requests.filter(Boolean) : [];
    const taskItems = Array.isArray(tasks) ? tasks.filter(Boolean) : [];
    const inventoryItems = Array.isArray(inventory) ? inventory.filter(Boolean) : [];

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
        getRequestStatus(request.status),
        request.dateTime,
      ),
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
      lowStockItems: inventoryItems.filter(
        (item) =>
          Number.isFinite(Number(item.quantity)) &&
          Number(item.quantity) <= Number(item.lowStockAt || 0),
      ).length,
    };

    return {
      query,
      greeting,
      formattedDate,
      dateTime,
      metrics,
      recentRequests: filteredRequests.slice(0, 4),
      recentDocuments: filteredRequests
        .filter((request) => request.type === "Document")
        .slice(0, 4),
      recentInventory: filteredInventory.slice(0, 4),
      recentTasks: filteredTasks.slice(0, 5),
    };
  }, [requests, tasks, inventory, query]);
}
