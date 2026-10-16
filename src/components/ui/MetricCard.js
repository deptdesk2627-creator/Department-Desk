function MetricCard({
  label,
  value,
  footer,
  icon,
  iconVariant = "",
  valueClassName = "",
}) {
  return (
    <article className="card metric-card">
      <div className="metric-top">
        <span>{label}</span>
        {icon && (
          <span className={`metric-icon${iconVariant ? ` ${iconVariant}` : ""}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`metric-value${valueClassName ? ` ${valueClassName}` : ""}`}>
        {value}
      </p>
      {footer && <p className="metric-foot">{footer}</p>}
    </article>
  );
}

export default MetricCard;
