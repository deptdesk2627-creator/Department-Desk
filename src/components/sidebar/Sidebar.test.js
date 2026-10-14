import { fireEvent, render, screen } from "@testing-library/react";
import SideBar from "./Sidebar";

test("marks the current page and navigates when a workspace item is selected", () => {
  const onNavigate = jest.fn();
  render(<SideBar currentPage="dashboard" onNavigate={onNavigate} />);

  expect(screen.getByRole("button", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("button", { name: "Transactions & Requests" })).not.toHaveAttribute("aria-current");

  fireEvent.click(screen.getByRole("button", { name: "Transactions & Requests" }));
  expect(onNavigate).toHaveBeenCalledWith("transactions");

  fireEvent.click(screen.getByRole("button", { name: "Task Management" }));
  expect(onNavigate).toHaveBeenLastCalledWith("tasks");

  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  expect(onNavigate).toHaveBeenLastCalledWith("settings");

  fireEvent.click(screen.getByRole("button", { name: "Help & Support" }));
  expect(onNavigate).toHaveBeenLastCalledWith("help");

  fireEvent.click(screen.getByRole("button", { name: "DeptDesk home" }));
  expect(onNavigate).toHaveBeenLastCalledWith("dashboard");
});

test("collapses the sidebar to workspace icons and expands it again", () => {
  const onToggle = jest.fn();
  const { rerender } = render(
    <SideBar currentPage="dashboard" onNavigate={jest.fn()} isOpen onToggle={onToggle} />
  );

  fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
  expect(onToggle).toHaveBeenCalledTimes(1);

  rerender(
    <SideBar currentPage="dashboard" onNavigate={jest.fn()} isOpen={false} onToggle={onToggle} />
  );
  expect(screen.getByRole("complementary", { name: "Main navigation" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Dashboard" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Transactions & Requests" })).toHaveAttribute("title", "Transactions & Requests");
  expect(screen.getByText("System")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
  expect(onToggle).toHaveBeenCalledTimes(2);
});

test("closes the profile menu after navigating from it", () => {
  const onNavigate = jest.fn();
  render(<SideBar currentPage="dashboard" onNavigate={onNavigate} />);

  fireEvent.click(screen.getByRole("button", { name: "Office Staff menu" }));
  expect(screen.getByRole("menu")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("menuitem", { name: "Settings" }));
  expect(onNavigate).toHaveBeenCalledWith("settings");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});
