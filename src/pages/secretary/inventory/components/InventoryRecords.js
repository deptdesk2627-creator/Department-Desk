import { formatDateTime } from "../../../../utils/formatters";

function InventoryRecords({
  records,
  totalRecords,
  filter,
  setFilter,
}) {
  return (
    <section className="card panel module-list-panel" aria-labelledby="records-title">
      <div className="module-toolbar">
        <div>
          <h2 id="records-title">
            Transaction records <span className="count-badge">{records.length}</span>
          </h2>
          <p>History of borrowed, used, and returned products.</p>
        </div>
        <label className="record-filter">
          Filter status
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option>All</option>
            <option>Borrowed</option>
            <option>Returned</option>
            <option>Used</option>
          </select>
        </label>
      </div>
      {records.length ? (
        <div className="table-scroll module-table-scroll">
          <table className="request-table inventory-record-table">
            <thead>
              <tr>
                <th>ID No.</th>
                <th>Date &amp; time</th>
                <th>Name</th>
                <th>Product-ID No.</th>
                <th>Product name</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td><strong>{record.id}</strong></td>
                  <td>{formatDateTime(record.dateTime)}</td>
                  <td>{record.person || "—"}</td>
                  <td>{record.productId}</td>
                  <td>{record.productName}</td>
                  <td>{record.quantity} {record.unit}</td>
                  <td>
                    <span className={`status-pill ${record.status === "Returned" ? "status-done" : record.status === "Borrowed" ? "status-waiting" : "status-started"}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
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
