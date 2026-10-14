import { getProductId } from "../hooks/useInventoryActions";

function InventoryTable({
  items,
  totalItems,
  onOpenAction,
  getBorrowedBalance,
  onDelete,
}) {
  return (
    <section className="card panel module-list-panel" aria-labelledby="inventory-list-title">
      <div className="panel-heading">
        <div>
          <h2 id="inventory-list-title">
            Inventory <span className="count-badge">{items.length}</span>
          </h2>
          <p>Borrowing and use reduce available quantity; returns add it back.</p>
        </div>
      </div>
      {items.length ? (
        <div className="table-scroll module-table-scroll">
          <table className="request-table inventory-table">
            <thead>
              <tr>
                <th>Product-ID No.</th>
                <th>Product name</th>
                <th>Quantity</th>
                <th>Stock level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const lowStock = Number(item.quantity) <= Number(item.lowStockAt);
                return (
                  <tr key={item.id}>
                    <td><strong>{getProductId(item)}</strong></td>
                    <td>{item.name}</td>
                    <td><strong>{item.quantity} {item.unit}</strong></td>
                    <td>
                      <span className={`status-pill ${lowStock ? "status-waiting" : "status-done"}`}>
                        {lowStock ? "Low stock" : "In stock"}
                      </span>
                    </td>
                    <td>
                      <div className="stock-actions">
                        <button
                          type="button"
                          className="stock-adjust-button borrow-button"
                          onClick={() => onOpenAction(item, "Borrow")}
                          disabled={Number(item.quantity) <= 0}
                        >
                          Borrow
                        </button>
                        <button
                          type="button"
                          className="stock-adjust-button use-button"
                          onClick={() => onOpenAction(item, "Use")}
                          disabled={Number(item.quantity) <= 0}
                        >
                          Use
                        </button>
                        <button
                          type="button"
                          className="stock-adjust-button"
                          onClick={() => onOpenAction(item, "Return")}
                          disabled={getBorrowedBalance(item) <= 0}
                        >
                          Return
                        </button>
                        <button
                          className="delete-button"
                          type="button"
                          onClick={() => onDelete(item.id)}
                          aria-label={`Delete ${item.name}`}
                        >
                          ×
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
            ? "No products match your search."
            : "No products yet. Add one above to start tracking inventory."}
        </p>
      )}
    </section>
  );
}

export default InventoryTable;
