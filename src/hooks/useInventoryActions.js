import { useMemo, useRef, useState } from "react";
import {
  canBorrowItem,
  canUseItem,
  getItemUsageType,
  PENDING_RETURN_STATUS,
  reconcileBorrowReturnState,
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
  persistAction,
  person = "",
  requirePerson = false,
  requireRemarks = false,
  requireReturnConfirmation = false,
  returnLimitMessage = "The return quantity cannot exceed the borrowed balance.",
}) {
  const [action, setAction] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [personName, setPersonName] = useState("");
  const [isCustomPerson, setIsCustomPerson] = useState(false);
  const [returnedBy, setReturnedBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [receiptRecord, setReceiptRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInProgress = useRef(false);

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

  function getPendingReturnBalance(item, borrowerName = "") {
    const id = getProductId(item);
    const normalizedBorrower = String(borrowerName || "").trim().toLowerCase();
    return scopedRecords.reduce((pending, record) => {
      if (record.productId !== id) return pending;
      if (record.status !== PENDING_RETURN_STATUS) return pending;
      if (
        normalizedBorrower &&
        String(record.person || "").trim().toLowerCase() !== normalizedBorrower
      ) {
        return pending;
      }
      const amount = Number(record.quantity);
      return Number.isFinite(amount) && amount > 0 ? pending + amount : pending;
    }, 0);
  }

  function getReturnableBalance(item, borrowerName = "") {
    return Math.max(
      0,
      getBorrowedBalance(item, borrowerName) -
        getPendingReturnBalance(item, borrowerName),
    );
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
      } else if (
        record.status === "Returned" ||
        record.status === PENDING_RETURN_STATUS
      ) {
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
    setIsCustomPerson(false);
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

    const isPendingReturn =
      action.type === "Return" && requireReturnConfirmation;

    const totalItemBorrowedBalance = getBorrowedBalance(item);
    const totalItemReturnableBalance = getReturnableBalance(item);
    const personBorrowedBalance = trimmedPerson
      ? getBorrowedBalance(item, trimmedPerson)
      : totalItemBorrowedBalance;
    const personReturnableBalance = trimmedPerson
      ? getReturnableBalance(item, trimmedPerson)
      : totalItemReturnableBalance;
    const personPendingBalance = trimmedPerson
      ? getPendingReturnBalance(item, trimmedPerson)
      : getPendingReturnBalance(item);
    const effectiveMaxReturn =
      personBorrowedBalance > 0 || trimmedPerson
        ? personReturnableBalance
        : totalItemReturnableBalance;

    if (action.type === "Return" && amount > effectiveMaxReturn) {
      if (effectiveMaxReturn === 0 && personPendingBalance > 0) {
        setError(
          requireReturnConfirmation
            ? "Your return is already pending secretary confirmation."
            : "This borrower already has a return pending secretary confirmation.",
        );
      } else {
        setError(returnLimitMessage);
      }
      return;
    }

    setError("");
    const id = getProductId(item);
    const nowIso = new Date().toISOString();
    const newRecordId = `REC-${Date.now()}-${recordItems.length + 1}`;

    // Find open Borrowed record for this return
    const hasOpenReturnRoom = (existing) =>
      Number(existing.returnedQuantity || 0) +
        (requireReturnConfirmation
          ? Number(existing.pendingReturnQuantity || 0)
          : 0) <
      Number(existing.quantity || 0);

    const matchedBorrowRecord =
      action.type === "Return"
        ? scopedRecords.find(
            (existing) =>
              existing.productId === id &&
              existing.status === "Borrowed" &&
              hasOpenReturnRoom(existing) &&
              (!trimmedPerson ||
                !existing.person ||
                String(existing.person).toLowerCase() ===
                  trimmedPerson.toLowerCase()),
          ) ||
          scopedRecords.find(
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
          scopedRecords.find(
            (existing) =>
              existing.productId === id &&
              existing.status === "Borrowed" &&
              Number(existing.returnedQuantity || 0) <
                Number(existing.quantity || 0),
          ) ||
          scopedRecords.find(
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
        ? isPendingReturn
          ? previouslyReturnedQty
          : Math.min(borrowedTotalQty, previouslyReturnedQty + amount)
        : 0;
    const remainingBorrowedQty =
      action.type === "Return"
        ? Math.max(0, borrowedTotalQty - cumulativeReturnedQty)
        : 0;
    const isFullReturn =
      action.type === "Return" && !isPendingReturn && remainingBorrowedQty === 0;
    const isPartialReturn =
      action.type === "Return" &&
      (isPendingReturn
        ? amount < remainingBorrowedQty
        : remainingBorrowedQty > 0);

    const returnEventEntry =
      action.type === "Return" && !isPendingReturn
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
      action.type === "Return" && !isPendingReturn
        ? [
            ...(Array.isArray(matchedBorrowRecord?.returnEvents)
              ? matchedBorrowRecord.returnEvents
              : []),
            returnEventEntry,
          ]
        : [];

    const effectiveRemarks = trimmedRemarks;

    const record = {
      id: newRecordId,
      itemId: Number(item.item_id ?? item.id) || undefined,
      dateTime: nowIso,
      productId: id,
      productName: item.name,
      usageType: getItemUsageType(item),
      quantity: amount,
      unit: item.unit,
      status: isPendingReturn
        ? PENDING_RETURN_STATUS
        : STATUS_BY_ACTION[action.type] || "Used",
      ...(action.type === "Borrow"
        ? {
            returnedQuantity: 0,
            pendingReturnQuantity: 0,
            returnEvents: [],
          }
        : {}),
      ...(trimmedPerson ? { person: trimmedPerson } : {}),
      ...(isCustomPerson && action.type !== "Return"
        ? { isExternalBorrower: true }
        : action.type === "Return" && matchedBorrowRecord?.isExternalBorrower
          ? { isExternalBorrower: true }
          : {}),
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
            partialReturnedAt: isPartialReturn && !isPendingReturn ? nowIso : null,
            isPartialReturn,
            isPendingConfirmation: isPendingReturn,
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

    const normalizedBorrower = String(
      trimmedPerson || matchedBorrowRecord?.person || "",
    )
      .trim()
      .toLowerCase();
    const openLoansForReturn =
      action.type === "Return"
        ? scopedRecords.filter(
            (existing) =>
              existing.productId === id &&
              existing.status === "Borrowed" &&
              Number(existing.returnedQuantity || 0) <
                Number(existing.quantity || 0) &&
              (!normalizedBorrower ||
                !existing.person ||
                String(existing.person).toLowerCase() === normalizedBorrower),
          )
        : [];
    const hasMultipleOpenLoans = openLoansForReturn.length > 1;

    function commitRecord(savedRecord) {
      if (!isPendingReturn) {
        setInventory((current) =>
          (Array.isArray(current) ? current : []).map((stock) => {
            if (stock?.id !== item.id) return stock;
            const nextQuantity =
              Number(stock.quantity) +
              (action.type === "Return" ? amount : -amount);
            return {
              ...stock,
              productId: id,
              quantity: nextQuantity,
              stock_onhand: nextQuantity,
              usedThisYear:
                Number(stock.usedThisYear || 0) +
                (action.type === "Use" ? amount : 0),
            };
          }),
        );
      }
      let nextReceiptRecord = savedRecord;
      if (hasMultipleOpenLoans) {
        const reconciledSaved = reconcileBorrowReturnState([
          savedRecord,
          ...recordItems,
        ]).find((entry) => entry?.id === savedRecord.id);
        if (reconciledSaved) {
          nextReceiptRecord = reconciledSaved;
        }
      }
      setRecords((current) => {
        const existingList = Array.isArray(current) ? current : [];
        if (hasMultipleOpenLoans) {
          return reconcileBorrowReturnState([savedRecord, ...existingList]);
        }
        const updatedList =
          action.type === "Return" && matchedBorrowRecord
            ? existingList.map((entry) =>
                entry?.id === matchedBorrowRecord.id
                  ? isPendingReturn
                    ? {
                        ...entry,
                        pendingReturnQuantity:
                          (Number(entry.pendingReturnQuantity) || 0) + amount,
                      }
                    : {
                        ...entry,
                        returnedQuantity: cumulativeReturnedQty,
                        remainingQuantity: remainingBorrowedQty,
                        returnedAt: isFullReturn ? nowIso : null,
                        returnRecordId: savedRecord.id,
                        returnEvents: updatedReturnEvents,
                        ...(trimmedRemarks
                          ? { returnRemarks: trimmedRemarks }
                          : {}),
                      }
                  : entry,
              )
            : existingList;
        return [savedRecord, ...updatedList];
      });
      setReceiptRecord(nextReceiptRecord);
      closeAction();
    }

    if (!persistAction) {
      commitRecord(record);
      return;
    }

    if (submissionInProgress.current) return;
    submissionInProgress.current = true;
    setIsSubmitting(true);
    Promise.resolve()
      .then(() =>
        persistAction({
          actionType: action.type,
          amount,
          item,
          matchedBorrowRecord,
          record,
        }),
      )
      .then((savedRecord) => {
        if (!savedRecord) {
          throw new Error("The inventory transaction was not saved.");
        }
        commitRecord(savedRecord);
      })
      .catch((saveError) => {
        console.error("Could not save the inventory transaction.", saveError);
        setError(
          saveError.message || "Could not save the inventory transaction.",
        );
      })
      .finally(() => {
        submissionInProgress.current = false;
        setIsSubmitting(false);
      });
  }

  return {
    action,
    activeBorrowers,
    closeAction,
    closeReceipt,
    error,
    isCustomPerson,
    isSubmitting,
    getBorrowedBalance,
    getPendingReturnBalance,
    getReturnableBalance,
    openAction,
    openReceipt,
    personName,
    quantity,
    receiptRecord,
    remarks,
    returnedBy,
    setIsCustomPerson,
    setPersonName,
    setQuantity,
    setRemarks,
    setReturnedBy,
    submitAction,
  };
}
