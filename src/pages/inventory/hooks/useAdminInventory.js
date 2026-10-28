import { useMemo, useState } from "react";
import {
  getProductId,
  useInventoryActions,
} from "../../../hooks/useInventoryActions";
import { getItemUsageType, isLowStock } from "../../../utils/inventory";
import { matchesQuery } from "../../../utils/search";

const INITIAL_FORM = {
  name: "",
  usageType: "Usable",
  quantity: "",
  unit: "units",
  lowStockAt: "2",
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
  const [activeTab, setActiveTab] = useState("master");
  const [productSearch, setProductSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("All");
  const [recordSearch, setRecordSearch] = useState("");
  const [recordFilter, setRecordFilter] = useState("All");

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
      inventoryItems.filter((item) => {
        const lowStock = isLowStock(item);
        const stockLabel = lowStock ? "Low stock" : "In stock";
        const usageType = getItemUsageType(item);
        const matchesStockFilter =
          stockFilter === "All" ||
          (stockFilter === "Low stock" && lowStock) ||
          (stockFilter === "In stock" && !lowStock);

        const itemFields = [
          getProductId(item),
          item.productId,
          item.id,
          item.name,
          item.unit,
          item.quantity,
          item.lowStockAt,
          stockLabel,
          usageType,
        ];

        const matchesGlobalSearch = matchesQuery(search, ...itemFields);
        const matchesLocalSearch = matchesQuery(productSearch, ...itemFields);

        return matchesStockFilter && matchesGlobalSearch && matchesLocalSearch;
      }),
    [inventoryItems, search, productSearch, stockFilter],
  );

  const visibleRecords = useMemo(
    () =>
      recordItems.filter((record) => {
        const matchesFilter =
          recordFilter === "All" || record.status === recordFilter;
        const recordFields = [
          record.id,
          record.person,
          record.productId,
          record.productName,
          record.status,
          record.unit,
          record.quantity,
          record.remarks,
          record.dateTime,
        ];
        const matchesGlobalSearch = matchesQuery(search, ...recordFields);
        const matchesLocalSearch = matchesQuery(recordSearch, ...recordFields);
        return matchesFilter && matchesGlobalSearch && matchesLocalSearch;
      }),
    [recordItems, search, recordSearch, recordFilter],
  );

  const usageBreakdown = useMemo(() => {
    const map = new Map();

    for (const record of recordItems) {
      if (record.status !== "Used" && record.status !== "Borrowed") continue;
      const qty = Number(record.quantity);
      if (!Number.isFinite(qty) || qty <= 0) continue;

      const key = record.productId || record.productName || "unknown";
      const existing = map.get(key) || {
        key,
        name: record.productName || key,
        unit: record.unit || "units",
        usedQuantity: 0,
        borrowedQuantity: 0,
        totalQuantity: 0,
      };
      if (record.status === "Used") {
        existing.usedQuantity += qty;
      } else {
        existing.borrowedQuantity += qty;
      }
      existing.totalQuantity += qty;
      map.set(key, existing);
    }

    for (const item of inventoryItems) {
      const key = getProductId(item);
      const usedThisYear = Number(item.usedThisYear) || 0;
      if (!map.has(key) && usedThisYear > 0) {
        map.set(key, {
          key,
          name: item.name,
          unit: item.unit || "units",
          usedQuantity: usedThisYear,
          borrowedQuantity: 0,
          totalQuantity: usedThisYear,
        });
      }
    }

    const sorted = Array.from(map.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity,
    );
    const grandTotal = sorted.reduce(
      (sum, entry) => sum + entry.totalQuantity,
      0,
    );

    return sorted.map((entry) => ({
      ...entry,
      share: grandTotal > 0 ? entry.totalQuantity / grandTotal : 0,
      sharePercent:
        grandTotal > 0 ? Math.round((entry.totalQuantity / grandTotal) * 100) : 0,
    }));
  }, [recordItems, inventoryItems]);

  const lowStockCount = useMemo(
    () => inventoryItems.filter(isLowStock).length,
    [inventoryItems],
  );

  const stockActions = useInventoryActions({
    inventory: inventoryItems,
    records: recordItems,
    setInventory,
    setRecords,
    requireRemarks: true,
  });

  function addItem(event) {
    event.preventDefault();
    const quantity = Number(form.quantity);
    const lowStockAt = Number(form.lowStockAt);
    const usageType =
      form.usageType === "Borrowable" ? "Borrowable" : "Usable";
    if (
      !form.name.trim() ||
      !form.unit.trim() ||
      form.quantity === "" ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      form.lowStockAt === "" ||
      !Number.isInteger(lowStockAt) ||
      lowStockAt < 0
    ) {
      setFormError(
        "Enter a product name, unit, and valid non-negative stock values.",
      );
      return false;
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
          usageType,
          id: `supply-${nextProductNumber}`,
          productId: `PRD-${String(nextProductNumber).padStart(4, "0")}`,
          quantity,
          lowStockAt,
          usedThisYear: 0,
        },
        ...currentItems,
      ];
    });
    setForm(INITIAL_FORM);
    return true;
  }

  function deleteItem(id) {
    setInventory((current) =>
      (Array.isArray(current) ? current : []).filter((item) => item?.id !== id),
    );
  }

  function updateItem(id, changes) {
    setInventory((current) =>
      (Array.isArray(current) ? current : []).map((item) =>
        item?.id === id ? { ...item, ...changes } : item,
      ),
    );
  }

  return {
    form,
    setForm,
    formError,
    activeTab,
    setActiveTab,
    productSearch,
    setProductSearch,
    stockFilter,
    setStockFilter,
    recordSearch,
    setRecordSearch,
    recordFilter,
    setRecordFilter,
    inventoryItems,
    recordItems,
    visibleItems,
    visibleRecords,
    usageBreakdown,
    lowStockCount,
    stockActions,
    addItem,
    deleteItem,
    updateItem,
  };
}
