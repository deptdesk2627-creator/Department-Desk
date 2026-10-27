import { formatDateTime } from "../../../utils/formatters";
import { recordStatusClass } from "../../../utils/inventory";

function getRecordStatusDisplay(record) {
  if (record.status === "Borrowed") {
    const borrowed = Number(record.quantity) || 0;
    const returned = Number(record.returnedQuantity) || 0;
    if (returned > 0 && returned < borrowed) {
      return {
        label: `Partially Returned (${returned}/${borrowed})`,
        className: "status-waiting",
      };
    }
    if (borrowed > 0 && returned >= borrowed) {
      return {
        label: `Borrowed · Returned`,
        className: recordStatusClass("Returned"),
      };
    }
  }
  if (record.status === "Returned" && record.isPartialReturn) {
    return {
      label: `Partial Return (${record.cumulativeReturnedQuantity}/${record.borrowedQuantity})`,
      className: "status-waiting",
    };
  }
  return {
    label: record.status,
    className: recordStatusClass(record.status),
  };
}

function InventoryRecords({ records, totalRecords, onViewReceipt }) {
  return (
    <section
      className="card panel module-list-panel inventory-folder-panel inventory-folder-panel--transactions"
      aria-label="Transaction records"
    >
      <p className="inventory-panel-subtitle">
        History of borrowed, used, and returned products with digital receipts.
      </p>
      {records.length ? (
        <div className="inventory-table-wrap">
          <table className="request-table inventory-record-table inventory-transactions-table">
            <thead>
              <tr>
                <th>ID No.</th>
                <th>Date &amp; Time</th>
                <th>Name</th>
                <th>Product-ID No.</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Remark / Purpose</th>
                <th>Status</th>
                <th className="inventory-status-col">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const statusDisplay = getRecordStatusDisplay(record);
                const hasRep =
                  record.returnedBy &&
                  record.person &&
                  record.returnedBy.toLowerCase() !==
                    record.person.toLowerCase();
                return (
                  <tr key={record.id}>
                    <td>
                      <strong className="record-id-text">{record.id}</strong>
                    </td>
                    <td className="record-date-cell">
                      {formatDateTime(record.dateTime)}
                    </td>
                    <td className="record-person-cell">
                      {record.person || "—"}
                      {hasRep ? ` (via ${record.returnedBy})` : ""}
                    </td>
                    <td className="record-product-id-cell">
                      {record.productId}
                    </td>
                    <td className="record-product-name-cell">
                      {record.productName}
                    </td>
                    <td className="record-quantity-cell">
                      <strong>
                        {record.quantity} {record.unit}
                      </strong>
                    </td>
                    <td className="record-remarks-cell">
                      {record.remarks || "—"}
                    </td>
                    <td>
                      <span className={`status-pill ${statusDisplay.className}`}>
                        {statusDisplay.label}
                      </span>
                    </td>
                    <td className="inventory-status-col">
                      <button
                        type="button"
                        className="receipt-table-btn"
                        onClick={() => onViewReceipt?.(record)}
                        aria-label={`View receipt for ${record.productName}`}
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state">
          {totalRecords
            ? "No records match this filter or search."
            : "No inventory transactions yet. Borrow, use, or return an item to create a record."}
        </p>
      )}
    </section>
  );
}

export default InventoryRecords;

