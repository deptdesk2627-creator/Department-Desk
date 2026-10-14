import { fireEvent, render, screen } from "@testing-library/react";
import MainLayout from "./MainLayout";

test("forwards the current page and header controls through the layout", () => {
  const onNavigate = jest.fn();
  const onSearchChange = jest.fn();

  render(
    <MainLayout
      currentPage="inventory"
      requests={[]}
      tasks={[]}
      inventory={[]}
      search=""
      onNavigate={onNavigate}
      onSearchChange={onSearchChange}
    >
      <h1>Inventory page</h1>
    </MainLayout>,
  );

  expect(screen.getByRole("main")).toHaveAttribute("id", "page-inventory");
  expect(screen.getByRole("heading", { name: "Inventory page" })).toBeInTheDocument();

  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "paper" },
  });
  expect(onSearchChange).toHaveBeenCalledWith("paper");

  fireEvent.click(screen.getByRole("button", { name: "DeptDesk home" }));
  expect(onNavigate).toHaveBeenCalledWith("dashboard");
});
