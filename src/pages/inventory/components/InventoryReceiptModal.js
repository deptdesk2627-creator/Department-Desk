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

function InventoryReceiptModal({
  record,
  inventory = [],
  records = [],
  onClose,
}) {
  if (!record) return null;

  const allRecords = Array.isArray(records) ? records.filter(Boolean) : [];
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

  const isReturnedStatus = record.status === "Returned";

  // Link Borrowed <-> Returned records
  const linkedBorrowRecord = isReturnedStatus
    ? allRecords.find(
        (entry) =>
          entry.id === record.borrowRecordId ||
          (entry.productId === record.productId &&
            entry.status === "Borrowed" &&
            (!record.person ||
              !entry.person ||
              String(entry.person).toLowerCase() ===
                String(record.person).toLowerCase())),
      )
    : record.status === "Borrowed"
      ? allRecords.find((entry) => entry.id === record.id) || record
      : null;

  const matchingReturnRecords = isBorrowable
    ? allRecords.filter((entry) => {
        if (entry.status !== "Returned" || entry.productId !== record.productId) {
          return false;
        }
        if (linkedBorrowRecord && entry.borrowRecordId === linkedBorrowRecord.id) {
          return true;
        }
        if (isReturnedStatus && entry.id === record.id) {
          return true;
        }
        if (
          linkedBorrowRecord &&
          (!linkedBorrowRecord.person ||
            !entry.person ||
            String(entry.person).toLowerCase() ===
              String(linkedBorrowRecord.person).toLowerCase()) &&
          new Date(entry.dateTime).getTime() >=
            new Date(linkedBorrowRecord.dateTime).getTime()
        ) {
          return true;
        }
        return false;
      })
    : [];

  const totalBorrowedQty = isReturnedStatus
    ? Number(
        record.borrowedQuantity ||
          linkedBorrowRecord?.quantity ||
          record.quantity,
      ) || 0
    : Number(record.quantity) || 0;

  const totalReturnedQty = (() => {
    if (!isBorrowable) return 0;
    if (
      linkedBorrowRecord &&
      typeof linkedBorrowRecord.returnedQuantity === "number"
    ) {
      return Math.min(totalBorrowedQty, linkedBorrowRecord.returnedQuantity);
    }
    if (typeof record.cumulativeReturnedQuantity === "number") {
      return Math.min(totalBorrowedQty, record.cumulativeReturnedQuantity);
    }
    if (matchingReturnRecords.length > 0) {
      const summed = matchingReturnRecords.reduce(
        (sum, r) => sum + (Number(r.quantity) || 0),
        0,
      );
      return Math.min(totalBorrowedQty, summed);
    }
    if (record.returnedAt && !record.isPartialReturn) {
      return totalBorrowedQty;
    }
    if (isReturnedStatus && !record.isPartialReturn && !record.borrowedQuantity) {
      return totalBorrowedQty;
    }
    return 0;
  })();

  const remainingBorrowedQty = Math.max(0, totalBorrowedQty - totalReturnedQty);
  const isFullyReturned =
    isBorrowable && totalBorrowedQty > 0 && remainingBorrowedQty === 0;
  const isPartiallyReturned =
    isBorrowable && totalReturnedQty > 0 && remainingBorrowedQty > 0;

  const borrowedDateTime = isReturnedStatus
    ? record.borrowedAt || linkedBorrowRecord?.dateTime || null
    : record.dateTime;

  // ONLY populate the final Date & Time Returned when 100% of the borrowed quantity has been returned!
  const completedReturnDateTime = isFullyReturned
    ? (isReturnedStatus
        ? record.returnedAt || record.dateTime
        : linkedBorrowRecord?.returnedAt ||
          record.returnedAt ||
          matchingReturnRecords[0]?.dateTime) || null
    : null;

  const returnEvents = (() => {
    if (
      Array.isArray(linkedBorrowRecord?.returnEvents) &&
      linkedBorrowRecord.returnEvents.length > 0
    ) {
      return linkedBorrowRecord.returnEvents;
    }
    if (Array.isArray(record.returnEvents) && record.returnEvents.length > 0) {
      return record.returnEvents;
    }
    if (matchingReturnRecords.length > 0) {
      return [...matchingReturnRecords]
        .reverse()
        .map((r) => ({
          id: r.id,
          dateTime: r.dateTime,
          quantity: r.quantity,
          person: r.person,
          returnedBy: r.returnedBy || r.person,
          remarks: r.returnRemarks || r.remarks,
        }));
    }
    return [];
  })();

  const latestRepresentative =
    record.returnedBy ||
    returnEvents[returnEvents.length - 1]?.returnedBy ||
    "";

  const borrowerAccountName =
    record.person || linkedBorrowRecord?.person || "Office Personnel";

  const hasDifferentRepresentative =
    Boolean(latestRepresentative) &&
    latestRepresentative.toLowerCase() !== borrowerAccountName.toLowerCase();

  const primaryRemark = isReturnedStatus
    ? record.borrowRemarks ||
      linkedBorrowRecord?.remarks ||
      record.remarks ||
      ""
    : record.remarks || "";

  const returnConditionNote = isReturnedStatus
    ? record.returnRemarks ||
      (record.borrowRemarks || linkedBorrowRecord?.remarks
        ? record.remarks !==
          (record.borrowRemarks || linkedBorrowRecord?.remarks)
          ? record.remarks
          : ""
        : record.remarks || "")
    : linkedBorrowRecord?.returnRemarks ||
      record.returnRemarks ||
      returnEvents[returnEvents.length - 1]?.remarks ||
      "";

  const remarksHeading = isBorrowable
    ? "Remark / Reason for Borrowing"
    : "Remark / Purpose of Request";

  const statusPillLabel = isPartiallyReturned
    ? `Partially Returned (${totalReturnedQty}/${totalBorrowedQty})`
    : isFullyReturned
      ? record.status === "Borrowed"
        ? `Borrowed · Returned (${totalReturnedQty}/${totalBorrowedQty})`
        : `Returned (${totalReturnedQty}/${totalBorrowedQty})`
      : record.status;

  const statusPillVariant = isPartiallyReturned
    ? "status-waiting"
    : isFullyReturned
      ? recordStatusClass("Returned")
      : recordStatusClass(record.status);

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
