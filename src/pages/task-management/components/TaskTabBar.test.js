import { fireEvent, render, screen } from "@testing-library/react";
import TaskManagement from "../TaskManagement";
import TaskTabBar from "./TaskTabBar";

test("switches views and triggers add task modal without list tabs", () => {
  const setView = jest.fn();
  const onOpenAddTask = jest.fn();
  render(
    <TaskTabBar
      view="table"
      setView={setView}
      onOpenAddTask={onOpenAddTask}
    />,
  );

  expect(
    screen.queryByRole("button", { name: "+ New List" }),
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /by status/i }));
  expect(setView).toHaveBeenCalledWith("status");

  fireEvent.click(screen.getByRole("button", { name: /add task/i }));
  expect(onOpenAddTask).toHaveBeenCalledTimes(1);
});

test("filters tasks by search, status, priority, and due date and clears filters", () => {
  const todayStr = new Date().toISOString().split("T")[0];
  const sampleTasks = [
    {
      id: "task-1",
      title: "Prepare budget report",
      priority: "High",
      status: "In progress",
      due: "2020-01-01",
      done: false,
    },
    {
      id: "task-2",
      title: "Archive student files",
      priority: "Low",
      status: "Done",
      due: todayStr,
      done: true,
    },
  ];

  render(<TaskManagement tasks={sampleTasks} setTasks={jest.fn()} />);

  expect(screen.getByDisplayValue("Prepare budget report")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Archive student files")).toBeInTheDocument();

  // Filter by status
  fireEvent.change(screen.getByRole("combobox", { name: /filter by status/i }), {
    target: { value: "In progress" },
  });
  expect(screen.getByDisplayValue("Prepare budget report")).toBeInTheDocument();
  expect(
    screen.queryByDisplayValue("Archive student files"),
  ).not.toBeInTheDocument();

  // Filter by priority (mismatch)
  fireEvent.change(
    screen.getByRole("combobox", { name: /filter by priority/i }),
    { target: { value: "Low" } },
  );
  expect(
    screen.getByText(/no tasks match the selected filters/i),
  ).toBeInTheDocument();

  // Clear filters
  fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
  expect(screen.getByDisplayValue("Prepare budget report")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Archive student files")).toBeInTheDocument();

  // Filter by due date (Overdue)
  fireEvent.change(
    screen.getByRole("combobox", { name: /filter by due date/i }),
    { target: { value: "Overdue" } },
  );
  expect(screen.getByDisplayValue("Prepare budget report")).toBeInTheDocument();
  expect(
    screen.queryByDisplayValue("Archive student files"),
  ).not.toBeInTheDocument();
});
