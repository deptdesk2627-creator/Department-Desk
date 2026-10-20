import { useState } from "react";
import "./Inventory.css";
import { ConfirmModal, PageHeader } from "../../components/ui";
import InventoryForm from "./components/InventoryForm";
import InventoryMetrics from "./components/InventoryMetrics";
import InventoryRecords from "./components/InventoryRecords";
import InventoryTable from "./components/InventoryTable";
import StockActionModal from "./components/StockActionModal";
import { useAdminInventory } from "./hooks/useAdminInventory";

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
  readOnly = false,
}) {
  const {
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
  } = useAdminInventory({
    inventory,
    setInventory,
    records,
    setRecords,
    search,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);

  function handleAddSubmit(event) {
    addItem(event);
    if (form.name?.trim() && form.unit?.trim()) {
      setIsFormOpen(false);
    }
  }

  return (
    <div className="dashboard module-page">
      <PageHeader
        eyebrow="OFFICE WORKSPACE · SUPPLY & INVENTORY"
        title="Supply & inventory"
        subtitle={
          readOnly
            ? "Review stock levels, borrowing history, and budgeting statistics."
            : "Track products, record borrowing and use, and keep a history of returns."
        }
        actions={
          !readOnly && (
            <div className="page-heading__actions">
              <button
                type="button"
                className={isFormOpen ? "secondary-button" : "primary-button"}
                aria-expanded={isFormOpen}
                onClick={() => setIsFormOpen((open) => !open)}
              >
                {isFormOpen ? "✕ Close form" : "＋ Add product"}
              </button>
              <button
                type="button"
                className="text-button danger-outline-button"
                onClick={() => setIsResetConfirmOpen(true)}
              >
                ↺ Reset inventory
              </button>
            </div>
          )
        }
      />
      <InventoryMetrics
        productCount={inventoryItems.length}
        lowStockCount={lowStockCount}
        usageValue={loggedUsageValue}
        recordCount={recordItems.length}
      />
      {!readOnly && isFormOpen && (
        <InventoryForm
          form={form}
          setForm={setForm}
          formError={formError}
          onSubmit={handleAddSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
      <InventoryTable
        items={visibleItems}
        totalItems={inventoryItems.length}
        onOpenAction={stockActions.openAction}
        getBorrowedBalance={stockActions.getBorrowedBalance}
        onDelete={deleteItem}
        readOnly={readOnly}
      />
      <InventoryRecords
        records={visibleRecords}
        totalRecords={recordItems.length}
        filter={recordFilter}
        setFilter={setRecordFilter}
      />
      <StockActionModal
        action={stockActions.action}
        personName={stockActions.personName}
        setPersonName={stockActions.setPersonName}
        quantity={stockActions.quantity}
        setQuantity={stockActions.setQuantity}
        error={stockActions.error}
        getBorrowedBalance={stockActions.getBorrowedBalance}
        onSubmit={stockActions.submitAction}
        onClose={stockActions.closeAction}
      />
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Supply & Inventory Data"
        titleId="reset-modal-title"
        message="Are you sure you want to clear all supplies and remove all transaction records? The inventory will be completely empty."
        confirmLabel="Yes, clear all data"
        danger
      />
    </div>
  );
}

export default Inventory;
