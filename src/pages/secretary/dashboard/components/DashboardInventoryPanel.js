import "./DashboardPanels.css";
import EmptyState from "../../../../components/ui/EmptyState";

function DashboardInventoryPanel({ items, hasQuery, onNavigate }) {
  return (
    <section
      className="card panel inventory-panel"
      aria-labelledby="inventory-title"
    >
      <div className="panel-heading">
        <h2 id="inventory-title">Supply &amp; Inventory</h2>
        <button
          className="text-button"
          type="button"
          onClick={() => onNavigate("inventory")}
        >
          Manage inventory →
        </button>
      </div>
      {items.length > 0 ? (
        <div className="inventory-summary">
          {items.map((item) => {
            const isLow = Number(item.quantity) <= Number(item.lowStockAt || 0);
            return (
              <article className="supply-item" key={item.id}>
                <span
                  className={`supply-icon${isLow ? " supply-icon-low" : ""}`}
                  aria-hidden="true"
                >
                  ▤
                </span>
                <div className="supply-details">
                  <h3>{item.name}</h3>
                  <p>
                    {item.quantity} {item.unit} on hand
                  </p>
                </div>
                <span
                  className={`supply-status${isLow ? " supply-status-low" : ""}`}
                >
                  {isLow ? "Low stock" : "In stock"}
                </span>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          hasQuery={hasQuery}
          queryMessage="No inventory items match your search."
          defaultMessage="No inventory items yet. Add supplies to start tracking stock."
        />
      )}
    </section>
  );
}

export default DashboardInventoryPanel;
