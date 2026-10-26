import { getProductId } from "../../../hooks/useInventoryActions";
import {
  canBorrowItem,
  canUseItem,
  getItemUsageType,
} from "../../../utils/inventory";

function StaffSupplyList({
  items,
  totalItems,
  supplySearch,
  onSupplySearchChange,
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
        <label className="inventory-search-box staff-supply-search">
          <span className="inventory-search-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            type="search"
            value={supplySearch}
            onChange={(event) => onSupplySearchChange(event.target.value)}
            placeholder="Search supplies by name or ID..."
            aria-label="Search supplies"
          />
        </label>
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
                const usageType = getItemUsageType(item);
                const allowBorrow = canBorrowItem(item);
                const allowUse = canUseItem(item);
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="request-id-badge">{getProductId(item)}</span>
                    </td>
                    <td>
                      <div className="inventory-item-name-cell">
                        <strong className="inventory-item-name">{item.name}</strong>
                        {usageType !== "Both" && (
                          <span
                            className={`inventory-usage-badge ${
                              usageType === "Borrowable"
                                ? "inventory-usage-badge--borrowable"
                                : "inventory-usage-badge--usable"
                            }`}
                          >
                            {usageType === "Borrowable"
                              ? "Borrowable"
                              : "Usable only"}
                          </span>
                        )}
                      </div>
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
                        {allowBorrow && (
                          <button
                            type="button"
                            className="stock-adjust-button borrow-button"
                            onClick={() => onOpenAction(item, "Borrow")}
                            disabled={!canRecord || available <= 0}
                          >
                            Borrow
                          </button>
                        )}
                        {allowUse && (
                          <button
                            type="button"
                            className="stock-adjust-button use-button"
                            onClick={() => onOpenAction(item, "Use")}
                            disabled={!canRecord || available <= 0}
                          >
                            Use
                          </button>
                        )}
                        {allowBorrow && (
                          <button
                            type="button"
                            className="stock-adjust-button"
                            onClick={() => onOpenAction(item, "Return")}
                            disabled={!canRecord || borrowed <= 0}
                          >
                            Return
                          </button>
                        )}
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
