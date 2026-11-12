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

export const MASTERLIST_COLUMNS =
  "item_id, item_name, stock_onhand, unit, min_stock, category, classification, archived_at, created_at";

export function mapMasterlistItem(item) {
  const usageType = [item.category, item.classification].find(
    (value) => value === "Usable" || value === "Borrowable",
  );
  return {
    ...item,
    id: item.item_id,
    productId: `PRD-${String(item.item_id).padStart(4, "0")}`,
    name: item.item_name,
    quantity: item.stock_onhand,
    lowStockAt: item.min_stock,
    ...(usageType ? { usageType } : {}),
  };
}

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
