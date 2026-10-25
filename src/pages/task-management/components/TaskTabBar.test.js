import { fireEvent, render, screen } from "@testing-library/react";
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
