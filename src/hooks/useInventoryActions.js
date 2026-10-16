import { useState } from "react";

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
  returnLimitMessage = "The return quantity cannot exceed the borrowed balance.",
}) {
  const [action, setAction] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [personName, setPersonName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

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

  function submitAction(event) {
    event.preventDefault();
    if (!action) return;

    const trimmedPerson = String(person || personName || "").trim();
    if (requirePerson && !trimmedPerson) {
      setError("Enter your name at the top of the page first.");
      return;
    }

    const amount = Number(quantity);
    const item =
      inventoryItems.find((stock) => stock.id === action.item.id) || action.item;
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
      quantity: amount,
      unit: item.unit,
      status: STATUS_BY_ACTION[action.type] || "Used",
      unitCost: Number(item.unitCost) || 0,
      ...(trimmedPerson ? { person: trimmedPerson } : {}),
      ...(remarks.trim() ? { remarks: remarks.trim() } : requirePerson ? { remarks: "" } : {}),
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
    closeAction();
  }

  return {
    action,
    closeAction,
    error,
    getBorrowedBalance,
    openAction,
    personName,
    quantity,
    remarks,
    setPersonName,
    setQuantity,
    setRemarks,
    submitAction,
  };
}
