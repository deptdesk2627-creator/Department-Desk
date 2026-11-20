import { useEffect, useRef, useState } from "react";
import "./Inventory.css";
import { ConfirmModal, PageHeader } from "../../components/ui";
import { isItemCleared, isRecordCleared } from "../../constants/system";
import { getProductId } from "../../hooks/useInventoryActions";
import { supabase } from "../../supabase/supabaseClient";
import InventoryForm from "./components/InventoryForm";
import InventoryMetrics from "./components/InventoryMetrics";
import InventoryReceiptModal from "./components/InventoryReceiptModal";
import InventoryRecords from "./components/InventoryRecords";
import InventoryTable from "./components/InventoryTable";
import InventoryItemModal from "./components/InventoryItemModal";
import PendingReturnsPanel from "./components/PendingReturnsPanel";
import StockActionModal from "./components/StockActionModal";
import { useAdminInventory } from "./hooks/useAdminInventory";
import {
  INVENTORY_TRANSACTION_COLUMNS,
  MASTERLIST_COLUMNS,
  mapInventoryTransactions,
  mapMasterlistItem,
  persistInventoryTransaction,
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
  canRecordInventory = !readOnly,
  recordInventoryForCurrentUserOnly = false,
  userName = "Secretary",
  navigationContext = null,
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [itemPendingDelete, setItemPendingDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryLoadError, setInventoryLoadError] = useState("");
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsLoadError, setTransactionsLoadError] = useState("");
  const [transactionUsers, setTransactionUsers] = useState([]);
  const recordingUserId = recordInventoryForCurrentUserOnly
    ? transactionUsers[0]?.user_id
    : null;
  const recordingPerson = recordInventoryForCurrentUserOnly
    ? transactionUsers[0]?.username || ""
    : "";
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
    returnActionError,
    processingReturnIds,
    inventoryItems,
    recordItems,
    transactionRecords,
    visibleItems,
    visibleRecords,
    pendingReturns,
    visiblePendingReturns,
    usageBreakdown,
    lowStockCount,
    stockActions,
    addItem,
    deleteItem,
    updateItem,
    confirmReturn,
    declineReturn,
  } = useAdminInventory({
    inventory,
    setInventory,
    records,
    setRecords,
    search,
    persistAction: persistInventoryAction,
    userName,
    recordInventoryForCurrentUserOnly,
    recordingUserId,
    recordingPerson,
  });
  const appliedNavKeyRef = useRef(null);

  useEffect(() => {
    if (
      navigationContext?.page === "inventory" &&
      navigationContext.key &&
      appliedNavKeyRef.current !== navigationContext.key
    ) {
      appliedNavKeyRef.current = navigationContext.key;
      if (navigationContext.tab) {
        setActiveTab(navigationContext.tab);
      }
      if (navigationContext.stockFilter) {
        setStockFilter(navigationContext.stockFilter);
      }
    }
  }, [navigationContext, setActiveTab, setStockFilter]);

  useEffect(() => {
    let isMounted = true;

    async function loadInventoryData() {
      const authResult = await supabase.auth.getUser();
      if (!isMounted) return;
      if (authResult.error || !authResult.data?.user?.id) {
        const authError =
          authResult.error || new Error("No authenticated Supabase user.");
        console.error(
          "Could not identify the signed-in inventory account.",
          authError,
        );
        setInventory([]);
        setRecords([]);
        setTransactionUsers([]);
        setInventoryLoadError(
          "This session is not authenticated with Supabase. Sign in with your account to load inventory.",
        );
        setTransactionsLoadError(
          "This session is not authenticated with Supabase. Sign in with your account to load transactions.",
        );
        setInventoryLoading(false);
        setTransactionsLoading(false);
        return;
      }

      const usersQuery = supabase
        .from("users")
        .select("user_id, username");
      if (recordInventoryForCurrentUserOnly) {
        usersQuery.eq("auth_user_id", authResult.data.user.id);
      }

      const [itemsResult, usersResult, transactionsResult] = await Promise.all([
        supabase
          .from("items_masterlist")
          .select(MASTERLIST_COLUMNS)
          .is("archived_at", null)
          .order("item_name"),
        usersQuery.order("username"),
        supabase
          .from("inventory_transactions")
          .select(INVENTORY_TRANSACTION_COLUMNS)
          .order("created_at", { ascending: false }),
      ]);

      if (!isMounted) return;
      if (itemsResult.error) {
        console.error(
          "Could not load the inventory masterlist.",
          itemsResult.error,
        );
        setInventory([]);
        setInventoryLoadError(
          `Could not load the inventory masterlist: ${itemsResult.error.message}`,
        );
      } else {
        const items = (Array.isArray(itemsResult.data) ? itemsResult.data : [])
          .filter((item) => !isItemCleared(item.item_id))
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
          `Could not load recipient accounts: ${usersResult.error.message}`,
        );
      }

      if (transactionsResult.error) {
        console.error(
          "Could not load inventory transactions.",
          transactionsResult.error,
        );
        setTransactionsLoadError(
          `Could not load inventory transactions: ${transactionsResult.error.message}`,
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
        const activeTransactions = (
          Array.isArray(transactionsResult.data) ? transactionsResult.data : []
        ).filter((row) => !isRecordCleared(row.created_at));
        setRecords(
          mapInventoryTransactions(
            activeTransactions,
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
      console.error("Could not load inventory data.", error);
      setInventoryLoadError(
        `Could not load the inventory masterlist: ${error.message}`,
      );
      setTransactionsLoadError(
        `Could not load inventory transactions: ${error.message}`,
      );
      setInventoryLoading(false);
      setTransactionsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [recordInventoryForCurrentUserOnly, setInventory, setRecords]);

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

    return persistInventoryTransaction({
      supabaseClient: supabase,
      item,
      recipientId: recipient.user_id,
      actionType,
      amount,
      matchedBorrowRecord,
      record:
        actionType === "Return"
          ? { ...record, receivedBy: record.receivedBy || userName }
          : record,
    });
  }

  async function handleAddSubmit(event) {
    if (await addItem(event)) {
      setIsFormOpen(false);
    }
  }

  function requestDeleteItem(id) {
    const target = inventoryItems.find((item) => item?.id === id);
    if (target) {
      setItemPendingDelete(target);
    }
  }

  async function handleConfirmDeleteItem() {
    if (!itemPendingDelete || isDeletingItem) return;
    setIsDeletingItem(true);
    try {
      await deleteItem(itemPendingDelete.id);
      setItemPendingDelete(null);
    } finally {
      setIsDeletingItem(false);
    }
  }

  return (
    <div className="dashboard module-page inventory-page">
      <PageHeader
        eyebrow="OFFICE WORKSPACE · SUPPLY & INVENTORY"
        title="Supply & inventory"
        subtitle={
          readOnly && canRecordInventory
            ? "Borrow, use, or return supplies from your account. Inventory items are read-only."
            : readOnly
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
                disabled={
                  inventoryLoading || Boolean(inventoryLoadError)
                }
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
        recordCount={transactionRecords.length}
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
              <span className="inventory-tab-badge">
                {transactionRecords.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "pending"}
              className={`inventory-folder-tab ${activeTab === "pending" ? "is-active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              <span>Pending return confirmations</span>
              <span
                className={`inventory-tab-badge ${
                  pendingReturns.length > 0 ? "inventory-tab-badge--pending" : ""
                }`}
              >
                {pendingReturns.length}
              </span>
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
                {activeTab === "transactions" && (
                  <div className="inventory-filter-pill">
                    <select
                      value={recordFilter}
                      onChange={(event) => setRecordFilter(event.target.value)}
                      aria-label="Filter status"
                    >
                      <option value="All">All status</option>
                      <option value="Borrowed">Borrowed</option>
                      <option value="Returned">Returned</option>
                      <option value="Return Declined">Return Declined</option>
                      <option value="Used">Used</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {activeTab === "master" ? (
          <InventoryTable
            items={visibleItems}
            totalItems={inventoryItems.length}
            isLoading={inventoryLoading}
            actionsDisabled={
              inventoryLoading || Boolean(inventoryLoadError)
            }
            recordingDisabled={
              transactionsLoading ||
              Boolean(transactionsLoadError) ||
              transactionUsers.length === 0
            }
            loadError={inventoryLoadError || inventoryError}
            onOpenAction={stockActions.openAction}
            getBorrowedBalance={stockActions.getBorrowedBalance}
            onDelete={requestDeleteItem}
            onViewDetails={setSelectedInventoryItem}
            readOnly={readOnly}
            canRecord={canRecordInventory}
          />
        ) : activeTab === "transactions" ? (
          <InventoryRecords
            records={visibleRecords}
            totalRecords={transactionRecords.length}
            isLoading={transactionsLoading}
            loadError={transactionsLoadError}
            readOnly={readOnly}
            processingReturnIds={processingReturnIds}
            onConfirmReturn={confirmReturn}
            filter={recordFilter}
            setFilter={setRecordFilter}
            onViewReceipt={stockActions.openReceipt}
          />
        ) : (
          <PendingReturnsPanel
            pendingReturns={visiblePendingReturns}
            totalPending={pendingReturns.length}
            isLoading={transactionsLoading}
            loadError={transactionsLoadError}
            readOnly={readOnly}
            processingIds={processingReturnIds}
            actionError={returnActionError}
            onConfirm={confirmReturn}
            onDecline={declineReturn}
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
        lockPersonToOptions={recordInventoryForCurrentUserOnly}
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

      <ConfirmModal
        isOpen={Boolean(itemPendingDelete)}
        onClose={() => setItemPendingDelete(null)}
        onConfirm={handleConfirmDeleteItem}
        eyebrow="SUPPLY & INVENTORY · MASTER LIST"
        title={
          itemPendingDelete
            ? `Delete "${itemPendingDelete.name}"?`
            : "Delete product?"
        }
        titleId="confirm-delete-product-title"
        message={
          itemPendingDelete
            ? `Are you sure you want to remove "${itemPendingDelete.name}" (${getProductId(itemPendingDelete)}) from the active inventory masterlist? This will archive the product.`
            : ""
        }
        confirmLabel={isDeletingItem ? "Deleting..." : "Yes, delete product"}
        cancelLabel="Cancel"
        danger
        disabled={isDeletingItem}
      />
    </div>
  );
}

export default Inventory;
