import "./InventoryReceiptModal.css";
import { Modal } from "../../../components/ui";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import {
  formatReceiptDateOnly,
  formatReceiptTimeOnly,
  computeReceiptDetails,
} from "../utils/receiptHelpers";

function InventoryReceiptModal({
  record,
  inventory = [],
  records = [],
  onClose,
}) {
  if (!record) return null;

  const details = computeReceiptDetails(record, inventory, records);
  const {
    isBorrowable,
    isReturnedStatus,
    borrowedDateTime,
    completedReturnDateTime,
    totalBorrowedQty,
    totalReturnedQty,
    remainingBorrowedQty,
    isFullyReturned,
    isPartiallyReturned,
    returnEvents,
    latestRepresentative,
    borrowerAccountName,
    hasDifferentRepresentative,
    primaryRemark,
    returnConditionNote,
    remarksHeading,
    statusPillLabel,
    statusPillVariant,
  } = details;

  return (
    <Modal
      isOpen={Boolean(record)}
      onClose={onClose}
      eyebrow="DIGITAL ACKNOWLEDGMENT RECEIPT"
      title="Supply & Equipment Slip"
      subtitle="Official transaction record for borrowed, used, or returned office items."
      titleId="inventory-receipt-title"
      className="transaction-modal receipt-modal"
    >
      <div className="inventory-receipt" aria-label="Digital receipt details">
        <div className="inventory-receipt__top">
          <div className="inventory-receipt__brand">
            <span className="inventory-receipt__logo" aria-hidden="true">
              D
            </span>
            <div className="inventory-receipt__brand-text">
              <strong>DeptDesk Office Portal</strong>
              <span>Supply &amp; Property Transaction Receipt</span>
            </div>
          </div>
          <div className="inventory-receipt__meta">
            <span className="inventory-receipt__id">{record.id}</span>
            <span className={`status-pill ${statusPillVariant}`}>
              {statusPillLabel}
            </span>
          </div>
        </div>

        <div className="inventory-receipt__dates-grid">
          {isBorrowable ? (
            <>
              <div className="inventory-receipt__field">
                <span className="inventory-receipt__label">
                  Date Borrowed / Issued
                </span>
                <span className="inventory-receipt__value">
                  {borrowedDateTime
                    ? `${formatReceiptDateOnly(borrowedDateTime)} · ${formatReceiptTimeOnly(borrowedDateTime)}`
                    : "See borrow log"}
                </span>
              </div>
              <div className="inventory-receipt__field">
                <span className="inventory-receipt__label">
                  Date &amp; Time Returned
                </span>
                <span className="inventory-receipt__value">
                  {completedReturnDateTime
                    ? `${formatReceiptDateOnly(completedReturnDateTime)} · ${formatReceiptTimeOnly(completedReturnDateTime)}`
                    : isPartiallyReturned
                      ? `Pending full return (${remainingBorrowedQty} ${record.unit} left)`
                      : "Pending return"}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="inventory-receipt__field">
                <span className="inventory-receipt__label">
                  Date Requested / Issued
                </span>
                <span className="inventory-receipt__value">
                  {formatReceiptDateOnly(record.dateTime)}
                </span>
              </div>
              <div className="inventory-receipt__field">
                <span className="inventory-receipt__label">Time Recorded</span>
                <span className="inventory-receipt__value">
                  {formatReceiptTimeOnly(record.dateTime)}
                </span>
              </div>
            </>
          )}
          <div className="inventory-receipt__field">
            <span className="inventory-receipt__label">Item Rule</span>
            <span className="inventory-receipt__value">
              {isBorrowable
                ? "Borrowable (Returnable)"
                : "Usable (Consumable)"}
            </span>
          </div>
        </div>

        <div className="inventory-receipt__details-grid">
          <div className="inventory-receipt__item-highlight">
            <div className="inventory-receipt__item-main">
              <span className="inventory-receipt__label">
                Product / Item Requested
              </span>
              <strong>{record.productName}</strong>
              <span>Product ID: {record.productId || "—"}</span>
            </div>
            <div className="inventory-receipt__qty-group">
              <span className="inventory-receipt__qty-pill">
                {isBorrowable
                  ? `${totalBorrowedQty} ${record.unit} borrowed`
                  : `${record.quantity} ${record.unit}`}
              </span>
              {isPartiallyReturned && (
                <span className="inventory-receipt__qty-sub">
                  {totalReturnedQty} returned · {remainingBorrowedQty} remaining
                </span>
              )}
            </div>
          </div>

          <div className="inventory-receipt__field">
            <span className="inventory-receipt__label">
              {isBorrowable ? "Borrowed By (Account)" : "Requested / Used By"}
            </span>
            <span className="inventory-receipt__value">
              {borrowerAccountName}
            </span>
          </div>

          <div className="inventory-receipt__field">
            <span className="inventory-receipt__label">
              {hasDifferentRepresentative
                ? "Returned By (Representative / SA)"
                : isReturnedStatus
                  ? "Return Logged At"
                  : "Transaction Logged At"}
            </span>
            <span className="inventory-receipt__value">
              {hasDifferentRepresentative
                ? `${latestRepresentative} (for ${borrowerAccountName})`
                : formatDateTime(record.dateTime)}
            </span>
          </div>
        </div>

        <div className="inventory-receipt__remarks-box">
          <span className="inventory-receipt__label">{remarksHeading}</span>
          <p className="inventory-receipt__remarks-text">
            {primaryRemark && String(primaryRemark).trim()
              ? primaryRemark
              : "No remarks specified for this transaction."}
          </p>
        </div>

        {isBorrowable && (
          <div
            className="inventory-receipt__return-box"
            aria-label="Borrowable item return section"
          >
            <div className="inventory-receipt__return-header">
              <span className="inventory-receipt__return-title">
                Borrowable Item · Return Tracking
              </span>
              <span className="inventory-usage-badge inventory-usage-badge--borrowable">
                {isFullyReturned
                  ? `Fully Returned (${totalReturnedQty}/${totalBorrowedQty} ${record.unit})`
                  : isPartiallyReturned
                    ? `Incomplete Return · ${remainingBorrowedQty} ${record.unit} Still Out`
                    : `Must Be Returned (${totalBorrowedQty} ${record.unit})`}
              </span>
            </div>
            <div className="inventory-receipt__return-lines">
              <div className="inventory-receipt__blank-field">
                <span className="inventory-receipt__label">
                  Date Borrowed / Issued
                </span>
                <div className="inventory-receipt__blank-line">
                  {borrowedDateTime ? formatDateTime(borrowedDateTime) : "\u00A0"}
                </div>
              </div>
              <div className="inventory-receipt__blank-field">
                <span className="inventory-receipt__label">
                  Date &amp; Time Returned (Full Clearance)
                </span>
                <div
                  className="inventory-receipt__blank-line"
                  data-testid="receipt-return-date-line"
                >
                  {completedReturnDateTime
                    ? formatDateTime(completedReturnDateTime)
                    : "\u00A0"}
                </div>
              </div>
              <div className="inventory-receipt__blank-field inventory-receipt__blank-field--wide">
                <span className="inventory-receipt__label">
                  Return Condition / Receiver Notes
                </span>
                <div className="inventory-receipt__blank-line">
                  {returnConditionNote
                    ? returnConditionNote
                    : isFullyReturned
                      ? "All borrowed units returned in good condition"
                      : isPartiallyReturned
                        ? `Partial return: ${totalReturnedQty} of ${totalBorrowedQty} ${record.unit} returned (${remainingBorrowedQty} ${record.unit} still unreturned)`
                        : "\u00A0"}
                </div>
              </div>
            </div>

            {returnEvents.length > 0 && (
              <div className="inventory-receipt__batch-log">
                <span className="inventory-receipt__label">
                  Return Batch History ({totalReturnedQty} of {totalBorrowedQty}{" "}
                  {record.unit} returned)
                </span>
                <ul className="inventory-receipt__batch-list">
                  {returnEvents.map((batch, index) => (
                    <li key={batch.id || index}>
                      <strong>
                        {batch.quantity} {record.unit} returned
                      </strong>{" "}
                      on {formatDateTime(batch.dateTime)}
                      {batch.returnedBy
                        ? ` · Brought back by ${batch.returnedBy}`
                        : ""}
                      {batch.remarks ? ` (${batch.remarks})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="inventory-receipt__signatures">
          <div className="inventory-receipt__sig-block">
            <div className="inventory-receipt__sig-line" />
            <strong>Borrower / Representative Signature</strong>
            <span>
              {hasDifferentRepresentative
                ? `${latestRepresentative} (for ${borrowerAccountName})`
                : `Printed Name: ${borrowerAccountName}`}
            </span>
          </div>
          <div className="inventory-receipt__sig-block">
            <div className="inventory-receipt__sig-line" />
            <strong>Issued / Verified By</strong>
            <span>Office Administrator · {formatDate(record.dateTime)}</span>
          </div>
        </div>
      </div>

      <div className="inventory-receipt__actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
        >
          Close
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => window.print()}
        >
          Print / Save PDF
        </button>
      </div>
    </Modal>
  );
}

export default InventoryReceiptModal;
