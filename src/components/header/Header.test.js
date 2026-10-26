import { fireEvent, render, screen } from "@testing-library/react";
import Header from "./Header";

test("toggles the profile menu and closes it after choosing an item", () => {
  render(<Header />);

  const profileButton = screen.getByRole("button", { name: /cha gamay/i });
  fireEvent.click(profileButton);

  expect(screen.getByText("Signed in as")).toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: "Profile" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("menuitem", { name: "Profile" }));
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

test("closes the profile menu when clicking outside", () => {
  render(<Header />);

  fireEvent.click(screen.getByRole("button", { name: /cha gamay/i }));
  fireEvent.pointerDown(document.body);

  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

test("shows current alerts, marks them read, and navigates from an alert", () => {
  const onNavigate = jest.fn();
  render(
    <Header
      requests={[{ id: "DOC-1", student: "Alex", document: "Transcript", status: "Waiting" }]}
      inventory={[{ id: "supply-1", name: "Paper", quantity: 1, unit: "ream", lowStockAt: 2 }]}
      onNavigate={onNavigate}
    />
  );

  const notificationButton = screen.getByRole("button", { name: "Notifications, 2 unread" });
  fireEvent.click(notificationButton);

  expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();
  expect(screen.getByText("Alex · Transcript is waiting for action.")).toBeInTheDocument();
  expect(screen.getByText("Paper: 1 ream remaining.")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /request waiting/i }));
  expect(onNavigate).toHaveBeenCalledWith("transactions");
  expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Notifications, 1 unread" })).toBeInTheDocument();
});

test("marking all alerts read removes the unread indicator", () => {
  render(
    <Header
      inventory={[{ id: "supply-1", name: "Paper", quantity: 1, unit: "ream", lowStockAt: 2 }]}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
  fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));

  expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
  expect(screen.getByText("All caught up")).toBeInTheDocument();
});

test("deletes a notification without navigating from it", () => {
  const onNavigate = jest.fn();
  render(
    <Header
      inventory={[
        { id: "supply-1", name: "Paper", quantity: 1, unit: "ream", lowStockAt: 2 },
        { id: "supply-2", name: "Pens", quantity: 1, unit: "box", lowStockAt: 3 },
      ]}
      onNavigate={onNavigate}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "Notifications, 2 unread" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Delete notification: Paper: 1 ream remaining." }),
  );

  expect(screen.queryByText("Paper: 1 ream remaining.")).not.toBeInTheDocument();
  expect(screen.getByText("Pens: 1 box remaining.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Notifications, 1 unread" })).toBeInTheDocument();
  expect(onNavigate).not.toHaveBeenCalled();
});

test("updates global search and does not show dropdown suggestions when search is empty", () => {
  const onSearchChange = jest.fn();
  render(
    <Header
      requests={[{ id: "DOC-1", document: "Transcript" }]}
      search=""
      onSearchChange={onSearchChange}
    />,
  );

  const searchInput = screen.getByRole("searchbox");
  fireEvent.focus(searchInput);
  expect(
    screen.queryByRole("list", { name: "Search results" }),
  ).not.toBeInTheDocument();

  fireEvent.change(searchInput, { target: { value: "invoice" } });
  expect(onSearchChange).toHaveBeenCalledWith("invoice");
});

test("shows matching live-search previews and navigates directly to the selected result", () => {
  const onNavigate = jest.fn();
  const onSearchChange = jest.fn();
  render(
    <Header
      requests={[
        {
          id: "DOC-0248",
          student: "Mia Santos",
          document: "Certificate of Good Moral",
          status: "Waiting",
        },
      ]}
      tasks={[{ id: "task-1", title: "Review scholarship documents" }]}
      inventory={[
        {
          id: "supply-1",
          productId: "PRD-0001",
          name: "Bond paper",
          quantity: 3,
          unit: "reams",
        },
      ]}
      search="bond"
      onSearchChange={onSearchChange}
      onNavigate={onNavigate}
    />,
  );

  fireEvent.focus(screen.getByRole("searchbox"));

  expect(screen.getByRole("list", { name: "Search results" })).toBeInTheDocument();
  expect(screen.getByText("Bond paper")).toBeInTheDocument();
  expect(screen.getByText("Supply · PRD-0001 · 3 reams")).toBeInTheDocument();
  expect(screen.queryByText("Certificate of Good Moral")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /bond paper/i }));
  expect(onSearchChange).toHaveBeenCalledWith("Bond paper");
  expect(onNavigate).toHaveBeenCalledWith("inventory");
  expect(screen.queryByRole("list", { name: "Search results" })).not.toBeInTheDocument();
});

test("closes live-search previews when clicking outside", () => {
  render(
    <Header
      requests={[{ id: "DOC-1", document: "Transcript" }]}
      search="Transcript"
    />,
  );

  fireEvent.focus(screen.getByRole("searchbox"));
  expect(screen.getByRole("list", { name: "Search results" })).toBeInTheDocument();
  fireEvent.mouseDown(document.body);

  expect(screen.queryByRole("list", { name: "Search results" })).not.toBeInTheDocument();
});

test("focuses global search with the Ctrl+K shortcut", () => {
  render(<Header />);

  const search = screen.getByRole("searchbox");
  fireEvent.keyDown(document, { key: "k", ctrlKey: true });

  expect(search).toHaveFocus();
});

test("switches between light and dark mode using the header theme switch", () => {
  window.localStorage.clear();
  render(<Header />);

  const themeToggle = screen.getByRole("checkbox", {
    name: /toggle light and dark theme/i,
  });

  expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  expect(themeToggle).toBeChecked();

  fireEvent.click(themeToggle);
  expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  expect(themeToggle).not.toBeChecked();

  fireEvent.click(themeToggle);
  expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  expect(themeToggle).toBeChecked();
});
