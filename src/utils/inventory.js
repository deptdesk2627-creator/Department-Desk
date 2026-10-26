// Shared inventory rules used by the dashboard, header notifications,
// admin inventory, and the staff portal.

export const PRODUCT_USAGE_TYPES = [
  {
    value: "Usable",
    label: "Usable only (Consumable — e.g. bond paper)",
    shortLabel: "Usable only",
  },
  {
    value: "Borrowable",
    label: "Borrowable & returnable (Equipment — e.g. keyboard)",
    shortLabel: "Borrowable",
  },
];

export function getItemUsageType(item) {
  const raw = String(item?.usageType || "").trim();
  if (raw === "Usable" || raw === "Borrowable") {
    return raw;
  }
  return "Both";
}

export function canBorrowItem(item) {
  return getItemUsageType(item) !== "Usable";
}

export function canUseItem(item) {
  return getItemUsageType(item) !== "Borrowable";
}

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
