function StatusPill({ status = "Not started" }) {
  const normalized = String(status || "Not started");
  const slug = normalized.toLowerCase().replaceAll(" ", "-");
  return <span className={`status-pill status-${slug}`}>{normalized}</span>;
}

export default StatusPill;
