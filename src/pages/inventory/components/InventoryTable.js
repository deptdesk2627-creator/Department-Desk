import { getProductId } from "../../../hooks/useInventoryActions";
import { isLowStock } from "../../../utils/inventory";

function InventoryTable({
  items,
  totalItems,
  onOpenAction,
  getBorrowedBalance,
  onDelete,
  readOnly = false,
}) {
  return (
    <section
      className="card panel module-list-panel inventory-folder-panel inventory-folder-panel--master"
      aria-label="Master list"
    >
      <p className="inventory-panel-subtitle">
        {readOnly
          ? "Current stock levels and status."
          : "Borrowing and use reduce available quantity; returns add it back."}
      </p>
      {items.length ? (
        <div className="inventory-table-wrap">
          <table className="request-table inventory-table inventory-master-table">
            <thead>
              <tr>
                <th>PRODUCT-ID NO.</th>
                <th>PRODUCT NAME</th>
                <th>QUANTITY</th>
                <th>STOCK LEVEL</th>
                <th className="inventory-actions-col">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const qty = Number(item.quantity) || 0;
                const threshold = Math.max(1, Number(item.lowStockAt) || 2);
                const lowStock = isLowStock(item);
                const meterPercent = Math.min(
                  100,
                  Math.round((qty / (threshold * 3)) * 100),
                );
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="inventory-product-id-pill">
                        {getProductId(item)}
                      </span>
                    </td>
                    <td>
                      <strong className="inventory-item-name">
                        {item.name}
                      </strong>
                    </td>
                    <td>
                      <div className="stock-quantity-cell">
                        <strong>
                          {item.quantity} {item.unit}
                        </strong>
                        <span
                          className="stock-meter"
                          aria-hidden="true"
                          title={`Low-stock alert at ${item.lowStockAt} ${item.unit}`}
                        >
                          <span
                            className={`stock-meter__fill ${lowStock ? "stock-meter__fill--low" : ""}`}
                            style={{ width: `${meterPercent}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${lowStock ? "status-waiting" : "status-done"}`}
                      >
                        {lowStock ? "Low stock" : "In stock"}
                      </span>
                    </td>
                    <td className="inventory-actions-col">
                      {readOnly ? (
                        <span className="status-pill status-started">
                          View only
                        </span>
                      ) : (
                        <div className="stock-actions stock-actions--right">
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
                            className="stock-adjust-button return-button"
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
                      )}
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
            : "No products yet. Click '+ Add product' above to start tracking inventory."}
        </p>
      )}
    </section>
  );
}

export default InventoryTable;
