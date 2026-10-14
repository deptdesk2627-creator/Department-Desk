const dateOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

export function formatDate(value) {
  if (value === null || value === undefined || value === "") return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString([], dateOptions);
}

export function formatDateTime(value) {
  if (value === null || value === undefined || value === "") return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString([], { ...dateOptions, hour: "numeric", minute: "2-digit" });
}

export function formatCurrency(amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return "—";

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}
