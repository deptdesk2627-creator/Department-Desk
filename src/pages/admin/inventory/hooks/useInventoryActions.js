import { useState } from "react";

function productId(item) {
  if (item.productId) return item.productId;
  const legacyNumber = Number(String(item.id).match(/(\d+)$/)?.[1]);
  return `PRD-${String(legacyNumber || 0).padStart(4, "0")}`;
}

export function useInventoryActions({
  inventory,
  records,
  setInventory,
  setRecords,
}) {
  const [action, setAction] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const inventoryItems = Array.isArray(inventory) ? inventory.filter(Boolean) : [];
  const recordItems = Array.isArray(records) ? records.filter(Boolean) : [];

  function getBorrowedBalance(item) {
    const id = productId(item);
    return recordItems.reduce((balance, record) => {
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
    setError("");
  }

  function closeAction() {
    setAction(null);
  }

  function submitAction(event) {
    event.preventDefault();
    if (!action) return;

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
      setError("The return quantity cannot exceed the borrowed balance.");
      return;
    }

    setError("");
    const id = productId(item);
    const record = {
      id: `REC-${Date.now()}-${recordItems.length + 1}`,
      dateTime: new Date().toISOString(),
      productId: id,
      productName: item.name,
      quantity: amount,
      unit: item.unit,
      status:
        action.type === "Borrow"
          ? "Borrowed"
          : action.type === "Return"
            ? "Returned"
            : "Used",
      unitCost: Number(item.unitCost) || 0,
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
    quantity,
    setQuantity,
    submitAction,
  };
}

export { productId as getProductId };
