import { useMemo, useState } from "react";
import "./Inventory.css";
import { getProductId, useInventoryActions } from "./hooks/useInventoryActions";
import InventoryForm from "./components/InventoryForm";
import InventoryMetrics from "./components/InventoryMetrics";
import InventoryRecords from "./components/InventoryRecords";
import InventoryTable from "./components/InventoryTable";
import StockActionModal from "./components/StockActionModal";

function Inventory({
  inventory = [],
  setInventory = () => {
    throw new Error("Inventory requires a setInventory callback.");
  },
  records = [],
  setRecords = () => {
    throw new Error("Inventory requires a setRecords callback.");
  },
  search = "",
}) {
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    unit: "units",
    lowStockAt: "2",
    unitCost: "",
  });
  const [formError, setFormError] = useState("");
  const [recordFilter, setRecordFilter] = useState("All");
  const inventoryItems = useMemo(
    () => (Array.isArray(inventory) ? inventory.filter(Boolean) : []),
    [inventory],
  );
  const recordItems = useMemo(
    () => (Array.isArray(records) ? records.filter(Boolean) : []),
    [records],
  );
  const visibleItems = useMemo(() => {
    const query = String(search || "").trim().toLowerCase();
    if (!query) return inventoryItems;
    return inventoryItems.filter((item) =>
      [item.productId, item.id, item.name, item.unit, item.quantity, item.lowStockAt]
        .some((value) => String(value || "").toLowerCase().includes(query)),
    );
  }, [inventoryItems, search]);
  const visibleRecords = useMemo(() => {
    const query = String(search || "").trim().toLowerCase();
    return recordItems.filter((record) => {
      const matchesFilter = recordFilter === "All" || record.status === recordFilter;
      const matchesQuery =
        !query ||
        [
          record.id,
          record.productId,
          record.productName,
          record.status,
          record.unit,
          record.quantity,
          record.dateTime,
        ].some((value) => String(value || "").toLowerCase().includes(query));
      return matchesFilter && matchesQuery;
    });
  }, [recordItems, search, recordFilter]);
  const loggedUsageValue = recordItems
    .filter((record) => record.status === "Used")
    .reduce((total, record) => {
      const quantity = Number(record.quantity);
      const parsedUnitCost = Number(record.unitCost);
      const unitCost = Number.isFinite(parsedUnitCost) ? parsedUnitCost : 0;
      return Number.isFinite(quantity) ? total + quantity * unitCost : total;
    }, 0);
  const lowStockCount = inventoryItems.filter(
    (item) =>
      Number.isFinite(Number(item.quantity)) &&
      Number(item.quantity) <= Number(item.lowStockAt || 0),
  ).length;
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
    setForm({
      name: "",
      quantity: "",
      unit: "units",
      lowStockAt: "2",
      unitCost: "",
    });
  }

  function deleteItem(id) {
    setInventory((current) =>
      (Array.isArray(current) ? current : []).filter(
        (item) => item?.id !== id,
      ),
    );
  }

  return (
    <div className="dashboard module-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">OFFICE WORKSPACE · SUPPLY &amp; INVENTORY</p>
          <h1>Supply &amp; inventory</h1>
          <p className="page-subtitle">
            Track products, record borrowing and use, and keep a history of returns.
          </p>
        </div>
      </section>
      <InventoryMetrics
        productCount={inventoryItems.length}
        lowStockCount={lowStockCount}
        usageValue={loggedUsageValue}
        recordCount={recordItems.length}
      />
      <InventoryForm
        form={form}
        setForm={setForm}
        formError={formError}
        onSubmit={addItem}
      />
      <InventoryTable
        items={visibleItems}
        totalItems={inventoryItems.length}
        onOpenAction={stockActions.openAction}
        getBorrowedBalance={stockActions.getBorrowedBalance}
        onDelete={deleteItem}
      />
      <InventoryRecords
        records={visibleRecords}
        totalRecords={recordItems.length}
        filter={recordFilter}
        setFilter={setRecordFilter}
      />
      <StockActionModal
        action={stockActions.action}
        quantity={stockActions.quantity}
        setQuantity={stockActions.setQuantity}
        error={stockActions.error}
        getBorrowedBalance={stockActions.getBorrowedBalance}
        onSubmit={stockActions.submitAction}
        onClose={stockActions.closeAction}
      />
    </div>
  );
}

export default Inventory;
