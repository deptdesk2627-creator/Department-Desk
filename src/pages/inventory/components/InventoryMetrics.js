import { useMemo, useState } from "react";
import { MetricCard } from "../../../components/ui";
import InventoryUsagePie, {
  buildPieSlices,
  InventoryUsageBar,
} from "./InventoryUsagePie";
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

const PIE_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M11 4.2a8 8 0 1 0 8.8 8.8H11V4.2Z" />
    <path d="M14.5 3.5A8 8 0 0 1 20.5 9.5h-6v-6Z" />
  </svg>
);

const BAR_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
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
  const [chartType, setChartType] = useState("pie");
  const slices = useMemo(() => buildPieSlices(usageBreakdown), [usageBreakdown]);
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
        <div className="inventory-usage-card__top">
          <div className="inventory-usage-card__titles">
            <span className="inventory-usage-info__label">
              Recorded usage value
            </span>
            <span className="inventory-usage-info__label inventory-usage-info__label--sub">
              {chartType === "bar"
                ? "Consumable & borrowed bar graph"
                : "Consumable & borrowed pie"}
            </span>
          </div>
          <div
            className="inventory-chart-toggle"
            role="group"
            aria-label="Usage chart view"
          >
            <button
              type="button"
              className={`inventory-chart-toggle__btn ${chartType === "pie" ? "is-active" : ""}`}
              aria-pressed={chartType === "pie"}
              onClick={() => setChartType("pie")}
              title="Pie chart view"
            >
              {PIE_ICON}
              <span>Pie</span>
            </button>
            <button
              type="button"
              className={`inventory-chart-toggle__btn ${chartType === "bar" ? "is-active" : ""}`}
              aria-pressed={chartType === "bar"}
              onClick={() => setChartType("bar")}
              title="Bar graph view"
            >
              {BAR_ICON}
              <span>Bar</span>
            </button>
          </div>
        </div>

        <div className="inventory-usage-card__body">
          <div className="inventory-usage-chart">
            {chartType === "bar" ? (
              <InventoryUsageBar slices={slices} />
            ) : (
              <InventoryUsagePie slices={slices} />
            )}
          </div>
          <div className="inventory-usage-info">
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
              <div className="inventory-usage-empty">
                <span className="inventory-usage-empty__badge">0 records</span>
                <p className="metric-value inventory-top-item">No activity</p>
                <p className="metric-foot">
                  Most frequently used or borrowed items appear here once
                  recorded.
                </p>
              </div>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}

export default InventoryMetrics;
