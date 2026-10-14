import { getNotifications, getSearchResults } from "./headerHelpers";

test("builds notifications for waiting requests, low stock, and overdue tasks", () => {
  const notifications = getNotifications(
    [{ id: "request-1", student: "Ari", document: "Transcript", status: "Waiting" }],
    [{ id: "task-1", title: "Review form", due: "2020-01-01", done: false }],
    [{ id: "item-1", name: "Paper", quantity: 1, unit: "ream", lowStockAt: 2 }],
  );

  expect(notifications.map(({ title, page }) => ({ title, page }))).toEqual([
    { title: "Request waiting", page: "transactions" },
    { title: "Low stock", page: "inventory" },
    { title: "Overdue task", page: "tasks" },
  ]);
});

test("returns searchable results with normalized request status", () => {
  expect(
    getSearchResults(
      [{ id: "request-1", document: "Transcript", status: "Waiting" }],
      [],
      [],
      "transcript",
    ),
  ).toEqual([
    {
      id: "request:request-1",
      type: "request",
      title: "Transcript",
      subtitle: "Request · request-1 · Action Needed",
      page: "transactions",
    },
  ]);
});
