import { useState } from "react";
import { Modal } from "../../../components/ui";
import { formatDateTime } from "../../../utils/formatters";

function PendingReturnsPanel({
  pendingReturns = [],
  totalPending = 0,
  isLoading = false,
  loadError = "",
  readOnly = false,
  processingIds = new Set(),
  actionError = "",
  onConfirm,
  onDecline,
  onViewReceipt,
}) {
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState("");

  async function handleDeclineSubmit(event) {
    event.preventDefault();
    if (!declineTarget) return;
    const target = declineTarget;
    const reason = declineReason.trim();
    setDeclineTarget(null);
    setDeclineReason("");
    await onDecline?.(target, reason);
  }

  return (
    <section
      className="card panel module-list-panel inventory-folder-panel inventory-folder-panel--pending"
      aria-label="Pending return confirmations"
    >
      <p className="inventory-panel-subtitle">
        {readOnly
          ? "Staff return requests currently waiting for the secretary's confirmation."
          : "Verify that each returned item has been handed back before adding it to available stock."}
      </p>

      {isLoading && (
        <p className="empty-state" role="status">
          Loading pending return confirmations...
        </p>
      )}
      {loadError && (
        <p className="empty-state" role="alert">
          {loadError}
        </p>
      )}
      {actionError && (
        <p className="empty-state inventory-pending-panel__error" role="alert">
          {actionError}
        </p>
      )}

      {pendingReturns.length ? (
        <div className="inventory-pending-list">
          {pendingReturns.map((record) => {
            const isProcessing = processingIds.has(record.id);
            const hasRep =
              record.returnedBy &&
              record.person &&
              record.returnedBy.toLowerCase() !== record.person.toLowerCase();

            return (
              <article className="inventory-pending-item" key={record.id}>
                <div className="inventory-pending-item__info">
                  <div className="inventory-pending-item__top">
                    <span className="inventory-product-id-pill">
                      {record.productId}
                    </span>
                    <strong className="inventory-pending-item__product">
                      {record.productName}
                    </strong>
                    <span className="inventory-pending-item__qty">
                      {record.quantity} {record.unit}
                    </span>
                  </div>
                  <div className="inventory-pending-item__meta">
                    <span>
                      Returned by{" "}
                      <strong>{record.person || "Staff member"}</strong>
                      {hasRep ? ` (via ${record.returnedBy})` : ""}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDateTime(record.dateTime)}</span>
                    {record.remarks && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inventory-pending-item__remarks">
                          “{record.remarks}”
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="inventory-pending-item__actions">
                  <button
                    type="button"
                    className="receipt-table-btn"
                    onClick={() => onViewReceipt?.(record)}
                    disabled={isProcessing}
                  >
                    Receipt
                  </button>
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        className="secondary-button inventory-decline-btn"
                        onClick={() => {
                          setDeclineTarget(record);
                          setDeclineReason("");
                        }}
                        disabled={isProcessing}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="primary-button inventory-confirm-btn"
                        onClick={() => onConfirm?.(record)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Confirming..." : "Confirm return"}
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        !isLoading &&
        !loadError && (
          <p className="empty-state">
            {totalPending
              ? "No pending returns match your search."
              : "No pending return confirmations right now."}
          </p>
        )
      )}

      <Modal
        isOpen={Boolean(declineTarget)}
        onClose={() => {
          setDeclineTarget(null);
          setDeclineReason("");
        }}
        eyebrow={declineTarget?.productId || "RETURN REVIEW"}
        title="Decline return request"
        subtitle={
          declineTarget
            ? `${declineTarget.productName} · ${declineTarget.quantity} ${declineTarget.unit} (${declineTarget.person || "Staff"})`
            : undefined
        }
        titleId="decline-return-title"
      >
        <form className="module-form action-form" onSubmit={handleDeclineSubmit}>
          <label className="action-form__remarks">
            Reason for declining (optional)
            <input
              autoFocus
              type="text"
              placeholder="e.g. Item has not been turned over yet / wrong quantity"
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
            />
          </label>
          <div className="form-actions action-form__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setDeclineTarget(null);
                setDeclineReason("");
              }}
            >
              Cancel
            </button>
            <button type="submit" className="danger-outline-button">
              Decline return
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

export default PendingReturnsPanel;
