import "./InventoryReceiptModal.css";
import { Modal } from "../../../components/ui";
import { getProductId } from "../../../hooks/useInventoryActions";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import {
  getItemUsageType,
  recordStatusClass,
} from "../../../utils/inventory";

function formatReceiptDateOnly(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatReceiptTimeOnly(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function InventoryReceiptModal({ record, inventory = [], onClose }) {
  if (!record) return null;

  const matchedItem = (Array.isArray(inventory) ? inventory : []).find(
    (item) =>
      item &&
      (getProductId(item) === record.productId ||
        item.productId === record.productId ||
        item.name === record.productName),
  );

  const resolvedUsageType =
    record.usageType ||
    (record.status === "Borrowed" || record.status === "Returned"
      ? "Borrowable"
      : matchedItem
        ? getItemUsageType(matchedItem)
        : "Usable");

  const isBorrowable =
    resolvedUsageType === "Borrowable" ||
    record.status === "Borrowed" ||
    record.status === "Returned";

  const isReturned = record.status === "Returned";

  const remarksHeading =
    record.status === "Borrowed"
      ? "Remark / Reason for Borrowing"
      : record.status === "Returned"
        ? "Condition / Remark on Return"
        : "Remark / Purpose of Request";

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
            <span
              className={`status-pill ${recordStatusClass(record.status)}`}
            >
              {record.status}
            </span>
          </div>
        </div>

        <div className="inventory-receipt__dates-grid">
          <div className="inventory-receipt__field">
            <span className="inventory-receipt__label">
              {isReturned ? "Date Logged" : "Date Requested / Issued"}
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
            <span className="inventory-receipt__qty-pill">
              {record.quantity} {record.unit}
            </span>
          </div>

          <div className="inventory-receipt__field">
            <span className="inventory-receipt__label">
              {record.status === "Borrowed"
                ? "Borrowed By"
                : record.status === "Returned"
                  ? "Returned By"
                  : "Requested / Used By"}
            </span>
            <span className="inventory-receipt__value">
              {record.person || "Office Personnel"}
            </span>
          </div>

          <div className="inventory-receipt__field">
            <span className="inventory-receipt__label">Full Timestamp</span>
            <span className="inventory-receipt__value">
              {formatDateTime(record.dateTime)}
            </span>
          </div>
        </div>

        <div className="inventory-receipt__remarks-box">
          <span className="inventory-receipt__label">{remarksHeading}</span>
          <p className="inventory-receipt__remarks-text">
            {record.remarks && String(record.remarks).trim()
              ? record.remarks
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
                {isReturned ? "Returned to Stock" : "Must Be Returned"}
              </span>
            </div>
            <div className="inventory-receipt__return-lines">
              <div className="inventory-receipt__blank-field">
                <span className="inventory-receipt__label">
                  Date Borrowed / Issued
                </span>
                <div className="inventory-receipt__blank-line">
                  {isReturned ? "—" : formatDate(record.dateTime)}
                </div>
              </div>
              <div className="inventory-receipt__blank-field">
                <span className="inventory-receipt__label">Date Returned</span>
                <div
                  className="inventory-receipt__blank-line"
                  data-testid="receipt-return-date-line"
                >
                  {isReturned ? formatDateTime(record.dateTime) : "\u00A0"}
                </div>
              </div>
              <div className="inventory-receipt__blank-field inventory-receipt__blank-field--wide">
                <span className="inventory-receipt__label">
                  Return Condition / Receiver Notes
                </span>
                <div className="inventory-receipt__blank-line">
                  {isReturned && record.remarks ? record.remarks : "\u00A0"}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="inventory-receipt__signatures">
          <div className="inventory-receipt__sig-block">
            <div className="inventory-receipt__sig-line" />
            <strong>Borrower / Requester Signature</strong>
            <span>Printed Name: {record.person || "____________________"}</span>
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

