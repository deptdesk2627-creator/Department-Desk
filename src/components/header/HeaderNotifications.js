import { useMemo, useState } from "react";
import "./HeaderNotifications.css";
import { getNotifications } from "../../utils/headerHelpers";

function HeaderNotifications({
  requests,
  tasks,
  inventory,
  isOpen,
  onClose,
  onToggle,
  onNavigate,
  notificationRef,
  notificationButtonRef,
}) {
  const [readNotificationIds, setReadNotificationIds] = useState(() => new Set());
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(
    () => new Set(),
  );
  const notifications = useMemo(
    () =>
      getNotifications(requests, tasks, inventory).filter(
        (notification) => !dismissedNotificationIds.has(notification.id),
      ),
    [requests, tasks, inventory, dismissedNotificationIds],
  );
  const unreadCount = notifications.filter(
    (notification) => !readNotificationIds.has(notification.id),
  ).length;

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
    onClose();
    onNavigate?.(notification.page);
  }

  return (
    <div className="app-header__notifications" ref={notificationRef}>
      <button
        className="app-header__notification"
        type="button"
        aria-label={
          unreadCount
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="notifications-panel"
        onClick={() => onToggle()}
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

      {isOpen && (
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
  );
}

export default HeaderNotifications;
