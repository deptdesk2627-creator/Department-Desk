import { getProductId } from "../../../hooks/useInventoryActions";

function StaffSupplyList({
  items,
  totalItems,
  canRecord,
  getMyBorrowedBalance,
  onOpenAction,
}) {
  return (
    <section
      className="card panel module-list-panel"
      aria-labelledby="staff-supplies-title"
    >
      <div className="panel-heading">
        <div>
          <h2 id="staff-supplies-title">
            Available supplies <span className="count-badge">{items.length}</span>
          </h2>
          <p>
            {canRecord
              ? "Choose an action for the item you need."
              : "Enter your name above to borrow, use, or return items."}
          </p>
        </div>
      </div>
      {items.length ? (
        <div className="table-scroll module-table-scroll">
          <table className="request-table inventory-table">
            <thead>
              <tr>
                <th>Product-ID No.</th>
                <th>Product name</th>
                <th>Available</th>
                <th>I borrowed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const available = Number(item.quantity) || 0;
                const borrowed = getMyBorrowedBalance(item);
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="request-id-badge">{getProductId(item)}</span>
                    </td>
                    <td>
                      <strong className="inventory-item-name">{item.name}</strong>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${available > 0 ? "status-done" : "status-waiting"}`}
                      >
                        {available > 0 ? `${available} ${item.unit}` : "Out of stock"}
                      </span>
                    </td>
                    <td>
                      {borrowed > 0 ? (
                        <span className="status-pill status-started">
                          {borrowed} {item.unit} borrowed
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="stock-actions">
                        <button
                          type="button"
                          className="stock-adjust-button borrow-button"
                          onClick={() => onOpenAction(item, "Borrow")}
                          disabled={!canRecord || available <= 0}
                        >
                          Borrow
                        </button>
                        <button
                          type="button"
                          className="stock-adjust-button use-button"
                          onClick={() => onOpenAction(item, "Use")}
                          disabled={!canRecord || available <= 0}
                        >
                          Use
                        </button>
                        <button
                          type="button"
                          className="stock-adjust-button"
                          onClick={() => onOpenAction(item, "Return")}
                          disabled={!canRecord || borrowed <= 0}
                        >
                          Return
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state">
          {totalItems
            ? "No supplies match your search."
            : "No supplies are listed yet. Please ask the secretary."}
        </p>
      )}
    </section>
  );
}

export default StaffSupplyList;
