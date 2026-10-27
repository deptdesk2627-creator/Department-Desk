import { formatDateTime } from "../../../utils/formatters";
import { recordStatusClass as statusClass } from "../../../utils/inventory";

function getStaffRecordStatus(record) {
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
        label: "Borrowed · Returned",
        className: statusClass("Returned"),
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
    className: statusClass(record.status),
  };
}

function StaffHistoryTable({ records, hasName, onViewReceipt }) {
  return (
    <section
      className="card panel module-list-panel"
      aria-labelledby="staff-history-title"
    >
      <div className="panel-heading">
        <div>
          <h2 id="staff-history-title">
            My transactions <span className="count-badge">{records.length}</span>
          </h2>
          <p>Only your own borrow, use, and return records are shown.</p>
        </div>
      </div>
      {records.length ? (
        <div className="table-scroll module-table-scroll">
          <table className="request-table inventory-record-table">
            <thead>
              <tr>
                <th>Date &amp; time</th>
                <th>Name</th>
                <th>Product name</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const statusDisplay = getStaffRecordStatus(record);
                const hasRep =
                  record.returnedBy &&
                  record.person &&
                  record.returnedBy.toLowerCase() !==
                    record.person.toLowerCase();
                return (
                  <tr key={record.id}>
                    <td>{formatDateTime(record.dateTime)}</td>
                    <td>
                      {record.person || "—"}
                      {hasRep ? ` (via ${record.returnedBy})` : ""}
                    </td>
                    <td>{record.productName}</td>
                    <td>
                      {record.quantity} {record.unit}
                    </td>
                    <td>
                      <span className={`status-pill ${statusDisplay.className}`}>
                        {statusDisplay.label}
                      </span>
                    </td>
                    <td>{record.remarks || "—"}</td>
                    <td>
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
          {hasName
            ? "You have no transactions yet."
            : "Enter your name above to see your transactions."}
        </p>
      )}
    </section>
  );
}

export default StaffHistoryTable;
