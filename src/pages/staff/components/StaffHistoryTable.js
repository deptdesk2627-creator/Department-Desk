import { formatDateTime } from "../../../utils/formatters";
import {
  PENDING_RETURN_STATUS,
  recordStatusClass as statusClass,
  RETURN_DECLINED_STATUS,
} from "../../../utils/inventory";

function getStaffRecordStatus(record) {
  if (record.status === PENDING_RETURN_STATUS) {
    return {
      label: "Pending Confirmation",
      className: statusClass(PENDING_RETURN_STATUS),
    };
  }
  if (record.status === RETURN_DECLINED_STATUS) {
    return {
      label: "Return Declined",
      className: statusClass(RETURN_DECLINED_STATUS),
    };
  }
  if (record.status === "Borrowed") {
    const borrowed = Number(record.quantity) || 0;
    const returned = Number(record.returnedQuantity) || 0;
    const pendingReturn = Number(record.pendingReturnQuantity) || 0;
    if (returned > 0 && returned < borrowed) {
      return {
        label:
          pendingReturn > 0
            ? `Partially Returned (${returned}/${borrowed} · ${pendingReturn} pending)`
            : `Partially Returned (${returned}/${borrowed})`,
        className: "status-waiting",
      };
    }
    if (returned === 0 && pendingReturn > 0) {
      return {
        label: `Pending Return (${pendingReturn}/${borrowed})`,
        className: "status-pending",
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

function StaffHistoryTable({
  records,
  hasName,
  isLoading = false,
  loadError = "",
  onViewReceipt,
}) {
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
      {isLoading && (
        <p className="empty-state" role="status">
          Loading your transactions...
        </p>
      )}
      {loadError && (
        <p className="empty-state" role="alert">
          {loadError}
        </p>
      )}
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
                      <div className="staff-status-cell">
                        <span className={`status-pill ${statusDisplay.className}`}>
                          {statusDisplay.label}
                        </span>
                        {record.status === "Returned" && record.receivedBy && (
                          <span className="staff-confirmed-by">
                            Confirmed by {record.receivedBy}
                          </span>
                        )}
                      </div>
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
        !isLoading &&
        !loadError && (
          <p className="empty-state">
            {hasName
              ? "You have no transactions yet."
              : "Sign in with your linked account to view your transactions."}
          </p>
        )
      )}
    </section>
  );
}

export default StaffHistoryTable;
