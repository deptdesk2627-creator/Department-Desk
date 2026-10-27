import { useState } from "react";
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
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [receiptRecord, setReceiptRecord] = useState(null);

  const inventoryItems = Array.isArray(inventory) ? inventory.filter(Boolean) : [];
  const recordItems = Array.isArray(records) ? records.filter(Boolean) : [];
  const scopedRecords = Array.isArray(balanceRecords)
    ? balanceRecords.filter(Boolean)
    : recordItems;

  function getBorrowedBalance(item) {
    const id = getProductId(item);
    return scopedRecords.reduce((balance, record) => {
      if (record.productId !== id) return balance;
      const amount = Number(record.quantity);
      if (!Number.isFinite(amount)) return balance;
      if (record.status === "Borrowed") return balance + amount;
      if (record.status === "Returned") return balance - amount;
      return balance;
    }, 0);
  }

  function openAction(item, type) {
    setAction({ item, type });
    setQuantity("1");
    setPersonName(String(person || "").trim());
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
    if (action.type === "Return" && amount > getBorrowedBalance(item)) {
      setError(returnLimitMessage);
      return;
    }

    setError("");
    const id = getProductId(item);
    const record = {
      id: `REC-${Date.now()}-${recordItems.length + 1}`,
      dateTime: new Date().toISOString(),
      productId: id,
      productName: item.name,
      usageType: getItemUsageType(item),
      quantity: amount,
      unit: item.unit,
      status: STATUS_BY_ACTION[action.type] || "Used",
      ...(trimmedPerson ? { person: trimmedPerson } : {}),
      ...(trimmedRemarks
        ? { remarks: trimmedRemarks }
        : requirePerson
          ? { remarks: "" }
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
    setRecords((current) => [record, ...(Array.isArray(current) ? current : [])]);
    setReceiptRecord(record);
    closeAction();
  }

  return {
    action,
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
    setPersonName,
    setQuantity,
    setRemarks,
    submitAction,
  };
}
