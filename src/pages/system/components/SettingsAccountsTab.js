import { useState } from "react";
import { SystemIcon } from "./SystemIcons";

const ROLE_LABELS = {
  secretary: "Secretary",
  dean: "Dean",
  staff: "Faculty & Staff",
};

function SettingsAccountsTab({
  userAccounts = [],
  onApproveAccount,
  onDeclineAccount,
  onNotice,
}) {
  const [processingIds, setProcessingIds] = useState(() => new Set());
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const pendingAccounts = userAccounts.filter(
    (account) => account.approvalStatus === "pending",
  );
  const reviewedAccounts = userAccounts.filter(
    (account) => account.approvalStatus !== "pending",
  );

  async function handleAction(account, actionType) {
    const userId = account.userId ?? account.id;
    if (!userId || processingIds.has(userId)) return;

    setProcessingIds((current) => new Set(current).add(userId));
    try {
      if (actionType === "approve") {
        await onApproveAccount?.(account);
        onNotice?.({
          type: "success",
          text: `Approved ${account.username || "account"} for workspace access.`,
        });
      } else {
        await onDeclineAccount?.(account);
        onNotice?.({
          type: "success",
          text: `Declined account request for ${account.username || "user"}.`,
        });
      }
    } catch (error) {
      onNotice?.({
        type: "error",
        text:
          error?.message ||
          `Could not ${actionType} this account. Please try again.`,
      });
    } finally {
      setProcessingIds((current) => {
        const next = new Set(current);
        next.delete(userId);
        return next;
      });
    }
  }

  return (
    <section
      className="card system-card system-card--accounts"
      aria-labelledby="settings-account-approvals-title"
    >
      <div className="system-card-head system-card-head--compact">
        <div className="system-card-head__title">
          <span className="system-card-icon">
            <SystemIcon name="shield" />
          </span>
          <div>
            <h2 id="settings-account-approvals-title">
              Account approvals &amp; directory
            </h2>
            <p>
              Confirm new Faculty &amp; Staff accounts before they can sign in.
            </p>
          </div>
        </div>
        <div className="system-accounts-head-actions">
          <span
            className={`system-status-badge ${
              pendingAccounts.length > 0
                ? "system-status-badge--accent"
                : "system-status-badge--dot"
            }`}
          >
            {pendingAccounts.length > 0
              ? `${pendingAccounts.length} pending`
              : "0 pending"}
          </span>
          {reviewedAccounts.length > 0 && (
            <button
              type="button"
              className="system-accounts-toggle-btn"
              aria-expanded={isDirectoryOpen}
              onClick={() => setIsDirectoryOpen((open) => !open)}
            >
              <span>
                {isDirectoryOpen ? "Hide" : "View"} registered (
                {reviewedAccounts.length})
              </span>
              <span
                className={`system-accounts-toggle-chevron${
                  isDirectoryOpen ? " is-open" : ""
                }`}
                aria-hidden="true"
              >
                ▾
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="system-accounts-section">
        {pendingAccounts.length > 0 ? (
          <div className="system-accounts-list system-accounts-list--scroll">
            {pendingAccounts.map((account) => {
              const userId = account.userId ?? account.id;
              const isBusy = processingIds.has(userId);
              return (
                <article
                  key={userId}
                  className="system-account-row system-account-row--pending"
                >
                  <div className="system-account-row__info">
                    <span className="system-account-row__avatar">
                      <SystemIcon name="user" size={14} />
                    </span>
                    <div className="system-account-row__text">
                      <strong>{account.username || "New User"}</strong>
                      <span>
                        {account.email ? `${account.email} · ` : ""}
                        {ROLE_LABELS[account.role] || "Faculty & Staff"}
                      </span>
                    </div>
                  </div>
                  <div className="system-account-row__actions">
                    <button
                      type="button"
                      className="secondary-button system-account-btn"
                      disabled={isBusy}
                      onClick={() => handleAction(account, "decline")}
                      aria-label={`Decline account for ${account.username}`}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      className="primary-button system-account-btn"
                      disabled={isBusy}
                      onClick={() => handleAction(account, "approve")}
                      aria-label={`Approve account for ${account.username}`}
                    >
                      {isBusy ? "Saving..." : "Approve"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="system-account-empty">
            <span>✓</span>
            <p>
              No pending account requests right now. New staff sign-ups appear
              here and in your notification bell.
            </p>
          </div>
        )}
      </div>

      {isDirectoryOpen && reviewedAccounts.length > 0 && (
        <div className="system-accounts-section system-accounts-section--directory">
          <div className="system-accounts-list system-accounts-list--scroll">
            {reviewedAccounts.map((account) => {
              const userId = account.userId ?? account.id;
              const isBusy = processingIds.has(userId);
              const isDeclined = account.approvalStatus === "declined";
              return (
                <article key={userId} className="system-account-row">
                  <div className="system-account-row__info">
                    <span className="system-account-row__avatar">
                      <SystemIcon name="user" size={14} />
                    </span>
                    <div className="system-account-row__text">
                      <strong>{account.username}</strong>
                      <span>
                        {account.email ? `${account.email} · ` : ""}
                        {ROLE_LABELS[account.role] || account.role}
                        {account.approvedBy
                          ? ` · ${isDeclined ? "Declined" : "Approved"} by ${account.approvedBy}`
                          : ""}
                      </span>
                    </div>
                  </div>
                  <div className="system-account-row__actions">
                    <span
                      className={`system-status-badge system-status-badge--sm ${
                        isDeclined
                          ? "system-status-badge--neutral"
                          : "system-status-badge--dot"
                      }`}
                    >
                      {isDeclined ? "Declined" : "Approved"}
                    </span>
                    {isDeclined && (
                      <button
                        type="button"
                        className="secondary-button system-account-btn"
                        disabled={isBusy}
                        onClick={() => handleAction(account, "approve")}
                        aria-label={`Approve account for ${account.username}`}
                      >
                        {isBusy ? "Saving..." : "Approve"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default SettingsAccountsTab;
