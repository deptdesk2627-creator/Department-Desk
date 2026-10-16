import MetricCard from "../../../../components/ui/MetricCard";
import { formatCurrency } from "../../../../utils/formatters";

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
        icon="▤"
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
      <MetricCard
        label="Recorded usage value"
        icon="₱"
        iconVariant="green"
        value={formatCurrency(usageValue)}
        valueClassName="inventory-cost"
        footer="Estimated cost of logged usage"
      />
      <MetricCard
        label="Transaction records"
        icon={RECORD_ICON}
        value={recordCount}
        footer="Borrow, use, and return history"
      />
    </section>
  );
}

export default InventoryMetrics;
