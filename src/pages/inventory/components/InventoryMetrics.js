import { MetricCard } from "../../../components/ui";

const SLICE_COLORS = ["#f97316", "#fb923c", "#c2410c", "#fdba74", "#fed7aa"];

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
    viewBox="0 0 210 156"
    aria-hidden="true"
  >
    <circle
      cx="105"
      cy="78"
      r="54"
      fill="none"
      stroke="currentColor"
      strokeOpacity="0.1"
      strokeWidth="1"
      strokeDasharray="3 3"
    />
    <g
      fill="none"
      stroke="#94a3b8"
      strokeOpacity="0.65"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="86,33 76,19 56,19" />
      <polyline points="135,38 145,22 165,22" />
      <polyline points="77,118 67,132 47,132" />
      <polyline points="128,120 138,134 158,134" />
    </g>
    <g className="inventory-usage-pie__slices">
      <path
        d="M 105 78 L 105 30 A 48 48 0 0 1 150.65 63.17 Z"
        fill="#f97316"
      />
      <path
        d="M 105 78 L 150.65 63.17 A 48 48 0 0 1 95.02 124.95 Z"
        fill="#fb923c"
      />
      <path
        d="M 105 78 L 95.02 124.95 A 48 48 0 0 1 62.18 99.55 Z"
        fill="#c2410c"
      />
      <path
        d="M 105 78 L 62.18 99.55 A 48 48 0 0 1 105 30 Z"
        fill="#fdba74"
      />
    </g>
    <circle
      cx="105"
      cy="78"
      r="24"
      className="inventory-usage-pie__hole"
    />
    <text
      x="105"
      y="81"
      textAnchor="middle"
      className="inventory-usage-pie__center-sub"
    >
      0%
    </text>
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
    const sweep = Math.max(10, item.share * 360);
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

  const cx = 105;
  const cy = 78;
  const radius = 47;
  const topSlice = slices[0];

  return (
    <svg
      className="inventory-usage-pie"
      viewBox="0 0 210 156"
      role="img"
      aria-label="Most used and borrowed products pie chart"
    >
      {/* Subtle outer halo ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius + 6}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {/* Callout leader lines with colored anchor dots and % labels */}
      <g
        fill="none"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {slices.map((slice) => {
          const edge = polarToCartesian(cx, cy, radius, slice.midAngle);
          const elbow = polarToCartesian(cx, cy, radius + 12, slice.midAngle);
          const isRight = elbow.x >= cx;
          const tipX = isRight ? elbow.x + 12 : elbow.x - 12;
          const labelX = isRight ? tipX + 4 : tipX - 4;
          return (
            <g key={`leader-${slice.key}`}>
              <polyline
                points={`${edge.x.toFixed(1)},${edge.y.toFixed(1)} ${elbow.x.toFixed(1)},${elbow.y.toFixed(1)} ${tipX.toFixed(1)},${elbow.y.toFixed(1)}`}
                stroke={slice.color}
                strokeOpacity="0.85"
              />
              <circle
                cx={edge.x.toFixed(1)}
                cy={edge.y.toFixed(1)}
                r="2.4"
                fill={slice.color}
              />
              <text
                x={labelX.toFixed(1)}
                y={(elbow.y + 3.5).toFixed(1)}
                textAnchor={isRight ? "start" : "end"}
                className="inventory-usage-pie__callout-label"
              >
                {slice.sharePercent}%
              </text>
            </g>
          );
        })}
      </g>

      {/* Pie slices separated cleanly by surface color */}
      <g className="inventory-usage-pie__slices">
        {slices.length === 1 ? (
          <circle cx={cx} cy={cy} r={radius} fill={slices[0].color}>
            <title>{`${slices[0].name}: ${slices[0].totalQuantity} ${slices[0].unit} (100%)`}</title>
          </circle>
        ) : (
          slices.map((slice, index) => {
            const offset =
              index === 0
                ? polarToCartesian(0, 0, 2.2, slice.midAngle)
                : { x: 0, y: 0 };
            return (
              <path
                key={slice.key}
                d={createSlicePath(
                  cx,
                  cy,
                  index === 0 ? radius + 1.5 : radius,
                  slice.startAngle,
                  slice.endAngle,
                )}
                fill={slice.color}
                transform={`translate(${offset.x.toFixed(2)}, ${offset.y.toFixed(2)})`}
              >
                <title>{`${slice.name}: ${slice.totalQuantity} ${slice.unit} (${slice.sharePercent}%)`}</title>
              </path>
            );
          })
        )}
      </g>

      {/* Donut inner cutout with top percentage */}
      <circle cx={cx} cy={cy} r="23" className="inventory-usage-pie__hole" />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        className="inventory-usage-pie__center-value"
      >
        {topSlice.sharePercent}%
      </text>
      <text
        x={cx}
        y={cy + 11}
        textAnchor="middle"
        className="inventory-usage-pie__center-caption"
      >
        TOP
      </text>
    </svg>
  );
}

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
            {renderDynamicPie(slices)}
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
