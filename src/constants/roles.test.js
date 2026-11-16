import { canAccessPage, getRole } from "./roles";

test("Dean can open only the dashboard, transactions, and inventory modules", () => {
  expect(getRole("dean").pages).toEqual([
    "dashboard",
    "transactions",
    "inventory",
  ]);
  expect(canAccessPage("dean", "tasks")).toBe(false);
  expect(canAccessPage("dean", "transactions")).toBe(true);
  expect(canAccessPage("dean", "inventory")).toBe(true);
  expect(getRole("dean").can.createTasks).toBe(false);
  expect(getRole("dean").can.editTasks).toBe(false);
});
