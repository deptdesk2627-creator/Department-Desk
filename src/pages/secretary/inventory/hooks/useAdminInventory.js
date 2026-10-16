import { useMemo, useState } from "react";
import {
  getProductId,
  useInventoryActions,
} from "../../../../hooks/useInventoryActions";
import { matchesQuery } from "../../../../utils/search";

const INITIAL_FORM = {
  name: "",
  quantity: "",
  unit: "units",
  lowStockAt: "2",
  unitCost: "",
};

export function useAdminInventory({
  inventory = [],
  setInventory,
  records = [],
  setRecords,
  search = "",
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [recordFilter, setRecordFilter] = useState("All");
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const inventoryItems = useMemo(
    () => (Array.isArray(inventory) ? inventory.filter(Boolean) : []),
    [inventory],
  );
  const recordItems = useMemo(
    () => (Array.isArray(records) ? records.filter(Boolean) : []),
    [records],
  );

  const visibleItems = useMemo(
    () =>
      inventoryItems.filter((item) =>
        matchesQuery(
          search,
          item.productId,
          item.id,
          item.name,
          item.unit,
          item.quantity,
          item.lowStockAt,
        ),
      ),
    [inventoryItems, search],
  );

  const visibleRecords = useMemo(
    () =>
      recordItems.filter((record) => {
        const matchesFilter =
          recordFilter === "All" || record.status === recordFilter;
        const matchesSearch = matchesQuery(
          search,
          record.id,
          record.person,
          record.productId,
          record.productName,
          record.status,
          record.unit,
          record.quantity,
          record.dateTime,
        );
        return matchesFilter && matchesSearch;
      }),
    [recordItems, search, recordFilter],
  );

  const loggedUsageValue = useMemo(
    () =>
      recordItems
        .filter((record) => record.status === "Used")
        .reduce((total, record) => {
          const quantity = Number(record.quantity);
          const parsedUnitCost = Number(record.unitCost);
          const unitCost = Number.isFinite(parsedUnitCost) ? parsedUnitCost : 0;
          return Number.isFinite(quantity) ? total + quantity * unitCost : total;
        }, 0),
    [recordItems],
  );

  const lowStockCount = useMemo(
    () =>
      inventoryItems.filter(
        (item) =>
          Number.isFinite(Number(item.quantity)) &&
          Number(item.quantity) <= Number(item.lowStockAt || 0),
      ).length,
    [inventoryItems],
  );

  const stockActions = useInventoryActions({
    inventory: inventoryItems,
    records: recordItems,
    setInventory,
    setRecords,
  });

  function addItem(event) {
    event.preventDefault();
    const quantity = Number(form.quantity);
    const lowStockAt = Number(form.lowStockAt);
    const unitCost = form.unitCost === "" ? 0 : Number(form.unitCost);
    if (
      !form.name.trim() ||
      !form.unit.trim() ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      !Number.isInteger(lowStockAt) ||
      lowStockAt < 0 ||
      !Number.isFinite(unitCost) ||
      unitCost < 0
    ) {
      setFormError(
        "Enter a product name, unit, and valid non-negative stock and cost values.",
      );
      return;
    }
    setFormError("");
    setInventory((current) => {
      const currentItems = Array.isArray(current) ? current.filter(Boolean) : [];
      const nextProductNumber =
        currentItems.reduce((highest, item) => {
          const productNumber =
            Number(getProductId(item).match(/(\d+)$/)?.[1]) || 0;
          return Math.max(highest, productNumber);
        }, 0) + 1;
      return [
        {
          ...form,
          name: form.name.trim(),
          unit: form.unit.trim(),
          id: `supply-${nextProductNumber}`,
          productId: `PRD-${String(nextProductNumber).padStart(4, "0")}`,
          quantity,
          lowStockAt,
          unitCost,
          usedThisYear: 0,
        },
        ...currentItems,
      ];
    });
    setForm(INITIAL_FORM);
  }

  function deleteItem(id) {
    setInventory((current) =>
      (Array.isArray(current) ? current : []).filter((item) => item?.id !== id),
    );
  }

  function handleConfirmReset() {
    setInventory([]);
    setRecords([]);
    setIsResetConfirmOpen(false);
  }

  return {
    form,
    setForm,
    formError,
    recordFilter,
    setRecordFilter,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    inventoryItems,
    recordItems,
    visibleItems,
    visibleRecords,
    loggedUsageValue,
    lowStockCount,
    stockActions,
    addItem,
    deleteItem,
    handleConfirmReset,
  };
}
