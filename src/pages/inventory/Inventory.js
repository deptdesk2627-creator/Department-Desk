import { useState } from "react";
import "./Inventory.css";
import { PageHeader } from "../../components/ui";
import InventoryForm from "./components/InventoryForm";
import InventoryMetrics from "./components/InventoryMetrics";
import InventoryRecords from "./components/InventoryRecords";
import InventoryTable from "./components/InventoryTable";
import StockActionModal from "./components/StockActionModal";
import { useAdminInventory } from "./hooks/useAdminInventory";

const SEARCH_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

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
    loggedUsageValue,
    lowStockCount,
    stockActions,
    addItem,
    deleteItem,
  } = useAdminInventory({
    inventory,
    setInventory,
    records,
    setRecords,
    search,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);

  function handleAddSubmit(event) {
    if (addItem(event)) {
      setIsFormOpen(false);
    }
  }

  return (
    <div className="dashboard module-page inventory-page">
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
                className="primary-button inventory-add-btn"
                aria-haspopup="dialog"
                aria-expanded={isFormOpen}
                onClick={() => setIsFormOpen(true)}
              >
                ＋ Add product
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
      {!readOnly && (
        <InventoryForm
          isOpen={isFormOpen}
          form={form}
          setForm={setForm}
          formError={formError}
          onSubmit={handleAddSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      <div className="inventory-workspace">
        <div className="inventory-tabs-bar">
          <div
            className="inventory-folder-tabs"
            role="tablist"
            aria-label="Supply and inventory views"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "master"}
              className={`inventory-folder-tab ${activeTab === "master" ? "is-active" : ""}`}
              onClick={() => setActiveTab("master")}
            >
              <span>Master list</span>
              <span className="inventory-tab-badge">
                {inventoryItems.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "transactions"}
              className={`inventory-folder-tab ${activeTab === "transactions" ? "is-active" : ""}`}
              onClick={() => setActiveTab("transactions")}
            >
              <span>Transaction</span>
              <span className="inventory-tab-badge">{recordItems.length}</span>
            </button>
          </div>

          <div className="inventory-toolbar-controls">
            {activeTab === "master" ? (
              <>
                <label className="inventory-search-box">
                  <span className="inventory-search-icon">{SEARCH_ICON}</span>
                  <input
                    type="search"
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Search product name, ID, or stock level..."
                    aria-label="Search products"
                  />
                </label>
                <div className="inventory-filter-pill">
                  <select
                    value={stockFilter}
                    onChange={(event) => setStockFilter(event.target.value)}
                    aria-label="Filter stock levels"
                  >
                    <option value="All">All stock levels</option>
                    <option value="In stock">In stock</option>
                    <option value="Low stock">Low stock</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <label className="inventory-search-box">
                  <span className="inventory-search-icon">{SEARCH_ICON}</span>
                  <input
                    type="search"
                    value={recordSearch}
                    onChange={(event) => setRecordSearch(event.target.value)}
                    placeholder="Search borrower, record ID, or product..."
                    aria-label="Search transaction records"
                  />
                </label>
                <div className="inventory-filter-pill">
                  <select
                    value={recordFilter}
                    onChange={(event) => setRecordFilter(event.target.value)}
                    aria-label="Filter status"
                  >
                    <option value="All">All status</option>
                    <option value="Borrowed">Borrowed</option>
                    <option value="Returned">Returned</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {activeTab === "master" ? (
          <InventoryTable
            items={visibleItems}
            totalItems={inventoryItems.length}
            onOpenAction={stockActions.openAction}
            getBorrowedBalance={stockActions.getBorrowedBalance}
            onDelete={deleteItem}
            readOnly={readOnly}
          />
        ) : (
          <InventoryRecords
            records={visibleRecords}
            totalRecords={recordItems.length}
            filter={recordFilter}
            setFilter={setRecordFilter}
          />
        )}
      </div>

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
    </div>
  );
}

export default Inventory;
