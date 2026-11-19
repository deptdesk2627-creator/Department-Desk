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

test("plays the notification sound when a new alert arrives", () => {
  const play = jest.fn().mockResolvedValue(undefined);
  const audioSpy = jest
    .spyOn(window, "Audio")
    .mockImplementation(() => ({ play }));
  const { rerender } = render(<Header />);

  rerender(
    <Header
      requests={[
        {
          id: "DOC-1",
          student: "Alex",
          document: "Transcript",
          status: "Waiting",
        },
      ]}
    />,
  );

  expect(audioSpy).toHaveBeenCalledWith(
    `${process.env.PUBLIC_URL || ""}/sound-message.mp3`,
  );
  expect(play).toHaveBeenCalledTimes(1);
  audioSpy.mockRestore();
});

test("mutes the notification sound when notifySound is false in settings and unmutes when re-enabled", () => {
  const play = jest.fn().mockResolvedValue(undefined);
  const audioSpy = jest
    .spyOn(window, "Audio")
    .mockImplementation(() => ({ play }));
  const { rerender } = render(<Header settings={{ notifySound: false }} />);

  rerender(
    <Header
      settings={{ notifySound: false }}
      requests={[
        {
          id: "DOC-1",
          student: "Alex",
          document: "Transcript",
          status: "Waiting",
        },
      ]}
    />,
  );

  expect(audioSpy).not.toHaveBeenCalled();
  expect(play).not.toHaveBeenCalled();

  rerender(
    <Header
      settings={{ notifySound: true }}
      requests={[
        {
          id: "DOC-1",
          student: "Alex",
          document: "Transcript",
          status: "Waiting",
        },
      ]}
    />,
  );
  expect(play).not.toHaveBeenCalled();

  rerender(
    <Header
      settings={{ notifySound: true }}
      requests={[
        {
          id: "DOC-1",
          student: "Alex",
          document: "Transcript",
          status: "Waiting",
        },
        {
          id: "DOC-2",
          student: "Sam",
          document: "Form 137",
          status: "Waiting",
        },
      ]}
    />,
  );

  expect(play).toHaveBeenCalledTimes(1);
  audioSpy.mockRestore();
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

test("Dean search and notifications do not expose tasks", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const due = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  render(
    <Header
      role={{ id: "dean", pages: ["dashboard"] }}
      tasks={[{ id: "task-1", title: "Confidential task", due }]}
      search="Confidential task"
    />,
  );

  fireEvent.focus(screen.getByRole("searchbox"));
  expect(screen.queryByText("Confidential task")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  expect(screen.queryByText("Overdue task")).not.toBeInTheDocument();
  expect(screen.queryByText(/Confidential task was due/)).not.toBeInTheDocument();
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

test("renders pending return notifications and invokes onSelectNotification with tab metadata", () => {
  const onNavigate = jest.fn();
  const onSelectNotification = jest.fn();

  render(
    <Header
      inventoryRecords={[
        {
          id: 55,
          person: "Prof. Reyes",
          productName: "Wireless Mic",
          quantity: 1,
          unit: "set",
          status: "Pending Return",
        },
      ]}
      onNavigate={onNavigate}
      onSelectNotification={onSelectNotification}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
  fireEvent.click(screen.getByRole("button", { name: /pending return/i }));

  expect(onSelectNotification).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "return-pending:55",
      page: "inventory",
      tab: "pending",
    }),
  );
  expect(onNavigate).toHaveBeenCalledWith("inventory");
});

test("persists read and dismissed notifications when notificationStorageKey is provided", () => {
  window.localStorage.clear();
  const inventory = [
    { id: "supply-1", name: "Paper", quantity: 1, unit: "ream", lowStockAt: 2 },
    { id: "supply-2", name: "Markers", quantity: 1, unit: "box", lowStockAt: 2 },
  ];

  const { unmount } = render(
    <Header
      inventory={inventory}
      notificationStorageKey="officeflow.notifications.secretary"
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Notifications, 2 unread" }));
  fireEvent.click(
    screen.getByRole("button", {
      name: "Delete notification: Markers: 1 box remaining.",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
  expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();

  unmount();

  render(
    <Header
      inventory={inventory}
      notificationStorageKey="officeflow.notifications.secretary"
    />,
  );

  expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  expect(screen.getByText("Paper: 1 ream remaining.")).toBeInTheDocument();
  expect(screen.queryByText("Markers: 1 box remaining.")).not.toBeInTheDocument();
  expect(screen.getByText("All caught up")).toBeInTheDocument();

  window.localStorage.clear();
});

test("Staff sees overdue tasks and return notifications without exposing office requests", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const due = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  render(
    <Header
      role={{ id: "staff", pages: ["staff-inventory", "tasks"] }}
      requests={[
        {
          id: "DOC-9",
          student: "Dean Office",
          document: "Confidential Memo",
          status: "Waiting",
        },
      ]}
      tasks={[{ id: "task-9", title: "Submit grades", due, done: false }]}
      inventory={[
        { id: "supply-1", name: "Paper", quantity: 1, unit: "ream", lowStockAt: 2 },
      ]}
      inventoryRecords={[
        {
          id: 99,
          productName: "Projector",
          quantity: 1,
          unit: "unit",
          status: "Return Declined",
        },
      ]}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Notifications, 2 unread" }));
  expect(screen.getByText(/Submit grades was due/)).toBeInTheDocument();
  expect(screen.getByText(/Return of 1 unit of Projector was declined\./)).toBeInTheDocument();
  expect(screen.queryByText(/Confidential Memo/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Paper: 1 ream remaining/)).not.toBeInTheDocument();
});

test("does not play notification sound on initial hydration until a new alert arrives afterward", () => {
  const play = jest.fn().mockResolvedValue(undefined);
  const audioSpy = jest
    .spyOn(window, "Audio")
    .mockImplementation(() => ({ play }));

  const { rerender } = render(
    <Header isNotificationsReady={false} requests={[]} />,
  );
  expect(play).not.toHaveBeenCalled();

  rerender(
    <Header
      isNotificationsReady
      requests={[
        {
          id: "DOC-1",
          student: "Alex",
          document: "Transcript",
          status: "Waiting",
        },
      ]}
    />,
  );
  expect(play).not.toHaveBeenCalled();

  rerender(
    <Header
      isNotificationsReady
      requests={[
        {
          id: "DOC-1",
          student: "Alex",
          document: "Transcript",
          status: "Waiting",
        },
        {
          id: "DOC-2",
          student: "Sam",
          document: "Form 137",
          status: "Waiting",
        },
      ]}
    />,
  );
  expect(play).toHaveBeenCalledTimes(1);
  audioSpy.mockRestore();
});

test("confirms a pending return directly from the notification panel for roles that can manage inventory", async () => {
  const onConfirmReturn = jest.fn().mockResolvedValue(true);
  const onNavigate = jest.fn();

  render(
    <Header
      role={{ id: "secretary", can: { manageInventory: true } }}
      inventoryRecords={[
        {
          id: 71,
          person: "Prof. Reyes",
          productName: "Projector",
          quantity: 1,
          unit: "unit",
          status: "Pending Return",
        },
      ]}
      onConfirmReturn={onConfirmReturn}
      onNavigate={onNavigate}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
  fireEvent.click(
    screen.getByRole("button", {
      name: /Confirm return: Prof\. Reyes returned 1 unit of Projector/i,
    }),
  );

  expect(onConfirmReturn).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "return-pending:71",
      recordId: 71,
      page: "inventory",
      tab: "pending",
    }),
  );
  expect(onNavigate).not.toHaveBeenCalled();
  expect(
    await screen.findByRole("button", { name: "Notifications" }),
  ).toBeInTheDocument();
});

test("shows an error alert if confirming a return from notifications fails", async () => {
  const onConfirmReturn = jest
    .fn()
    .mockRejectedValue(new Error("Stock changed while confirming the return."));

  render(
    <Header
      role={{ id: "secretary", can: { manageInventory: true } }}
      inventoryRecords={[
        {
          id: 72,
          person: "Prof. Reyes",
          productName: "Projector",
          quantity: 1,
          unit: "unit",
          status: "Pending Return",
        },
      ]}
      onConfirmReturn={onConfirmReturn}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
  fireEvent.click(
    screen.getByRole("button", {
      name: /Confirm return: Prof\. Reyes returned 1 unit of Projector/i,
    }),
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Stock changed while confirming the return.",
  );
});

test("does not show the Confirm return button for view-only Dean role", () => {
  render(
    <Header
      role={{ id: "dean", can: { manageInventory: false } }}
      inventoryRecords={[
        {
          id: 73,
          person: "Prof. Reyes",
          productName: "Projector",
          quantity: 1,
          unit: "unit",
          status: "Pending Return",
        },
      ]}
      onConfirmReturn={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
  expect(screen.getByText(/Prof\. Reyes returned 1 unit of Projector/)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /confirm return/i }),
  ).not.toBeInTheDocument();
});

test("toggles the collapsible mobile search bar from the header search button", () => {
  const { container } = render(<Header search="" />);

  const toggleButton = screen.getByRole("button", { name: /show search bar/i });
  const searchContainer = container.querySelector(".app-header__search-container");

  expect(toggleButton).toHaveAttribute("aria-expanded", "false");
  expect(searchContainer).not.toHaveClass(
    "app-header__search-container--mobile-open",
  );

  fireEvent.click(toggleButton);

  expect(
    screen.getByRole("button", { name: /hide search bar/i }),
  ).toHaveAttribute("aria-expanded", "true");
  expect(searchContainer).toHaveClass(
    "app-header__search-container--mobile-open",
  );
});
