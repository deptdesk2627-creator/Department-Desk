import { fireEvent, render, screen } from "@testing-library/react";
import TaskTabBar from "./TaskTabBar";

test("opens an in-app form to name a new task list", () => {
  const onAddList = jest.fn();
  render(
    <TaskTabBar
      view="table"
      setView={jest.fn()}
      lists={[{ id: "main", name: "Main To-Do List" }]}
      activeListId="main"
      onSelectList={jest.fn()}
      onAddList={onAddList}
      onDeleteList={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "+ New List" }));
  expect(
    screen.getByRole("dialog", { name: "Create a task list" }),
  ).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("List name"), {
    target: { value: "Project tasks" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create list" }));

  expect(onAddList).toHaveBeenCalledWith("Project tasks");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
