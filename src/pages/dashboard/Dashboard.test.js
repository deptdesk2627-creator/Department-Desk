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

test("Dashboard recent tables render mobile-stack-table and data-label attributes for mobile cards", () => {
  const { container } = render(
    <Dashboard
      role={{ id: "secretary", can: { createRequests: true, manageInventory: true } }}
      requests={[
        {
          id: "REQ-1001",
          document: "Equipment Request",
          student: "Alex Cruz",
          office: "CICT Office",
          status: "Pending",
          direction: "outgoing",
        },
        {
          id: "DOC-2001",
          document: "Budget Memo",
          student: "Dean Office",
          office: "Registrar",
          signedByOffice: "Signed by Dean",
          status: "Approved",
          direction: "incoming",
        },
      ]}
      tasks={[]}
      inventory={[]}
    />,
  );

  const stackedTables = container.querySelectorAll("table.mobile-stack-table");
  expect(stackedTables.length).toBe(2);
  expect(
    container.querySelector('td[data-label="Form / Request"]'),
  ).toBeInTheDocument();
  expect(
    container.querySelector('td[data-label="Document / Request"]'),
  ).toBeInTheDocument();
});
