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

export const PENDING_RETURN_STATUS = "Pending Return";
export const RETURN_DECLINED_STATUS = "Return Declined";

const EXTERNAL_BORROWER_PATTERN = /^\[Borrower:\s*([^\]]+)\]\s*(.*)$/s;

export function encodePurposeWithBorrower(borrowerName, remarks = "") {
  const cleanName = String(borrowerName || "")
    .replace(/[[\]]/g, "")
    .trim();
  const cleanRemarks = String(remarks || "").trim();
  if (!cleanName) return cleanRemarks;
  return cleanRemarks
    ? `[Borrower: ${cleanName}] ${cleanRemarks}`
    : `[Borrower: ${cleanName}]`;
}

export function parsePurposeWithBorrower(rawPurpose) {
  const text = String(rawPurpose ?? "");
  const match = text.match(EXTERNAL_BORROWER_PATTERN);
  if (!match) {
    return {
      borrowerName: "",
      remarks: text,
      isExternalBorrower: false,
    };
  }
  return {
    borrowerName: match[1].trim(),
    remarks: match[2].trim(),
    isExternalBorrower: true,
  };
}

function formatLocalDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function readActiveMasterlistItem(supabaseClient, itemId) {
  const { data: currentItem, error: currentItemError } = await supabaseClient
    .from("items_masterlist")
    .select("item_id, stock_onhand, archived_at")
    .eq("item_id", itemId)
    .maybeSingle();
  if (currentItemError) throw currentItemError;
  if (!currentItem) {
    throw new Error(
      "This inventory item is not visible in Supabase. Check its item_id and the authenticated SELECT policy for items_masterlist.",
    );
  }
  if (currentItem.archived_at) {
    throw new Error(
      "This inventory item has been archived and cannot be changed.",
    );
  }
  return currentItem;
}

export async function persistInventoryTransaction({
  supabaseClient,
  item,
  recipientId,
  actionType,
  amount,
  matchedBorrowRecord,
  record,
  pendingConfirmation = false,
}) {
  const itemId = Number(item.item_id ?? item.id);
  const currentQuantity = Number(item.stock_onhand ?? item.quantity);
  if (!Number.isInteger(itemId) || !Number.isFinite(currentQuantity)) {
    throw new Error("The selected inventory item has invalid stock details.");
  }

  const isPendingReturn =
    actionType === "Return" &&
    (pendingConfirmation || record.status === PENDING_RETURN_STATUS);

  let nextQuantity = currentQuantity;
  if (!isPendingReturn) {
    nextQuantity =
      currentQuantity + (actionType === "Return" ? amount : -amount);
    const { data: updatedItem, error: stockError } = await supabaseClient
      .from("items_masterlist")
      .update({ stock_onhand: nextQuantity })
      .eq("item_id", itemId)
      .eq("stock_onhand", currentQuantity)
      .is("archived_at", null)
      .select("item_id, stock_onhand")
      .maybeSingle();
    if (stockError) throw stockError;
    if (!updatedItem) {
      const currentItem = await readActiveMasterlistItem(supabaseClient, itemId);
      const latestQuantity = Number(currentItem.stock_onhand);
      if (latestQuantity !== currentQuantity) {
        throw new Error(
          `Stock changed in Supabase from ${currentQuantity} to ${latestQuantity}. Reload the page and try again.`,
        );
      }

      throw new Error(
        "Supabase did not update this item's stock. Check the authenticated UPDATE policy for items_masterlist.",
      );
    }
  }

  const today = formatLocalDate();
  const borrowDate =
    actionType === "Borrow"
      ? today
      : actionType === "Return"
        ? String(
            matchedBorrowRecord?.borrowDate ||
              matchedBorrowRecord?.dateTime ||
              today,
          ).slice(0, 10)
        : null;
  const isExternalBorrower = Boolean(
    record.isExternalBorrower ||
      (actionType === "Return" && matchedBorrowRecord?.isExternalBorrower),
  );
  const storedPurpose = isExternalBorrower
    ? encodePurposeWithBorrower(record.person, record.remarks)
    : record.remarks || "";

  const transaction = {
    item_id: itemId,
    is_issued_to: recipientId,
    purpose: storedPurpose,
    quantity: amount,
    action_type: actionType,
    return_date: actionType === "Return" && !isPendingReturn ? today : null,
    borrow_date: borrowDate,
    status: isPendingReturn ? PENDING_RETURN_STATUS : record.status,
    unit: record.unit,
    created_at: record.dateTime,
    recieved_by:
      actionType === "Return" && !isPendingReturn
        ? record.receivedBy || null
        : null,
    returned_by: actionType === "Return" ? record.returnedBy || null : null,
  };

  try {
    const { data, error } = await supabaseClient
      .from("inventory_transactions")
      .insert(transaction)
      .select(INVENTORY_TRANSACTION_COLUMNS)
      .single();
    if (error) throw error;
    if (!data) throw new Error("Supabase did not return the saved transaction.");

    const parsedSaved = parsePurposeWithBorrower(data.purpose);
    return {
      ...record,
      id: data.transaction_id,
      itemId,
      dateTime: data.created_at || record.dateTime,
      person: parsedSaved.isExternalBorrower
        ? parsedSaved.borrowerName
        : record.person,
      remarks: parsedSaved.isExternalBorrower
        ? parsedSaved.remarks
        : record.remarks,
      isExternalBorrower: parsedSaved.isExternalBorrower || isExternalBorrower,
      personUserId: recipientId,
      borrowDate: data.borrow_date,
      returnDate: data.return_date,
      status: data.status || transaction.status,
      receivedBy: data.recieved_by || "",
    };
  } catch (transactionError) {
    if (isPendingReturn) {
      throw transactionError;
    }
    const { data: rolledBackItem, error: rollbackError } = await supabaseClient
      .from("items_masterlist")
      .update({ stock_onhand: currentQuantity })
      .eq("item_id", itemId)
      .eq("stock_onhand", nextQuantity)
      .select("item_id")
      .maybeSingle();
    if (rollbackError || !rolledBackItem) {
      console.error(
        "Inventory transaction failed and stock rollback did not complete.",
        rollbackError || transactionError,
      );
      throw new Error(
        "Transaction save failed and stock could not be restored. Contact the administrator before retrying.",
      );
    }
    throw transactionError;
  }
}

export async function confirmInventoryReturn({
  supabaseClient,
  record,
  item,
  receivedBy = "Secretary",
}) {
  const itemId = Number(item?.item_id ?? item?.id ?? record?.itemId);
  const amount = Number(record?.quantity);
  if (!Number.isInteger(itemId) || !Number.isInteger(amount) || amount <= 0) {
    throw new Error("This return record does not have valid item or quantity details.");
  }

  const currentItem = await readActiveMasterlistItem(supabaseClient, itemId);
  const currentStock = Number(currentItem.stock_onhand);
  if (!Number.isFinite(currentStock)) {
    throw new Error("The selected inventory item has invalid stock details.");
  }

  const today = formatLocalDate();
  const confirmedBy = String(receivedBy || "").trim() || "Secretary";
  const { data: updatedTx, error: txError } = await supabaseClient
    .from("inventory_transactions")
    .update({
      status: "Returned",
      return_date: today,
      recieved_by: confirmedBy,
    })
    .eq("transaction_id", record.id)
    .eq("status", PENDING_RETURN_STATUS)
    .select(INVENTORY_TRANSACTION_COLUMNS)
    .maybeSingle();

  if (txError) throw txError;
  if (!updatedTx) {
    throw new Error(
      "This return request has already been processed or could not be updated.",
    );
  }

  const nextStock = currentStock + amount;
  try {
    const { data: updatedItem, error: stockError } = await supabaseClient
      .from("items_masterlist")
      .update({ stock_onhand: nextStock })
      .eq("item_id", itemId)
      .eq("stock_onhand", currentStock)
      .is("archived_at", null)
      .select("item_id, stock_onhand")
      .maybeSingle();
    if (stockError) throw stockError;
    if (!updatedItem) {
      throw new Error(
        "Stock changed while confirming the return. Reload the page and try again.",
      );
    }

    return {
      updatedTransaction: updatedTx,
      updatedStock: Number(updatedItem.stock_onhand),
    };
  } catch (stockError) {
    const { error: rollbackError } = await supabaseClient
      .from("inventory_transactions")
      .update({
        status: PENDING_RETURN_STATUS,
        return_date: null,
        recieved_by: null,
      })
      .eq("transaction_id", record.id)
      .eq("status", "Returned");
    if (rollbackError) {
      console.error(
        "Return confirmation stock update failed and transaction rollback did not complete.",
        rollbackError,
      );
    }
    throw stockError;
  }
}

export async function declineInventoryReturn({
  supabaseClient,
  record,
  receivedBy = "Secretary",
  reason = "",
}) {
  const declinedBy = String(receivedBy || "").trim() || "Secretary";
  const trimmedReason = String(reason || "").trim();
  const baseRemarks = String(record?.remarks || "").trim();
  const rawNextRemarks = trimmedReason
    ? baseRemarks
      ? `${baseRemarks} [Declined: ${trimmedReason}]`
      : `[Declined: ${trimmedReason}]`
    : undefined;
  const nextPurpose =
    rawNextRemarks !== undefined && record?.isExternalBorrower && record?.person
      ? encodePurposeWithBorrower(record.person, rawNextRemarks)
      : rawNextRemarks;

  const updatePayload = {
    status: RETURN_DECLINED_STATUS,
    recieved_by: declinedBy,
    ...(nextPurpose !== undefined ? { purpose: nextPurpose } : {}),
  };

  const { data: updatedTx, error: txError } = await supabaseClient
    .from("inventory_transactions")
    .update(updatePayload)
    .eq("transaction_id", record.id)
    .eq("status", PENDING_RETURN_STATUS)
    .select(INVENTORY_TRANSACTION_COLUMNS)
    .maybeSingle();

  if (txError) throw txError;
  if (!updatedTx) {
    throw new Error(
      "This return request has already been processed or could not be updated.",
    );
  }
  return updatedTx;
}

export function mapMasterlistItem(item) {
  const usageType = getItemUsageType(item);
  return {
    ...item,
    id: item.item_id,
    productId: `PRD-${String(item.item_id).padStart(4, "0")}`,
    name: item.item_name,
    quantity: item.stock_onhand,
    lowStockAt: item.min_stock,
    ...(usageType !== "Both" ? { usageType } : {}),
  };
}

export function reconcileBorrowReturnState(records) {
  const nextRecords = (Array.isArray(records) ? records : [])
    .filter(Boolean)
    .map((record) => ({ ...record }));
  const chronologicalRecords = [...nextRecords].sort((left, right) => {
    const dateOrder =
      new Date(left.dateTime || 0).getTime() -
      new Date(right.dateTime || 0).getTime();
    return dateOrder || Number(left.id) - Number(right.id);
  });
  const loansByOwnerAndItem = new Map();

  for (const record of chronologicalRecords) {
    const normalizedPerson = String(record.person || "").trim().toLowerCase();
    const ownerKey = record.isExternalBorrower
      ? `external:${normalizedPerson}`
      : (record.personUserId ?? normalizedPerson);
    const key = `${ownerKey}:${record.productId}`;
    const actionType = record.actionType
      ? String(record.actionType).toLowerCase()
      : record.status === "Borrowed"
        ? "borrow"
        : record.status === "Returned" ||
            record.status === PENDING_RETURN_STATUS ||
            record.status === RETURN_DECLINED_STATUS
          ? "return"
          : "use";

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
      record.pendingReturnQuantity = 0;
      record.returnEvents = [];
      record.returnedAt = null;
      account.loans.push({
        record,
        remaining: quantity,
        pending: 0,
      });
      account.borrowed += quantity;
      continue;
    }

    if (actionType !== "return") continue;

    if (record.status === RETURN_DECLINED_STATUS) {
      const firstOpenLoan = account.loans.find((loan) => loan.remaining > 0);
      record.isPendingConfirmation = false;
      record.borrowedQuantity = account.borrowed;
      record.cumulativeReturnedQuantity = account.returned;
      record.remainingQuantity = Math.max(0, account.borrowed - account.returned);
      record.borrowedAt = firstOpenLoan?.record.dateTime || null;
      record.borrowRecordId = firstOpenLoan?.record.id || null;
      record.returnedAt = null;
      record.borrowRemarks = firstOpenLoan?.record.remarks || "";
      record.returnRemarks = record.remarks;
      continue;
    }

    if (record.status === PENDING_RETURN_STATUS) {
      const quantity = Number(record.quantity) || 0;
      let quantityToAllocate = quantity;
      let firstMatchedLoan = null;
      const matchedLoans = [];

      for (const loan of account.loans) {
        if (quantityToAllocate <= 0) break;
        const unallocated = Math.max(0, loan.remaining - loan.pending);
        if (unallocated <= 0) continue;

        const pendingFromLoan = Math.min(quantityToAllocate, unallocated);
        loan.pending += pendingFromLoan;
        quantityToAllocate -= pendingFromLoan;
        loan.record.pendingReturnQuantity =
          Number(loan.record.pendingReturnQuantity || 0) + pendingFromLoan;
        firstMatchedLoan ||= loan;
        matchedLoans.push(loan);
      }

      const remainingBalance = Math.max(0, account.borrowed - account.returned);
      record.isPendingConfirmation = true;
      record.isPartialReturn = quantity < remainingBalance;
      record.borrowedQuantity = account.borrowed;
      record.cumulativeReturnedQuantity = account.returned;
      record.remainingQuantity = remainingBalance;
      record.borrowedAt = firstMatchedLoan?.record.dateTime || null;
      record.borrowRecordId =
        matchedLoans.length === 1 ? firstMatchedLoan?.record.id || null : null;
      record.returnedAt = null;
      record.borrowRemarks = firstMatchedLoan?.record.remarks || "";
      record.returnRemarks = record.remarks;
      continue;
    }

    const quantity = Number(record.quantity) || 0;
    const availableBalance = Math.max(0, account.borrowed - account.returned);
    const appliedQuantity = Math.min(quantity, availableBalance);
    let quantityToAllocate = appliedQuantity;
    let firstMatchedLoan = null;
    const matchedLoans = [];
    const returnEvents = [];

    let excessPending = 0;

    for (const loan of account.loans) {
      if (quantityToAllocate <= 0) break;
      if (loan.remaining <= 0) continue;

      const returnedFromLoan = Math.min(quantityToAllocate, loan.remaining);
      loan.remaining -= returnedFromLoan;
      quantityToAllocate -= returnedFromLoan;
      loan.record.returnedQuantity =
        Number(loan.record.returnedQuantity) + returnedFromLoan;
      if (loan.pending > loan.remaining) {
        excessPending += loan.pending - loan.remaining;
        loan.pending = loan.remaining;
        loan.record.pendingReturnQuantity = loan.pending;
      }
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

    if (excessPending > 0) {
      for (const loan of account.loans) {
        if (excessPending <= 0) break;
        const availablePendingRoom = Math.max(0, loan.remaining - loan.pending);
        if (availablePendingRoom <= 0) continue;
        const shifted = Math.min(excessPending, availablePendingRoom);
        loan.pending += shifted;
        excessPending -= shifted;
        loan.record.pendingReturnQuantity = loan.pending;
      }
    }

    account.returned += appliedQuantity;
    const remainingBalance = Math.max(0, account.borrowed - account.returned);
    record.isPendingConfirmation = false;
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

  return nextRecords;
}

export function mapInventoryTransactions(rows, inventoryById, usersById) {
  const mappedRecords = (Array.isArray(rows) ? rows : []).map((row) => {
    const item = inventoryById.get(Number(row.item_id));
    const user = usersById.get(Number(row.is_issued_to));
    const parsedPurpose = parsePurposeWithBorrower(row.purpose);
    const actionType = String(row.action_type || "").toLowerCase();
    const rawStatus = String(row.status || "").trim();
    const status =
      actionType === "return"
        ? rawStatus === PENDING_RETURN_STATUS ||
          rawStatus === RETURN_DECLINED_STATUS
          ? rawStatus
          : "Returned"
        : row.status;

    return {
      id: row.transaction_id,
      itemId: Number(row.item_id),
      dateTime: row.created_at || row.return_date || row.borrow_date || "",
      productId: `PRD-${String(row.item_id).padStart(4, "0")}`,
      productName: item?.name || `Item ${row.item_id}`,
      usageType:
        actionType === "borrow" || actionType === "return"
          ? "Borrowable"
          : item?.usageType || "Usable",
      quantity: row.quantity,
      unit: row.unit,
      status,
      actionType: row.action_type,
      person: parsedPurpose.isExternalBorrower
        ? parsedPurpose.borrowerName
        : user?.username || "",
      isExternalBorrower: parsedPurpose.isExternalBorrower,
      personUserId: row.is_issued_to,
      remarks: parsedPurpose.remarks,
      returnedBy: row.returned_by || "",
      receivedBy: row.recieved_by || "",
      borrowDate: row.borrow_date || null,
      returnDate: row.return_date || null,
    };
  });

  return reconcileBorrowReturnState(mappedRecords);
}

export function getItemUsageType(item) {
  const normalize = (value) => String(value || "").trim().toLowerCase();
  const usageType = normalize(item?.usageType);
  if (usageType === "usable") return "Usable";
  if (usageType === "borrowable") return "Borrowable";

  const category = normalize(item?.category);
  if (category === "usable") return "Usable";
  if (category === "borrowable") return "Borrowable";

  const classification = normalize(item?.classification);
  if (classification === "usable") return "Usable";
  if (classification === "borrowable") return "Borrowable";

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
  if (status === PENDING_RETURN_STATUS) return "status-pending";
  if (status === RETURN_DECLINED_STATUS) return "status-action-needed";
  return "status-started";
}
