import { MetricCard } from "../../../components/ui";
import InventoryUsagePie, { buildPieSlices } from "./InventoryUsagePie";
import "./InventoryMetrics.css";

const RECORD_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 3.75h8l4 4v12.5H6z" />
    <path d="M14 3.75v4h4M9 12h6M9 15.5h6" />
  </svg>
);

const CHART_BADGE_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4.5 4.5v15h15" />
    <path d="M9 16v-4" />
    <path d="M13 16V8" />
    <path d="M17 16v-6" />
  </svg>
);

function describeActivity(item) {
  if (!item) return "";
  if (item.usedQuantity > 0 && item.borrowedQuantity > 0) {
    return `${item.usedQuantity} used · ${item.borrowedQuantity} borrowed`;
  }
  if (item.borrowedQuantity > 0) {
    return `${item.borrowedQuantity} ${item.unit} borrowed`;
  }
  return `${item.usedQuantity} ${item.unit} used`;
}

function InventoryMetrics({
  productCount,
  lowStockCount,
  usageBreakdown = [],
  recordCount,
}) {
  const slices = buildPieSlices(usageBreakdown);
  const topItem = slices[0] || null;

  return (
    <section
      className="metrics-grid inventory-metrics"
      aria-label="Inventory summary"
    >
      <MetricCard
        label="Tracked products"
        icon={RECORD_ICON}
        value={productCount}
        footer="Products in the office"
      />
      <MetricCard
        label="Low stock"
        icon="!"
        iconVariant="orange"
        value={lowStockCount}
        footer="At or below reorder level"
      />
      <article className="card metric-card inventory-records-metric">
        <div className="inventory-records-metric__content">
          <span className="inventory-records-metric__label">
            Transaction records
          </span>
          <div className="inventory-records-metric__row">
            <p className="metric-value">{recordCount}</p>
            <p className="metric-foot">Borrow, use, and return history</p>
          </div>
        </div>
        <span className="metric-icon">{RECORD_ICON}</span>
      </article>
      <article className="card metric-card inventory-usage-card">
        <span className="inventory-usage-card__corner-icon" aria-hidden="true">
          {CHART_BADGE_ICON}
        </span>
        <div className="inventory-usage-card__body">
          <div className="inventory-usage-chart">
            <InventoryUsagePie slices={slices} />
          </div>
          <div className="inventory-usage-info">
            <span className="inventory-usage-info__label">
              Recorded usage value
            </span>
            <span className="inventory-usage-info__label inventory-usage-info__label--sub">
              Consumable &amp; borrowed pie
            </span>
            {topItem ? (
              <>
                <div className="inventory-top-item-row">
                  <p
                    className="metric-value inventory-top-item"
                    title={topItem.name}
                  >
                    {topItem.name}
                  </p>
                  <span className="inventory-top-item-pill">
                    {describeActivity(topItem)}
                  </span>
                </div>
                <ul
                  className="inventory-pie-legend"
                  aria-label="Top used and borrowed products"
                >
                  {slices.slice(0, 3).map((slice) => (
                    <li key={slice.key} className="inventory-pie-legend__item">
                      <div className="inventory-pie-legend__row">
                        <span
                          className="inventory-pie-legend__dot"
                          style={{ backgroundColor: slice.color }}
                          aria-hidden="true"
                        />
                        <span className="inventory-pie-legend__name">
                          {slice.name}
                        </span>
                        <span className="inventory-pie-legend__share">
                          {slice.sharePercent}%
                        </span>
                      </div>
                      <span
                        className="inventory-pie-legend__bar"
                        aria-hidden="true"
                      >
                        <span
                          className="inventory-pie-legend__bar-fill"
                          style={{
                            width: `${Math.max(6, slice.sharePercent)}%`,
                            backgroundColor: slice.color,
                          }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="metric-value inventory-top-item">No activity</p>
                <p className="metric-foot">
                  Most frequently used or borrowed items appear here
                </p>
              </>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}

export default InventoryMetrics;
