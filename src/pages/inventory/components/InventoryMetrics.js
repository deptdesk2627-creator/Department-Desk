import { MetricCard } from "../../../components/ui";

const SLICE_COLORS = ["#7c2d12", "#d26937", "#ea580c", "#d7ab82", "#ecd5be"];

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

const DEFAULT_PIE_CHART = (
  <svg
    className="inventory-usage-pie"
    viewBox="0 0 184 150"
    aria-hidden="true"
  >
    <g
      fill="none"
      stroke="#94a3b8"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="73,30 65,17 47,17" />
      <polyline points="118,36 126,19 144,19" />
      <line x1="42" y1="75" x2="23" y2="75" />
      <polyline points="65,116 57,129 39,129" />
      <polyline points="110,118 118,131 136,131" />
    </g>
    <g stroke="#ffffff" strokeWidth="2" strokeLinejoin="round">
      <path
        d="M 90 75 L 90 27 A 48 48 0 0 1 135.65 60.17 Z"
        fill="#7c2d12"
      />
      <path
        d="M 90 75 L 135.65 60.17 A 48 48 0 0 1 80.02 121.95 Z"
        fill="#d26937"
      />
      <path
        d="M 90 75 L 80.02 121.95 A 48 48 0 0 1 52.18 104.55 Z"
        fill="#ea580c"
      />
      <path
        d="M 90 75 L 52.18 104.55 A 48 48 0 0 1 57.88 39.33 Z"
        fill="#d7ab82"
      />
      <path
        d="M 90 75 L 57.88 39.33 A 48 48 0 0 1 90 27 Z"
        fill="#ecd5be"
      />
    </g>
  </svg>
);

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const radians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function createSlicePath(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
}

function buildPieSlices(breakdown) {
  if (!Array.isArray(breakdown) || !breakdown.length) return [];
  const top = breakdown.slice(0, 4);
  const rest = breakdown.slice(4);
  const items = [...top];
  if (rest.length > 0) {
    const restTotal = rest.reduce((sum, item) => sum + item.totalQuantity, 0);
    const restShare = rest.reduce((sum, item) => sum + item.share, 0);
    items.push({
      key: "other",
      name: "Other items",
      unit: "units",
      totalQuantity: restTotal,
      usedQuantity: rest.reduce((sum, item) => sum + item.usedQuantity, 0),
      borrowedQuantity: rest.reduce(
        (sum, item) => sum + item.borrowedQuantity,
        0,
      ),
      share: restShare,
      sharePercent: Math.round(restShare * 100),
    });
  }

  let currentAngle = 0;
  return items.map((item, index) => {
    const sweep = Math.max(8, item.share * 360);
    const startAngle = currentAngle;
    const endAngle =
      index === items.length - 1 ? 360 : Math.min(360, currentAngle + sweep);
    currentAngle = endAngle;
    const midAngle = (startAngle + endAngle) / 2;
    return {
      ...item,
      color: SLICE_COLORS[index % SLICE_COLORS.length],
      startAngle,
      endAngle,
      midAngle,
    };
  });
}

function renderDynamicPie(slices) {
  if (!slices.length) return DEFAULT_PIE_CHART;

  const cx = 90;
  const cy = 75;
  const radius = 48;

  return (
    <svg
      className="inventory-usage-pie"
      viewBox="0 0 184 150"
      role="img"
      aria-label="Most used and borrowed products pie chart"
    >
      <g
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {slices.map((slice) => {
          const edge = polarToCartesian(cx, cy, radius + 2, slice.midAngle);
          const elbow = polarToCartesian(cx, cy, radius + 14, slice.midAngle);
          const isRight = elbow.x >= cx;
          const tipX = isRight ? elbow.x + 14 : elbow.x - 14;
          return (
            <polyline
              key={`leader-${slice.key}`}
              points={`${edge.x.toFixed(1)},${edge.y.toFixed(1)} ${elbow.x.toFixed(1)},${elbow.y.toFixed(1)} ${tipX.toFixed(1)},${elbow.y.toFixed(1)}`}
            />
          );
        })}
      </g>
      <g stroke="#ffffff" strokeWidth="2" strokeLinejoin="round">
        {slices.length === 1 ? (
          <circle cx={cx} cy={cy} r={radius} fill={slices[0].color}>
            <title>{`${slices[0].name}: ${slices[0].totalQuantity} ${slices[0].unit} (100%)`}</title>
          </circle>
        ) : (
          slices.map((slice) => (
            <path
              key={slice.key}
              d={createSlicePath(
                cx,
                cy,
                radius,
                slice.startAngle,
                slice.endAngle,
              )}
              fill={slice.color}
            >
              <title>{`${slice.name}: ${slice.totalQuantity} ${slice.unit} (${slice.sharePercent}%)`}</title>
            </path>
          ))
        )}
      </g>
    </svg>
  );
}

function describeActivity(item) {
  if (!item) return "";
  if (item.usedQuantity > 0 && item.borrowedQuantity > 0) {
    return `${item.usedQuantity} used · ${item.borrowedQuantity} borrowed`;
  }
  if (item.borrowedQuantity > 0) {
    return `${item.borrowedQuantity} ${item.unit} borrowed (${item.sharePercent}%)`;
  }
  return `${item.usedQuantity} ${item.unit} used (${item.sharePercent}%)`;
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
            {renderDynamicPie(slices)}
          </div>
          <div className="inventory-usage-info">
            <span className="inventory-usage-info__label">
              Consumable &amp; borrowed pie
            </span>
            {topItem ? (
              <>
                <p
                  className="metric-value inventory-top-item"
                  title={topItem.name}
                >
                  {topItem.name}
                </p>
                <p className="metric-foot">{describeActivity(topItem)}</p>
                {slices.length > 1 && (
                  <ul
                    className="inventory-pie-legend"
                    aria-label="Top used and borrowed products"
                  >
                    {slices.slice(0, 3).map((slice) => (
                      <li key={slice.key} className="inventory-pie-legend__item">
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
                      </li>
                    ))}
                  </ul>
                )}
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
