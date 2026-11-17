import { canAccessPage, getRole } from "./roles";

test("Dean can manage personal tasks alongside the dashboard, transactions, and inventory", () => {
  expect(getRole("dean").pages).toEqual([
    "dashboard",
    "transactions",
    "tasks",
    "inventory",
  ]);
  expect(canAccessPage("dean", "tasks")).toBe(true);
  expect(canAccessPage("dean", "transactions")).toBe(true);
  expect(canAccessPage("dean", "inventory")).toBe(true);
  expect(getRole("dean").can.createTasks).toBe(true);
  expect(getRole("dean").can.editTasks).toBe(true);
  expect(getRole("dean").can.manageInventory).toBe(false);
  expect(getRole("dean").can.recordInventory).toBe(true);
  expect(getRole("dean").can.recordInventoryForCurrentUserOnly).toBe(true);
});

test("Faculty and staff can manage personal tasks", () => {
  expect(getRole("staff").pages).toContain("tasks");
  expect(canAccessPage("staff", "tasks")).toBe(true);
  expect(getRole("staff").can.createTasks).toBe(true);
  expect(getRole("staff").can.editTasks).toBe(true);
});
