import { useEffect, useState } from "react";
import "./Inventory.css";
import { PageHeader } from "../../components/ui";
import { supabase } from "../../supabase/supabaseClient";
import InventoryForm from "./components/InventoryForm";
import InventoryMetrics from "./components/InventoryMetrics";
import InventoryReceiptModal from "./components/InventoryReceiptModal";
import InventoryRecords from "./components/InventoryRecords";
import InventoryTable from "./components/InventoryTable";
import InventoryItemModal from "./components/InventoryItemModal";
import StockActionModal from "./components/StockActionModal";
import { useAdminInventory } from "./hooks/useAdminInventory";
import {
  INVENTORY_TRANSACTION_COLUMNS,
  MASTERLIST_COLUMNS,
  mapInventoryTransactions,
  mapMasterlistItem,
} from "../../utils/inventory";

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
    inventoryError,
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
  } = useAdminInventory({
    inventory,
    setInventory,
    records,
    setRecords,
    search,
    persistAction: persistInventoryAction,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryLoadError, setInventoryLoadError] = useState("");
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsLoadError, setTransactionsLoadError] = useState("");
  const [transactionUsers, setTransactionUsers] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadInventoryData() {
      const [itemsResult, usersResult, transactionsResult] = await Promise.all([
        supabase
          .from("items_masterlist")
          .select(MASTERLIST_COLUMNS)
          .is("archived_at", null)
          .order("item_name"),
        supabase.from("users").select("user_id, username").order("username"),
        supabase
          .from("inventory_transactions")
          .select(INVENTORY_TRANSACTION_COLUMNS)
          .order("created_at", { ascending: false }),
      ]);

      if (!isMounted) return;
      if (itemsResult.error) {
        console.error(
          "Could not load the secretary inventory masterlist.",
          itemsResult.error,
        );
        setInventoryLoadError("Could not load the inventory masterlist.");
      } else {
        const items = (Array.isArray(itemsResult.data) ? itemsResult.data : [])
          .map(mapMasterlistItem);
        setInventory(items);
        setInventoryLoadError("");
      }

      const users = Array.isArray(usersResult.data)
        ? usersResult.data.filter((user) => user?.user_id && user?.username)
        : [];
      setTransactionUsers(users);
      if (usersResult.error) {
        console.error(
          "Could not load inventory recipient accounts.",
          usersResult.error,
        );
        setTransactionsLoadError(
          "Could not load recipient accounts. Check the users table SELECT policy.",
        );
      }

      if (transactionsResult.error) {
        console.error(
          "Could not load secretary inventory transactions.",
          transactionsResult.error,
        );
        setTransactionsLoadError(
          "Could not load inventory transactions. Check the inventory_transactions SELECT policy.",
        );
      } else {
        const inventoryById = new Map(
          (Array.isArray(itemsResult.data) ? itemsResult.data : [])
            .map(mapMasterlistItem)
            .map((item) => [Number(item.item_id), item]),
        );
        const usersById = new Map(
          users.map((user) => [Number(user.user_id), user]),
        );
        setRecords(
          mapInventoryTransactions(
            transactionsResult.data,
            inventoryById,
            usersById,
          ),
        );
        if (!usersResult.error) setTransactionsLoadError("");
      }
      setInventoryLoading(false);
      setTransactionsLoading(false);
    }

    loadInventoryData().catch((error) => {
      if (!isMounted) return;
      console.error("Could not load secretary inventory data.", error);
      setInventoryLoadError("Could not load the inventory masterlist.");
      setTransactionsLoadError("Could not load inventory transactions.");
      setInventoryLoading(false);
      setTransactionsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [setInventory, setRecords]);

  async function persistInventoryAction({
    actionType,
    amount,
    item,
    matchedBorrowRecord,
    record,
  }) {
    const username = String(record.person || "").trim();
    const recipient = transactionUsers.find(
      (user) =>
        String(user.username).trim().toLowerCase() === username.toLowerCase(),
    );
    if (!recipient) {
      throw new Error(
        "Choose a name that matches a username in the Supabase users table.",
      );
    }

    const itemId = Number(item.item_id ?? item.id);
    const currentQuantity = Number(item.stock_onhand ?? item.quantity);
    const nextQuantity =
      currentQuantity + (actionType === "Return" ? amount : -amount);
    const { data: updatedItem, error: stockError } = await supabase
      .from("items_masterlist")
      .update({ stock_onhand: nextQuantity })
      .eq("item_id", itemId)
      .eq("stock_onhand", currentQuantity)
      .is("archived_at", null)
      .select("item_id, stock_onhand")
      .maybeSingle();
    if (stockError) throw stockError;
    if (!updatedItem) {
      throw new Error(
        "Stock changed in Supabase. Refresh the masterlist and try again.",
      );
    }

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const borrowDate =
      actionType === "Borrow"
        ? today
        : actionType === "Return"
          ? String(
              matchedBorrowRecord?.borrowDate ||
                matchedBorrowRecord?.dateTime ||
                today,
            ).slice(0, 10)
          : null;
    const transaction = {
      item_id: itemId,
      is_issued_to: recipient.user_id,
      purpose: record.remarks || "",
      quantity: amount,
      action_type: actionType,
      return_date: actionType === "Return" ? today : null,
      borrow_date: borrowDate,
      status: record.status,
      unit: record.unit,
      created_at: record.dateTime,
      recieved_by: null,
      returned_by: actionType === "Return" ? record.returnedBy || null : null,
    };

    let savedTransaction;
    try {
      const { data, error } = await supabase
        .from("inventory_transactions")
        .insert(transaction)
        .select(INVENTORY_TRANSACTION_COLUMNS)
        .single();
      if (error) throw error;
      if (!data) throw new Error("Supabase did not return the saved transaction.");
      savedTransaction = data;
    } catch (transactionError) {
      const { data: rolledBackItem, error: rollbackError } = await supabase
        .from("items_masterlist")
        .update({ stock_onhand: currentQuantity })
        .eq("item_id", itemId)
        .eq("stock_onhand", nextQuantity)
        .select("item_id")
        .maybeSingle();
      if (rollbackError || !rolledBackItem) {
        console.error(
          "Inventory transaction failed and stock rollback did not complete.",
          rollbackError || transactionError,
        );
        throw new Error(
          "Transaction save failed and stock could not be restored. Contact the administrator before retrying.",
        );
      }
      throw transactionError;
    }

    return {
      ...record,
      id: savedTransaction.transaction_id,
      dateTime: savedTransaction.created_at || record.dateTime,
      personUserId: recipient.user_id,
      borrowDate: savedTransaction.borrow_date,
      returnDate: savedTransaction.return_date,
    };
  }

  async function handleAddSubmit(event) {
    if (await addItem(event)) {
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
            ? "Review stock levels, borrowing history, and item usage statistics."
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
        usageBreakdown={usageBreakdown}
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
            isLoading={inventoryLoading}
            loadError={inventoryLoadError || inventoryError}
            onOpenAction={stockActions.openAction}
            getBorrowedBalance={stockActions.getBorrowedBalance}
            onDelete={deleteItem}
            onViewDetails={setSelectedInventoryItem}
            readOnly={readOnly}
          />
        ) : (
          <InventoryRecords
            records={visibleRecords}
            totalRecords={recordItems.length}
            isLoading={transactionsLoading}
            loadError={transactionsLoadError}
            filter={recordFilter}
            setFilter={setRecordFilter}
            onViewReceipt={stockActions.openReceipt}
          />
        )}
      </div>

      <InventoryItemModal
        item={selectedInventoryItem}
        records={recordItems}
        isOpen={Boolean(selectedInventoryItem)}
        editable={!readOnly}
        onSave={async (changes) => {
          const savedItem = await updateItem(selectedInventoryItem.id, changes);
          setSelectedInventoryItem((current) =>
            current ? { ...current, ...savedItem } : current,
          );
        }}
        onClose={() => setSelectedInventoryItem(null)}
      />

      <StockActionModal
        action={stockActions.action}
        personName={stockActions.personName}
        setPersonName={stockActions.setPersonName}
        returnedBy={stockActions.returnedBy}
        setReturnedBy={stockActions.setReturnedBy}
        activeBorrowers={stockActions.activeBorrowers}
        quantity={stockActions.quantity}
        setQuantity={stockActions.setQuantity}
        remarks={stockActions.remarks}
        setRemarks={stockActions.setRemarks}
        error={stockActions.error}
        getBorrowedBalance={stockActions.getBorrowedBalance}
        personOptions={transactionUsers}
        isSubmitting={stockActions.isSubmitting}
        onSubmit={stockActions.submitAction}
        onClose={stockActions.closeAction}
      />

      <InventoryReceiptModal
        record={stockActions.receiptRecord}
        inventory={inventoryItems}
        records={recordItems}
        onClose={stockActions.closeReceipt}
      />
    </div>
  );
}

export default Inventory;
