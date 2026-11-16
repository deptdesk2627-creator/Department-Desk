import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";

test("Dean dashboard shows no task summaries or task actions", () => {
  render(
    <Dashboard
      role={{ id: "dean", can: { createRequests: false, manageInventory: false } }}
      requests={[]}
      tasks={[{ id: "task-1", title: "Confidential task" }]}
      inventory={[]}
    />,
  );

  expect(screen.queryByText("Tasks Management")).not.toBeInTheDocument();
  expect(screen.queryByText("Open tasks")).not.toBeInTheDocument();
  expect(screen.queryByText("Confidential task")).not.toBeInTheDocument();
  expect(screen.queryByText("Add To-Do List")).not.toBeInTheDocument();
});
