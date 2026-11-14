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

export function mapInventoryTransactions(rows, inventoryById, usersById) {
  const mappedRecords = (Array.isArray(rows) ? rows : []).map((row) => {
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
      status:
        actionType === "return"
          ? "Returned"
          : row.status,
      actionType: row.action_type,
      person: user?.username || "",
      personUserId: row.is_issued_to,
      remarks: row.purpose,
      returnedBy: row.returned_by || "",
      receivedBy: row.recieved_by || "",
      borrowDate: row.borrow_date || null,
      returnDate: row.return_date || null,
    };
  });
  const chronologicalRecords = [...mappedRecords].sort((left, right) => {
    const dateOrder =
      new Date(left.dateTime || 0).getTime() -
      new Date(right.dateTime || 0).getTime();
    return dateOrder || Number(left.id) - Number(right.id);
  });
  const loansByOwnerAndItem = new Map();

  for (const record of chronologicalRecords) {
    const key = `${record.personUserId}:${record.productId}`;
    const actionType = String(record.actionType || "").toLowerCase();
    let account = loansByOwnerAndItem.get(key);
    if (!account) {
      account = { loans: [], borrowed: 0, returned: 0 };
      loansByOwnerAndItem.set(key, account);
    }

    if (actionType === "borrow") {
      if (account.borrowed === account.returned) {
        account.loans = [];
        account.borrowed = 0;
        account.returned = 0;
      }
      const quantity = Number(record.quantity) || 0;
      record.returnedQuantity = 0;
      account.loans.push({
        record,
        remaining: quantity,
      });
      account.borrowed += quantity;
      continue;
    }

    if (actionType !== "return") continue;

    const quantity = Number(record.quantity) || 0;
    const availableBalance = Math.max(0, account.borrowed - account.returned);
    const appliedQuantity = Math.min(quantity, availableBalance);
    let quantityToAllocate = appliedQuantity;
    let firstMatchedLoan = null;
    const matchedLoans = [];
    const returnEvents = [];

    for (const loan of account.loans) {
      if (quantityToAllocate <= 0) break;
      if (loan.remaining <= 0) continue;

      const returnedFromLoan = Math.min(quantityToAllocate, loan.remaining);
      loan.remaining -= returnedFromLoan;
      quantityToAllocate -= returnedFromLoan;
      loan.record.returnedQuantity =
        Number(loan.record.returnedQuantity) + returnedFromLoan;
      firstMatchedLoan ||= loan;
      matchedLoans.push(loan);

      const event = {
        id: record.id,
        dateTime: record.dateTime,
        quantity: returnedFromLoan,
        person: record.person,
        returnedBy: record.returnedBy || record.person,
        remarks: record.remarks,
        remainingAfter: loan.remaining,
      };
      returnEvents.push(event);
      loan.record.returnEvents = [...(loan.record.returnEvents || []), event];
      if (loan.remaining === 0) {
        loan.record.returnedAt = record.returnDate || record.dateTime;
      }
    }

    account.returned += appliedQuantity;
    const remainingBalance = Math.max(0, account.borrowed - account.returned);
    record.isPartialReturn = remainingBalance > 0;
    record.borrowedQuantity = account.borrowed;
    record.cumulativeReturnedQuantity = account.returned;
    record.remainingQuantity = remainingBalance;
    record.borrowedAt = firstMatchedLoan?.record.dateTime || null;
    record.borrowRecordId =
      matchedLoans.length === 1 ? firstMatchedLoan?.record.id || null : null;
    record.returnedAt =
      remainingBalance === 0 ? record.returnDate || record.dateTime : null;
    record.returnEvents = returnEvents;
    record.borrowRemarks = firstMatchedLoan?.record.remarks || "";
    record.returnRemarks = record.remarks;
  }

  return mappedRecords;
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
