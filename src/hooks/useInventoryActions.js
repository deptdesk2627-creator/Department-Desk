import { useMemo, useState } from "react";
import {
  canBorrowItem,
  canUseItem,
  getItemUsageType,
} from "../utils/inventory";

const STATUS_BY_ACTION = {
  Borrow: "Borrowed",
  Return: "Returned",
  Use: "Used",
};

export function getProductId(item) {
  if (item?.productId) return item.productId;
  const legacyNumber = Number(String(item?.id || "").match(/(\d+)$/)?.[1]);
  return `PRD-${String(legacyNumber || 0).padStart(4, "0")}`;
}

export function useInventoryActions({
  inventory,
  records,
  balanceRecords,
  setInventory,
  setRecords,
  person = "",
  requirePerson = false,
  requireRemarks = false,
  returnLimitMessage = "The return quantity cannot exceed the borrowed balance.",
}) {
  const [action, setAction] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [personName, setPersonName] = useState("");
  const [returnedBy, setReturnedBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [receiptRecord, setReceiptRecord] = useState(null);

  const inventoryItems = Array.isArray(inventory) ? inventory.filter(Boolean) : [];
  const recordItems = Array.isArray(records) ? records.filter(Boolean) : [];
  const scopedRecords = Array.isArray(balanceRecords)
    ? balanceRecords.filter(Boolean)
    : recordItems;

  function getBorrowedBalance(item, borrowerName = "") {
    const id = getProductId(item);
    const normalizedBorrower = String(borrowerName || "").trim().toLowerCase();
    return scopedRecords.reduce((balance, record) => {
      if (record.productId !== id) return balance;
      if (
        normalizedBorrower &&
        String(record.person || "").trim().toLowerCase() !== normalizedBorrower
      ) {
        return balance;
      }
      const amount = Number(record.quantity);
      if (!Number.isFinite(amount)) return balance;
      if (record.status === "Borrowed") return balance + amount;
      if (record.status === "Returned") return balance - amount;
      return balance;
    }, 0);
  }

  const activeBorrowers = useMemo(() => {
    if (!action?.item) return [];
    const id = getProductId(action.item);
    const balancesByPerson = new Map();

    // Process oldest to newest so balances accumulate accurately
    for (const record of [...scopedRecords].reverse()) {
      if (record.productId !== id) continue;
      const amount = Number(record.quantity);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      const rawName = String(record.person || "").trim();
      const key = rawName.toLowerCase() || "__anonymous__";
      const existing = balancesByPerson.get(key) || {
        name: rawName || "Unspecified borrower",
        balance: 0,
      };
      if (record.status === "Borrowed") {
        existing.balance += amount;
      } else if (record.status === "Returned") {
        existing.balance = Math.max(0, existing.balance - amount);
      }
      balancesByPerson.set(key, existing);
    }

    return Array.from(balancesByPerson.values()).filter(
      (entry) => entry.balance > 0 && entry.name !== "Unspecified borrower",
    );
  }, [action, scopedRecords]);

  function openAction(item, type) {
    setAction({ item, type });
    setQuantity("1");
    const defaultPerson = String(person || "").trim();
    if (defaultPerson) {
      setPersonName(defaultPerson);
    } else if (type === "Return") {
      const id = getProductId(item);
      const latestBorrow = scopedRecords.find(
        (rec) =>
          rec.productId === id &&
          rec.status === "Borrowed" &&
          Number(rec.returnedQuantity || 0) < Number(rec.quantity || 0) &&
          rec.person,
      );
      setPersonName(latestBorrow?.person || "");
    } else {
      setPersonName("");
    }
    setReturnedBy("");
    setRemarks("");
    setError("");
  }

  function closeAction() {
    setAction(null);
  }

  function openReceipt(record) {
    if (record) {
      setReceiptRecord(record);
    }
  }

  function closeReceipt() {
    setReceiptRecord(null);
  }

  function submitAction(event) {
    event.preventDefault();
    if (!action) return;

    const trimmedPerson = String(person || personName || "").trim();
    const trimmedRepresentative = String(returnedBy || "").trim();
    if (requirePerson && !trimmedPerson) {
      setError("Enter your name at the top of the page first.");
      return;
    }

    const trimmedRemarks = String(remarks || "").trim();
    if (requireRemarks && action.type !== "Return" && !trimmedRemarks) {
      setError("Enter a remark or purpose for borrowing or using this item.");
      return;
    }

    const amount = Number(quantity);
    const item =
      inventoryItems.find((stock) => stock.id === action.item.id) || action.item;

    if ((action.type === "Borrow" || action.type === "Return") && !canBorrowItem(item)) {
      setError("This product is usable only and cannot be borrowed or returned.");
      return;
    }
    if (action.type === "Use" && !canUseItem(item)) {
      setError("This product is borrowable only and must be borrowed and returned.");
      return;
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      setError("Enter a whole-number quantity greater than zero.");
      return;
    }
    if (action.type !== "Return" && amount > Number(item.quantity)) {
      setError("The quantity cannot exceed the available stock.");
      return;
    }

    const totalItemBorrowedBalance = getBorrowedBalance(item);
    const personBorrowedBalance = trimmedPerson
      ? getBorrowedBalance(item, trimmedPerson)
      : totalItemBorrowedBalance;
    const effectiveMaxReturn =
      personBorrowedBalance > 0 ? personBorrowedBalance : totalItemBorrowedBalance;

    if (action.type === "Return" && amount > effectiveMaxReturn) {
      setError(returnLimitMessage);
      return;
    }

    setError("");
    const id = getProductId(item);
    const nowIso = new Date().toISOString();
    const newRecordId = `REC-${Date.now()}-${recordItems.length + 1}`;

    // Find open Borrowed record for this return
    const matchedBorrowRecord =
      action.type === "Return"
        ? recordItems.find(
            (existing) =>
              existing.productId === id &&
              existing.status === "Borrowed" &&
              Number(existing.returnedQuantity || 0) <
                Number(existing.quantity || 0) &&
              (!trimmedPerson ||
                !existing.person ||
                String(existing.person).toLowerCase() ===
                  trimmedPerson.toLowerCase()),
          ) ||
          recordItems.find(
            (existing) =>
              existing.productId === id &&
              existing.status === "Borrowed" &&
              Number(existing.returnedQuantity || 0) <
                Number(existing.quantity || 0),
          ) ||
          recordItems.find(
            (existing) =>
              existing.productId === id && existing.status === "Borrowed",
          )
        : null;

    const borrowedTotalQty = matchedBorrowRecord
      ? Number(matchedBorrowRecord.quantity) || amount
      : amount;
    const previouslyReturnedQty = matchedBorrowRecord
      ? Number(matchedBorrowRecord.returnedQuantity) || 0
      : 0;
    const cumulativeReturnedQty =
      action.type === "Return"
        ? Math.min(borrowedTotalQty, previouslyReturnedQty + amount)
        : 0;
    const remainingBorrowedQty =
      action.type === "Return"
        ? Math.max(0, borrowedTotalQty - cumulativeReturnedQty)
        : 0;
    const isFullReturn =
      action.type === "Return" && remainingBorrowedQty === 0;
    const isPartialReturn =
      action.type === "Return" && remainingBorrowedQty > 0;

    const returnEventEntry =
      action.type === "Return"
        ? {
            id: newRecordId,
            dateTime: nowIso,
            quantity: amount,
            person: trimmedPerson || matchedBorrowRecord?.person || "",
            returnedBy:
              trimmedRepresentative ||
              trimmedPerson ||
              matchedBorrowRecord?.person ||
              "",
            remarks: trimmedRemarks,
            remainingAfter: remainingBorrowedQty,
          }
        : null;

    const updatedReturnEvents =
      action.type === "Return"
        ? [
            ...(Array.isArray(matchedBorrowRecord?.returnEvents)
              ? matchedBorrowRecord.returnEvents
              : []),
            returnEventEntry,
          ]
        : [];

    const effectiveRemarks =
      action.type === "Return"
        ? trimmedRemarks || matchedBorrowRecord?.remarks || ""
        : trimmedRemarks;

    const record = {
      id: newRecordId,
      dateTime: nowIso,
      productId: id,
      productName: item.name,
      usageType: getItemUsageType(item),
      quantity: amount,
      unit: item.unit,
      status: STATUS_BY_ACTION[action.type] || "Used",
      ...(action.type === "Borrow"
        ? {
            returnedQuantity: 0,
            returnEvents: [],
          }
        : {}),
      ...(trimmedPerson ? { person: trimmedPerson } : {}),
      ...(trimmedRepresentative ? { returnedBy: trimmedRepresentative } : {}),
      ...(effectiveRemarks
        ? { remarks: effectiveRemarks }
        : requirePerson
          ? { remarks: "" }
          : {}),
      ...(action.type === "Return"
        ? {
            // Only set returnedAt as the final completion date when 100% of the borrowed quantity is returned
            returnedAt: isFullReturn ? nowIso : null,
            partialReturnedAt: isPartialReturn ? nowIso : null,
            isPartialReturn,
            borrowedQuantity: borrowedTotalQty,
            cumulativeReturnedQuantity: cumulativeReturnedQty,
            remainingQuantity: remainingBorrowedQty,
            borrowedAt: matchedBorrowRecord?.dateTime || null,
            borrowRecordId: matchedBorrowRecord?.id || null,
            borrowRemarks: matchedBorrowRecord?.remarks || "",
            returnRemarks: trimmedRemarks,
            returnEvents: updatedReturnEvents,
          }
        : {}),
    };

    setInventory((current) =>
      (Array.isArray(current) ? current : []).map((stock) =>
        stock?.id === item.id
          ? {
              ...stock,
              productId: id,
              quantity:
                Number(stock.quantity) +
                (action.type === "Return" ? amount : -amount),
              usedThisYear:
                Number(stock.usedThisYear || 0) +
                (action.type === "Use" ? amount : 0),
            }
          : stock,
      ),
    );
    setRecords((current) => {
      const existingList = Array.isArray(current) ? current : [];
      const updatedList =
        action.type === "Return" && matchedBorrowRecord
          ? existingList.map((entry) =>
              entry?.id === matchedBorrowRecord.id
                ? {
                    ...entry,
                    returnedQuantity: cumulativeReturnedQty,
                    remainingQuantity: remainingBorrowedQty,
                    // Only stamp final returnedAt when all borrowed units are returned
                    returnedAt: isFullReturn ? nowIso : null,
                    returnRecordId: record.id,
                    returnEvents: updatedReturnEvents,
                    ...(trimmedRemarks ? { returnRemarks: trimmedRemarks } : {}),
                  }
                : entry,
            )
          : existingList;
      return [record, ...updatedList];
    });
    setReceiptRecord(record);
    closeAction();
  }

  return {
    action,
    activeBorrowers,
    closeAction,
    closeReceipt,
    error,
    getBorrowedBalance,
    openAction,
    openReceipt,
    personName,
    quantity,
    receiptRecord,
    remarks,
    returnedBy,
    setPersonName,
    setQuantity,
    setRemarks,
    setReturnedBy,
    submitAction,
  };
}
