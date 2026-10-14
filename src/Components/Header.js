import { useEffect, useRef, useState } from "react";
import "./Header.css";
import {
  getRequestStatus,
  isRequestWaiting,
} from "../utils/requestStatus";

function getNotifications(requests, tasks, inventory) {
  const waitingRequests = (Array.isArray(requests) ? requests : [])
    .filter((request) => request && isRequestWaiting(request.status))
    .map((request) => ({
      id: `request:${request.id}`,
      title: "Request waiting",
      message: `${request.student || "A request"}${request.document ? ` · ${request.document}` : ""} is waiting for action.`,
      page: "transactions",
    }));

  const lowStockItems = (Array.isArray(inventory) ? inventory : [])
    .filter(
      (item) =>
        item &&
        Number.isFinite(Number(item.quantity)) &&
        Number(item.quantity) <= Number(item.lowStockAt || 0),
    )
    .map((item) => ({
      id: `inventory:${item.id}:${item.quantity}`,
      title: "Low stock",
      message: `${item.name}: ${item.quantity} ${item.unit} remaining.`,
      page: "inventory",
    }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = (Array.isArray(tasks) ? tasks : [])
    .filter(
      (task) =>
        task &&
        !task.done &&
        task.due &&
        !Number.isNaN(new Date(`${task.due}T00:00:00`).getTime()) &&
        new Date(`${task.due}T00:00:00`) < today,
    )
    .map((task) => ({
      id: `task:${task.id}:${task.due}`,
      title: "Overdue task",
      message: `${task.title} was due ${task.due}.`,
      page: "tasks",
    }));

  return [...waitingRequests, ...lowStockItems, ...overdueTasks];
}

function getSearchResults(requests, tasks, inventory, search) {
  const query = String(search || "").trim().toLowerCase();
  const matchesQuery = (item) =>
    !query ||
    Object.values(item).some(
      (value) =>
        (typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean") &&
        String(value).toLowerCase().includes(query),
    );

  return [
    ...(Array.isArray(requests) ? requests : [])
      .filter((request) => request && matchesQuery(request))
      .map((request) => ({
        id: `request:${request.id}`,
        type: "request",
        title: request.document || request.student || "Request",
        subtitle: `Request · ${request.id || "No ID"} · ${getRequestStatus(request.status)}`,
        page: "transactions",
      })),
    ...(Array.isArray(tasks) ? tasks : [])
      .filter((task) => task && matchesQuery(task))
      .map((task) => ({
        id: `task:${task.id}`,
        type: "task",
        title: task.title || "Untitled task",
        subtitle: `Task · ${task.id || "No ID"} · ${task.status || (task.done ? "Done" : "Open")}`,
        page: "tasks",
      })),
    ...(Array.isArray(inventory) ? inventory : [])
      .filter((item) => item && matchesQuery(item))
      .map((item) => ({
        id: `inventory:${item.id}`,
        type: "inventory",
        title: item.name || "Supply",
        subtitle: `Supply · ${item.productId || item.id || "No ID"} · ${item.quantity ?? 0} ${item.unit || "units"}`,
        page: "inventory",
      })),
  ].slice(0, 6);
}

function Header({
  requests = [],
  tasks = [],
  inventory = [],
  search = "",
  onSearchChange,
  onNavigate,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [areNotificationsOpen, setAreNotificationsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState(
    () => new Set(),
  );
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(
    () => new Set(),
  );
  const profileRef = useRef(null);
  const profileButtonRef = useRef(null);
  const notificationRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchRef = useRef(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchResults = getSearchResults(requests, tasks, inventory, search);
  const notifications = getNotifications(requests, tasks, inventory).filter(
    (notification) => !dismissedNotificationIds.has(notification.id),
  );
  const unreadCount = notifications.filter(
    (notification) => !readNotificationIds.has(notification.id),
  ).length;

  useEffect(() => {
    if (!isMenuOpen && !areNotificationsOpen) return undefined;

    function handlePointerDown(event) {
      if (!profileRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (!notificationRef.current?.contains(event.target)) {
        setAreNotificationsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setAreNotificationsOpen(false);
        if (areNotificationsOpen) {
          notificationButtonRef.current?.focus();
        } else {
          profileButtonRef.current?.focus();
        }
        return;
      }

      if (areNotificationsOpen) return;
      const menuItems =
        profileRef.current?.querySelectorAll('[role="menuitem"]');
      if (!menuItems?.length || !profileRef.current?.contains(event.target))
        return;

      const currentIndex = Array.from(menuItems).indexOf(
        document.activeElement,
      );
      let nextIndex;
      if (event.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % menuItems.length;
      } else if (event.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = menuItems.length - 1;
      }

      if (nextIndex !== undefined) {
        event.preventDefault();
        menuItems[nextIndex].focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, areNotificationsOpen]);

  useEffect(() => {
    function handleSearchShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleSearchShortcut);
    return () => document.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return undefined;

    function handleMouseDown(event) {
      if (!searchRef.current?.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isSearchOpen]);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function openNotifications() {
    setAreNotificationsOpen((open) => !open);
    setIsMenuOpen(false);
  }

  function markAllNotificationsRead() {
    setReadNotificationIds((current) => {
      const next = new Set(current);
      notifications.forEach((notification) => next.add(notification.id));
      return next;
    });
  }

  function dismissNotification(notificationId) {
    setDismissedNotificationIds((current) =>
      new Set(current).add(notificationId),
    );
  }

  function openNotification(notification) {
    setReadNotificationIds((current) => new Set(current).add(notification.id));
    setAreNotificationsOpen(false);
    onNavigate?.(notification.page);
  }

  return (
    <header className="app-header">
      <div className="app-header__search-container" ref={searchRef}>
        <label className="app-header__search">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            id="global-search"
            ref={searchInputRef}
            type="search"
            aria-label="Search documents, tasks, and inventory"
            aria-keyshortcuts="Control+K Meta+K"
            aria-expanded={isSearchOpen}
            aria-controls="search-results-dropdown"
            placeholder="Search documents, tasks, inventory..."
            value={search}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(event) => {
              setIsSearchOpen(true);
              onSearchChange?.(event.target.value);
            }}
          />
        </label>
        {isSearchOpen && (
          <div
            className="search-results-dropdown"
            id="search-results-dropdown"
            role="list"
            aria-label="Search results"
          >
            {searchResults.length ? (
              searchResults.map((result) => (
                <button
                  className="search-result-card"
                  key={result.id}
                  type="button"
                  role="listitem"
                  onClick={() => {
                    setIsSearchOpen(false);
                    onNavigate?.(result.page);
                  }}
                >
                  <span className="search-result-card__icon" aria-hidden="true">
                    {result.type === "request" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 3.75h7l4 4v12.5H7z" />
                        <path d="M14 3.75v4h4M10 12h5M10 15.5h5" />
                      </svg>
                    )}
                    {result.type === "task" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="5" width="14" height="16" rx="2" />
                        <path d="M9 5V3.75h6V5M8.5 11h7M8.5 15h7" />
                      </svg>
                    )}
                    {result.type === "inventory" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m4 7 8-4 8 4v10l-8 4-8-4z" />
                        <path d="m4 7 8 4 8-4M12 11v10M8 5l8 4" />
                      </svg>
                    )}
                  </span>
                  <span className="search-result-card__content">
                    <strong>{result.title}</strong>
                    <span>{result.subtitle}</span>
                  </span>
                </button>
              ))
            ) : (
              <p className="search-results-dropdown__empty">
                No matching results.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="app-header__actions">
        <button
          className="app-header__new-request"
          type="button"
          onClick={() => onNavigate?.("transactions")}
        >
          <span aria-hidden="true">＋</span> New request
        </button>
        <div className="app-header__notifications" ref={notificationRef}>
          <button
            className="app-header__notification"
            type="button"
            aria-label={
              unreadCount
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            aria-expanded={areNotificationsOpen}
            aria-haspopup="dialog"
            aria-controls="notifications-panel"
            onClick={openNotifications}
            ref={notificationButtonRef}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
            {unreadCount > 0 && (
              <span
                className="app-header__notification-dot"
                aria-hidden="true"
              />
            )}
          </button>

          {areNotificationsOpen && (
            <section
              className="app-header__notification-panel"
              id="notifications-panel"
              role="dialog"
              aria-labelledby="notifications-heading"
            >
              <div className="app-header__notification-heading">
                <div>
                  <h2 id="notifications-heading">Notifications</h2>
                  <span>
                    {unreadCount ? `${unreadCount} unread` : "All caught up"}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllNotificationsRead}>
                    Mark all as read
                  </button>
                )}
              </div>
              {notifications.length ? (
                <div className="app-header__notification-list">
                  {notifications.map((notification) => {
                    const isRead = readNotificationIds.has(notification.id);
                    return (
                      <div
                        className="app-header__notification-row"
                        key={notification.id}
                      >
                        <button
                          className={`app-header__notification-item${isRead ? "" : " app-header__notification-item--unread"}`}
                          type="button"
                          onClick={() => openNotification(notification)}
                        >
                          <span
                            className="app-header__notification-item-dot"
                            aria-hidden="true"
                          />
                          <span>
                            <strong>{notification.title}</strong>
                            <span>{notification.message}</span>
                          </span>
                        </button>
                        <button
                          className="app-header__notification-delete"
                          type="button"
                          aria-label={`Delete notification: ${notification.message}`}
                          title="Delete notification"
                          onClick={() => dismissNotification(notification.id)}
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="app-header__notification-empty">
                  There are no new notifications.
                </p>
              )}
            </section>
          )}
        </div>

        <div className="app-header__profile" ref={profileRef}>
          <button
            className="app-header__profile-button"
            id="profile-menu-trigger"
            type="button"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            aria-controls="profile-menu"
            onClick={() => {
              setIsMenuOpen((open) => !open);
              setAreNotificationsOpen(false);
            }}
            ref={profileButtonRef}
          >
            <span className="app-header__avatar" aria-hidden="true">
              CG
            </span>
            <span className="app-header__name">Cha Gamay</span>
            <svg
              className={`app-header__chevron${isMenuOpen ? " app-header__chevron--open" : ""}`}
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path d="m5 7.5 5 5 5-5" />
            </svg>
          </button>

          {isMenuOpen && (
            <div
              className="app-header__menu"
              id="profile-menu"
              role="menu"
              aria-labelledby="profile-menu-trigger"
            >
              <div className="app-header__menu-heading">
                <span>Signed in as</span>
                <strong>Cha Gamay</strong>
              </div>
              <div className="app-header__menu-divider" />
              <button type="button" role="menuitem" onClick={closeMenu}>
                Profile
              </button>
              <button type="button" role="menuitem" onClick={closeMenu}>
                Settings
              </button>
              <button
                className="app-header__logout"
                type="button"
                role="menuitem"
                onClick={closeMenu}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
