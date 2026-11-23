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

test("distinguishes outgoing and incoming waiting requests with unique IDs and target tabs", () => {
  const notifications = getNotifications(
    [
      {
        id: 1,
        direction: "outgoing",
        student: "Ari",
        document: "Travel order",
        status: "Pending",
      },
      {
        id: 1,
        direction: "incoming",
        student: "Registrar",
        document: "Memo 104",
        status: "For Signature",
      },
    ],
    [],
    [],
  );

  expect(notifications).toEqual([
    expect.objectContaining({
      id: "request:1",
      title: "Request waiting",
      page: "transactions",
      tab: "outgoing",
    }),
    expect.objectContaining({
      id: "request:incoming:1",
      title: "Request waiting",
      page: "transactions",
      tab: "incoming",
    }),
  ]);
});

test("builds pending return notifications for secretary and return updates for staff", () => {
  const records = [
    {
      id: 12,
      person: "Prof. Santos",
      productName: "Projector",
      quantity: 1,
      unit: "unit",
      status: "Pending Return",
    },
    {
      id: 13,
      person: "Prof. Santos",
      productName: "HDMI Cable",
      quantity: 2,
      unit: "pcs",
      status: "Return Declined",
    },
  ];

  const secretaryAlerts = getNotifications([], [], [], {}, records, "secretary");
  expect(secretaryAlerts).toEqual([
    expect.objectContaining({
      id: "return-pending:12",
      title: "Pending return",
      page: "inventory",
      tab: "pending",
    }),
  ]);

  const staffAlerts = getNotifications([], [], [], {}, records, "staff");
  expect(staffAlerts).toEqual([
    expect.objectContaining({
      id: "return-awaiting:12",
      title: "Return awaiting confirmation",
      page: "staff-inventory",
    }),
    expect.objectContaining({
      id: "return-declined:13",
      title: "Return declined",
      page: "staff-inventory",
    }),
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

  expect(
    getSearchResults(
      [],
      [],
      [{ id: 4, productId: "PRD-0004", name: "Bond paper", quantity: 10, unit: "reams" }],
      "bond",
      "staff",
    ),
  ).toEqual([
    {
      id: "inventory:4",
      type: "inventory",
      title: "Bond paper",
      subtitle: "Supply · PRD-0004 · 10 reams",
      page: "staff-inventory",
    },
  ]);
});
