import { formatCurrency } from "../../../../utils/formatters";

function InventoryMetrics({ productCount, lowStockCount, usageValue, recordCount }) {
  return (
    <section
      className="metrics-grid inventory-metrics"
      aria-label="Inventory summary"
    >
      <article className="card metric-card">
        <div className="metric-top">
          <span>Tracked products</span>
          <span className="metric-icon">▤</span>
        </div>
        <p className="metric-value">{productCount}</p>
        <p className="metric-foot">Products in the office</p>
      </article>
      <article className="card metric-card">
        <div className="metric-top">
          <span>Low stock</span>
          <span className="metric-icon orange">!</span>
        </div>
        <p className="metric-value">{lowStockCount}</p>
        <p className="metric-foot">At or below reorder level</p>
      </article>
      <article className="card metric-card">
        <div className="metric-top">
          <span>Recorded usage value</span>
          <span className="metric-icon green">₱</span>
        </div>
        <p className="metric-value inventory-cost">
          {formatCurrency(usageValue)}
        </p>
        <p className="metric-foot">Estimated cost of logged usage</p>
      </article>
      <article className="card metric-card">
        <div className="metric-top">
          <span>Transaction records</span>
          <span className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 3.75h8l4 4v12.5H6z" />
              <path d="M14 3.75v4h4M9 12h6M9 15.5h6" />
            </svg>
          </span>
        </div>
        <p className="metric-value">{recordCount}</p>
        <p className="metric-foot">Borrow, use, and return history</p>
      </article>
    </section>
  );
}

export default InventoryMetrics;
