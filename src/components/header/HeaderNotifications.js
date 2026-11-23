import { useEffect, useMemo, useRef, useState } from "react";
import "./HeaderNotifications.css";
import { getNotifications } from "../../utils/headerHelpers";

const NOTIFICATION_SOUND_URL = `${process.env.PUBLIC_URL || ""}/sound-message.mp3`;

function readStoredNotificationIds(key) {
  if (!key || typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function writeStoredNotificationIds(key, ids) {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage errors
  }
}

function HeaderNotifications({
  requests,
  tasks,
  inventory,
  inventoryRecords = [],
  pendingAccounts = [],
  roleId = "secretary",
  settings,
  isReady = true,
  storageKey = "",
  isOpen,
  onClose,
  onToggle,
  onNavigate,
  onSelectNotification,
  onConfirmReturn,
  onApproveAccount,
  notificationRef,
  notificationButtonRef,
}) {
  const readStorageKey = storageKey ? `${storageKey}.read` : "";
  const dismissedStorageKey = storageKey ? `${storageKey}.dismissed` : "";

  const [readNotificationIds, setReadNotificationIds] = useState(() =>
    readStoredNotificationIds(readStorageKey),
  );
  const previousNotificationIds = useRef(null);
  const lastStorageKeyRef = useRef(storageKey);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(() =>
    readStoredNotificationIds(dismissedStorageKey),
  );
  const [confirmingIds, setConfirmingIds] = useState(() => new Set());
  const [actionError, setActionError] = useState("");
  const isSoundMuted =
    settings?.notifySound === false ||
    settings?.muteNotificationSound === true;

  useEffect(() => {
    if (lastStorageKeyRef.current === storageKey) return;
    lastStorageKeyRef.current = storageKey;
    previousNotificationIds.current = null;
    setReadNotificationIds(readStoredNotificationIds(readStorageKey));
    setDismissedNotificationIds(readStoredNotificationIds(dismissedStorageKey));
  }, [storageKey, readStorageKey, dismissedStorageKey]);

  const notifications = useMemo(
    () =>
      isReady
        ? getNotifications(
            requests,
            tasks,
            inventory,
            settings,
            inventoryRecords,
            roleId,
            pendingAccounts,
          ).filter(
            (notification) => !dismissedNotificationIds.has(notification.id),
          )
        : [],
    [
      isReady,
      requests,
      tasks,
      inventory,
      settings,
      inventoryRecords,
      roleId,
      pendingAccounts,
      dismissedNotificationIds,
    ],
  );
  useEffect(() => {
    if (!isReady) {
      previousNotificationIds.current = null;
      return;
    }

    const currentNotificationIds = new Set(
      notifications.map((notification) => notification.id),
    );
    const previousIds = previousNotificationIds.current;

    if (
      previousIds &&
      !isSoundMuted &&
      notifications.some(
        (notification) => !previousIds.has(notification.id),
      )
    ) {
      const sound = new Audio(NOTIFICATION_SOUND_URL);
      sound.play().catch((error) => {
        if (error?.name !== "NotAllowedError") {
          console.error("Could not play the notification sound.", error);
        }
      });
    }

    previousNotificationIds.current = currentNotificationIds;
  }, [isReady, isSoundMuted, notifications]);
  const unreadCount = notifications.filter(
    (notification) => !readNotificationIds.has(notification.id),
  ).length;

  function markAllNotificationsRead() {
    setReadNotificationIds((current) => {
      const next = new Set(current);
      notifications.forEach((notification) => next.add(notification.id));
      writeStoredNotificationIds(readStorageKey, next);
      return next;
    });
  }

  function dismissNotification(notificationId) {
    setDismissedNotificationIds((current) => {
      const next = new Set(current).add(notificationId);
      writeStoredNotificationIds(dismissedStorageKey, next);
      return next;
    });
  }

  function openNotification(notification) {
    setReadNotificationIds((current) => {
      const next = new Set(current).add(notification.id);
      writeStoredNotificationIds(readStorageKey, next);
      return next;
    });
    onClose();
    onSelectNotification?.(notification);
    onNavigate?.(notification.page);
  }

  async function handleConfirmReturn(notification) {
    if (!onConfirmReturn || !notification?.recordId) return;
    if (confirmingIds.has(notification.id)) return;

    setActionError("");
    setConfirmingIds((current) => new Set(current).add(notification.id));
    try {
      await onConfirmReturn(notification);
      setReadNotificationIds((current) => {
        const next = new Set(current).add(notification.id);
        writeStoredNotificationIds(readStorageKey, next);
        return next;
      });
    } catch (error) {
      setActionError(
        error?.message || "Could not confirm this return. Please try again.",
      );
    } finally {
      setConfirmingIds((current) => {
        const next = new Set(current);
        next.delete(notification.id);
        return next;
      });
    }
  }

  async function handleApproveAccount(notification) {
    if (!onApproveAccount || !notification?.accountUserId) return;
    if (confirmingIds.has(notification.id)) return;

    setActionError("");
    setConfirmingIds((current) => new Set(current).add(notification.id));
    try {
      await onApproveAccount(notification);
      setReadNotificationIds((current) => {
        const next = new Set(current).add(notification.id);
        writeStoredNotificationIds(readStorageKey, next);
        return next;
      });
    } catch (error) {
      setActionError(
        error?.message || "Could not approve this account. Please try again.",
      );
    } finally {
      setConfirmingIds((current) => {
        const next = new Set(current);
        next.delete(notification.id);
        return next;
      });
    }
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
          {actionError && (
            <p className="app-header__notification-error" role="alert">
              {actionError}
            </p>
          )}
          {notifications.length ? (
            <div className="app-header__notification-list">
              {notifications.map((notification) => {
                const isRead = readNotificationIds.has(notification.id);
                const canConfirm = Boolean(
                  onConfirmReturn && notification.recordId,
                );
                const canApprove = Boolean(
                  onApproveAccount && notification.accountUserId,
                );
                const isConfirming = confirmingIds.has(notification.id);
                return (
                  <div
                    className="app-header__notification-row"
                    key={notification.id}
                  >
                    <div className="app-header__notification-body">
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
                      {canConfirm && (
                        <div className="app-header__notification-actions">
                          <button
                            className="app-header__notification-confirm"
                            type="button"
                            disabled={isConfirming}
                            aria-label={`Confirm return: ${notification.message}`}
                            onClick={() => handleConfirmReturn(notification)}
                          >
                            {isConfirming ? "Confirming..." : "Confirm return"}
                          </button>
                        </div>
                      )}
                      {canApprove && (
                        <div className="app-header__notification-actions">
                          <button
                            className="app-header__notification-confirm"
                            type="button"
                            disabled={isConfirming}
                            aria-label={`Approve account: ${notification.message}`}
                            onClick={() => handleApproveAccount(notification)}
                          >
                            {isConfirming ? "Approving..." : "Approve account"}
                          </button>
                        </div>
                      )}
                    </div>
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
