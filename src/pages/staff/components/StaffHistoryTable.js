import { formatDateTime } from "../../../utils/formatters";

function statusClass(status) {
  if (status === "Returned") return "status-done";
  if (status === "Borrowed") return "status-waiting";
  return "status-started";
}

function StaffHistoryTable({ records, hasName }) {
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
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{formatDateTime(record.dateTime)}</td>
                  <td>{record.person || "—"}</td>
                  <td>{record.productName}</td>
                  <td>{record.quantity} {record.unit}</td>
                  <td>
                    <span className={`status-pill ${statusClass(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>{record.remarks || "—"}</td>
                </tr>
              ))}
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
