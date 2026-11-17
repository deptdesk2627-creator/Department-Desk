import { render, screen, within } from "@testing-library/react";
import Dashboard from "./Dashboard";

test("Dean dashboard shows the open task count without exposing task details or actions", () => {
  render(
    <Dashboard
      role={{ id: "dean", can: { createRequests: false, manageInventory: false } }}
      requests={[]}
      tasks={[{ id: "task-1", title: "Confidential task" }]}
      inventory={[]}
    />,
  );

  expect(screen.queryByText("Tasks Management")).not.toBeInTheDocument();
  const summary = screen.getByLabelText("Office summary");
  expect(within(summary).getByText("Open tasks")).toBeInTheDocument();
  expect(within(summary).getByText("1")).toBeInTheDocument();
  expect(screen.queryByText("Confidential task")).not.toBeInTheDocument();
  expect(screen.queryByText("Add To-Do List")).not.toBeInTheDocument();
});
