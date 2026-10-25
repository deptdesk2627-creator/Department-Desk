import { formatDateTime } from "../../../utils/formatters";
import { recordStatusClass } from "../../../utils/inventory";

function InventoryRecords({ records, totalRecords }) {
  return (
    <section
      className="card panel module-list-panel inventory-folder-panel inventory-folder-panel--transactions"
      aria-label="Transaction records"
    >
      <p className="inventory-panel-subtitle">
        History of borrowed, used, and returned products.
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
                <th className="inventory-status-col">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>
                    <strong className="record-id-text">{record.id}</strong>
                  </td>
                  <td className="record-date-cell">
                    {formatDateTime(record.dateTime)}
                  </td>
                  <td className="record-person-cell">
                    {record.person || "—"}
                  </td>
                  <td className="record-product-id-cell">{record.productId}</td>
                  <td className="record-product-name-cell">
                    {record.productName}
                  </td>
                  <td className="record-quantity-cell">
                    <strong>
                      {record.quantity} {record.unit}
                    </strong>
                  </td>
                  <td className="inventory-status-col">
                    <span
                      className={`status-pill ${recordStatusClass(record.status)}`}
                    >
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
