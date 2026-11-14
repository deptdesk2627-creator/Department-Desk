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

export const INVENTORY_TRANSACTION_COLUMNS =
  "transaction_id, item_id, is_issued_to, purpose, quantity, action_type, return_date, borrow_date, status, unit, created_at, recieved_by, returned_by";

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

export function mapInventoryTransaction(row, inventoryById, usersById) {
  const item = inventoryById.get(Number(row.item_id));
  const user = usersById.get(Number(row.is_issued_to));
  const actionType = String(row.action_type || "").toLowerCase();
  return {
    id: row.transaction_id,
    dateTime: row.created_at || row.return_date || row.borrow_date || "",
    productId: `PRD-${String(row.item_id).padStart(4, "0")}`,
    productName: item?.name || `Item ${row.item_id}`,
    usageType:
      actionType === "borrow" || actionType === "return"
        ? "Borrowable"
        : item?.usageType || "Usable",
    quantity: row.quantity,
    unit: row.unit,
    status: row.status,
    actionType: row.action_type,
    person: user?.username || "",
    personUserId: row.is_issued_to,
    remarks: row.purpose,
    returnedBy: row.returned_by || "",
    receivedBy: row.recieved_by || "",
    borrowDate: row.borrow_date || null,
    returnDate: row.return_date || null,
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
