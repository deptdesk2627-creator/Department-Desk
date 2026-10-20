// Shared inventory rules used by the dashboard, header notifications,
// admin inventory, and the staff portal.

export function isLowStock(item) {
  if (!item) return false;
  const quantity = Number(item.quantity);
  return Number.isFinite(quantity) && quantity <= Number(item.lowStockAt || 0);
}

export function recordStatusClass(status) {
  if (status === "Returned") return "status-done";
  if (status === "Borrowed") return "status-waiting";
  return "status-started";
}
