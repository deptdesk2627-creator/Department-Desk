import { MetricCard } from "../../../components/ui";
import { formatCurrency } from "../../../utils/formatters";

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

const USAGE_PIE_CHART = (
  <svg
    className="inventory-usage-pie"
    viewBox="0 0 184 150"
    aria-hidden="true"
  >
    {/* Callout leader lines */}
    <g
      fill="none"
      stroke="#94a3b8"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Top-left leader */}
      <polyline points="73,30 65,17 47,17" />
      {/* Top-right leader */}
      <polyline points="118,36 126,19 144,19" />
      {/* Middle-left leader */}
      <line x1="42" y1="75" x2="23" y2="75" />
      {/* Bottom-left leader */}
      <polyline points="65,116 57,129 39,129" />
      {/* Bottom-right leader */}
      <polyline points="110,118 118,131 136,131" />
    </g>

    {/* 5 Pie chart slices centered at (90, 75), radius 48 */}
    <g stroke="#ffffff" strokeWidth="2" strokeLinejoin="round">
      {/* Top-right: dark brown (-90 deg to -18 deg) */}
      <path
        d="M 90 75 L 90 27 A 48 48 0 0 1 135.65 60.17 Z"
        fill="#7c2d12"
      />
      {/* Bottom-right: warm terracotta (-18 deg to 102 deg) */}
      <path
        d="M 90 75 L 135.65 60.17 A 48 48 0 0 1 80.02 121.95 Z"
        fill="#d26937"
      />
      {/* Bottom-left: medium rust (102 deg to 142 deg) */}
      <path
        d="M 90 75 L 80.02 121.95 A 48 48 0 0 1 52.18 104.55 Z"
        fill="#a94a24"
      />
      {/* Left: warm tan (142 deg to 228 deg) */}
      <path
        d="M 90 75 L 52.18 104.55 A 48 48 0 0 1 57.88 39.33 Z"
        fill="#d7ab82"
      />
      {/* Top-left: soft cream/beige (228 deg to 270 deg) */}
      <path
        d="M 90 75 L 57.88 39.33 A 48 48 0 0 1 90 27 Z"
        fill="#ecd5be"
      />
    </g>
  </svg>
);

function InventoryMetrics({
  productCount,
  lowStockCount,
  usageValue,
  recordCount,
}) {
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
          <div className="inventory-usage-chart">{USAGE_PIE_CHART}</div>
          <div className="inventory-usage-info">
            <span className="inventory-usage-info__label">
              Recorded usage value
            </span>
            <p className="metric-value inventory-cost">
              {formatCurrency(usageValue)}
            </p>
            <p className="metric-foot">Estimated cost of logged usage</p>
          </div>
        </div>
      </article>
    </section>
  );
}

export default InventoryMetrics;
