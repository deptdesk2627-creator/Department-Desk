import { useMemo, useState } from "react";
import {
  confirmInventoryReturn,
  declineInventoryReturn,
  getItemUsageType,
  isLowStock,
  MASTERLIST_COLUMNS,
  mapMasterlistItem,
  PENDING_RETURN_STATUS,
  reconcileBorrowReturnState,
  RETURN_DECLINED_STATUS,
} from "../../../utils/inventory";
import {
  getProductId,
  useInventoryActions,
} from "../../../hooks/useInventoryActions";
import { supabase } from "../../../supabase/supabaseClient";
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
  persistAction,
  userName = "Secretary",
  recordInventoryForCurrentUserOnly = false,
  recordingUserId = null,
  recordingPerson = "",
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [inventoryError, setInventoryError] = useState("");
  const [returnActionError, setReturnActionError] = useState("");
  const [processingReturnIds, setProcessingReturnIds] = useState(() => new Set());
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
  const balanceRecords = useMemo(
    () =>
      recordInventoryForCurrentUserOnly
        ? recordItems.filter(
            (record) =>
              recordingUserId &&
              Number(record.personUserId) === Number(recordingUserId),
          )
        : recordItems,
    [recordInventoryForCurrentUserOnly, recordItems, recordingUserId],
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

  const pendingReturns = useMemo(
    () =>
      recordItems.filter(
        (record) => record.status === PENDING_RETURN_STATUS,
      ),
    [recordItems],
  );

  const stockActions = useInventoryActions({
    inventory: inventoryItems,
    records: recordItems,
    balanceRecords,
    setInventory,
    setRecords,
    persistAction,
    person: recordingPerson,
    requireRemarks: true,
  });

  async function addItem(event) {
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

    const itemRecord = {
      item_name: form.name.trim(),
      stock_onhand: quantity,
      unit: form.unit.trim(),
      min_stock: lowStockAt,
      category: usageType,
      classification: usageType === "Borrowable" ? "Equipment" : "Item",
      archived_at: null,
      created_at: new Date().toISOString().slice(0, 10),
    };

    try {
      const { data, error } = await supabase
        .from("items_masterlist")
        .insert(itemRecord)
        .select(MASTERLIST_COLUMNS)
        .single();
      if (error) throw error;
      if (!data) throw new Error("Supabase did not return the saved inventory item.");

      const savedItem = mapMasterlistItem(data);
      setInventory((current) => [savedItem, ...(Array.isArray(current) ? current : [])]);
      setFormError("");
      setInventoryError("");
    } catch (error) {
      console.error("Could not save the inventory item to Supabase.", error);
      setFormError("Could not save this product. Please try again.");
      return false;
    }

    setForm(INITIAL_FORM);
    return true;
  }

  async function deleteItem(id) {
    try {
      const { data, error } = await supabase
        .from("items_masterlist")
        .update({ archived_at: new Date().toISOString().slice(0, 10) })
        .eq("item_id", id)
        .is("archived_at", null)
        .select("item_id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("The inventory item was not found or is already archived.");

      setInventory((current) =>
        (Array.isArray(current) ? current : []).filter((item) => item?.id !== id),
      );
      setInventoryError("");
    } catch (error) {
      console.error("Could not archive the inventory item in Supabase.", error);
      setInventoryError("Could not remove this product from the masterlist.");
    }
  }

  async function updateItem(id, changes) {
    try {
      const { data, error } = await supabase
        .from("items_masterlist")
        .update({
          stock_onhand: changes.quantity,
          unit: changes.unit,
          min_stock: changes.lowStockAt,
        })
        .eq("item_id", id)
        .select(MASTERLIST_COLUMNS)
        .single();
      if (error) throw error;
      if (!data) throw new Error("Supabase did not return the updated inventory item.");

      const savedItem = mapMasterlistItem(data);
      setInventory((current) =>
        (Array.isArray(current) ? current : []).map((item) =>
          item?.id === id ? { ...item, ...savedItem } : item,
        ),
      );
      setInventoryError("");
      return savedItem;
    } catch (error) {
      console.error("Could not update the inventory item in Supabase.", error);
      throw new Error("Could not save these stock details. Please try again.");
    }
  }

  async function confirmReturn(record) {
    if (!record || record.status !== PENDING_RETURN_STATUS) return false;
    if (processingReturnIds.has(record.id)) return false;

    const matchedItem = inventoryItems.find(
      (item) =>
        Number(item.item_id ?? item.id) === Number(record.itemId) ||
        getProductId(item) === record.productId,
    );
    if (!matchedItem) {
      setReturnActionError(
        "Could not find this product in the active inventory masterlist.",
      );
      return false;
    }

    const amount = Number(record.quantity);
    if (!Number.isInteger(amount) || amount <= 0) {
      setReturnActionError("This return record does not have a valid quantity.");
      return false;
    }

    setReturnActionError("");
    setProcessingReturnIds((current) => new Set(current).add(record.id));
    const confirmedBy = String(userName || "").trim() || "Secretary";
    const today = new Date().toISOString().slice(0, 10);

    try {
      const result = await confirmInventoryReturn({
        supabaseClient: supabase,
        record,
        item: matchedItem,
        receivedBy: confirmedBy,
      });
      const nextStock = result.updatedStock;
      const savedReturnDate = result.updatedTransaction?.return_date || today;

      setInventory((current) =>
        (Array.isArray(current) ? current : []).map((item) =>
          item?.id === matchedItem.id
            ? {
                ...item,
                quantity: nextStock,
                stock_onhand: nextStock,
              }
            : item,
        ),
      );
      setRecords((current) => {
        const existingList = Array.isArray(current) ? current : [];
        const updatedList = existingList.map((entry) =>
          entry?.id === record.id
            ? {
                ...entry,
                status: "Returned",
                returnDate: savedReturnDate,
                receivedBy: confirmedBy,
                isPendingConfirmation: false,
              }
            : entry,
        );
        return reconcileBorrowReturnState(updatedList);
      });
      return true;
    } catch (error) {
      console.error("Could not confirm the staff return.", error);
      setReturnActionError(
        error.message || "Could not confirm this return. Please try again.",
      );
      return false;
    } finally {
      setProcessingReturnIds((current) => {
        const next = new Set(current);
        next.delete(record.id);
        return next;
      });
    }
  }

  async function declineReturn(record, reason = "") {
    if (!record || record.status !== PENDING_RETURN_STATUS) return false;
    if (processingReturnIds.has(record.id)) return false;

    setReturnActionError("");
    setProcessingReturnIds((current) => new Set(current).add(record.id));
    const declinedBy = String(userName || "").trim() || "Secretary";
    const trimmedReason = String(reason || "").trim();

    try {
      const updatedTx = await declineInventoryReturn({
        supabaseClient: supabase,
        record,
        receivedBy: declinedBy,
        reason: trimmedReason,
      });
      const nextPurpose = updatedTx?.purpose ?? (record.remarks || "");

      setRecords((current) => {
        const existingList = Array.isArray(current) ? current : [];
        const updatedList = existingList.map((entry) =>
          entry?.id === record.id
            ? {
                ...entry,
                status: RETURN_DECLINED_STATUS,
                receivedBy: declinedBy,
                remarks: nextPurpose,
                returnRemarks: nextPurpose,
                isPendingConfirmation: false,
              }
            : entry,
        );
        return reconcileBorrowReturnState(updatedList);
      });
      return true;
    } catch (error) {
      console.error("Could not decline the staff return.", error);
      setReturnActionError(
        error.message || "Could not decline this return. Please try again.",
      );
      return false;
    } finally {
      setProcessingReturnIds((current) => {
        const next = new Set(current);
        next.delete(record.id);
        return next;
      });
    }
  }

  return {
    form,
    setForm,
    formError,
    inventoryError,
    returnActionError,
    processingReturnIds,
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
    pendingReturns,
    usageBreakdown,
    lowStockCount,
    stockActions,
    addItem,
    deleteItem,
    updateItem,
    confirmReturn,
    declineReturn,
  };
}
