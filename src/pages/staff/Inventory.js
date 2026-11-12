import { useEffect, useMemo, useState } from "react";
import "../inventory/Inventory.css";
import "./InventoryStaff.css";
import { PageHeader } from "../../components/ui";
import {
  getProductId,
  useInventoryActions,
} from "../../hooks/useInventoryActions";
import { supabase } from "../../supabase/supabaseClient";
import { matchesQuery } from "../../utils/search";
import InventoryReceiptModal from "../inventory/components/InventoryReceiptModal";
import StaffBorrowModal from "./components/StaffBorrowModal";
import StaffHistoryTable from "./components/StaffHistoryTable";
import StaffSupplyList from "./components/StaffSupplyList";

function StaffInventory({
  inventory = [],
  setInventory = () => {
    throw new Error("StaffInventory requires a setInventory callback.");
  },
  records = [],
  setRecords = () => {
    throw new Error("StaffInventory requires a setRecords callback.");
  },
  search = "",
  profile,
  role,
}) {
  const [supplySearch, setSupplySearch] = useState("");
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState("");
  const person = String(
    profile?.name || profile?.email || role?.name || "Faculty / Staff",
  ).trim();

  useEffect(() => {
    let isMounted = true;

    async function loadInventory() {
      const { data: items, error: fetchError } = await supabase
        .from("items_masterlist")
        .select(
          "item_id, item_name, stock_onhand, unit, min_stock, category, classification, archived_at, created_at",
        )
        .is("archived_at", null)
        .order("item_name");

      if (!isMounted) return;
      if (fetchError) {
        console.error("Could not load the staff inventory masterlist.", fetchError);
        setInventoryError("Could not load supplies. Please try again later.");
      } else {
        setInventory(
          (Array.isArray(items) ? items : []).map((item) => ({
            ...item,
            id: item.item_id,
            name: item.item_name,
            quantity: item.stock_onhand,
            lowStockAt: item.min_stock,
            usageType:
              item.classification === "Usable" ||
              item.classification === "Borrowable"
                ? item.classification
                : undefined,
          })),
        );
        setInventoryError("");
      }
      setInventoryLoading(false);
    }

    loadInventory().catch((error) => {
      if (!isMounted) return;
      console.error("Could not load the staff inventory masterlist.", error);
      setInventoryError("Could not load supplies. Please try again later.");
      setInventoryLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [setInventory]);

  const inventoryItems = useMemo(
    () => (Array.isArray(inventory) ? inventory.filter(Boolean) : []),
    [inventory],
  );
  const recordItems = useMemo(
    () => (Array.isArray(records) ? records.filter(Boolean) : []),
    [records],
  );
  const myRecords = useMemo(
    () =>
      person
        ? recordItems.filter(
            (record) =>
              String(record.person || "").toLowerCase() === person.toLowerCase(),
          )
        : [],
    [recordItems, person],
  );
  const visibleItems = useMemo(
    () =>
      inventoryItems.filter(
        (item) =>
          matchesQuery(
            search,
            item.item_id,
            getProductId(item),
            item.name,
            item.unit,
            item.category,
            item.classification,
          ) &&
          matchesQuery(
            supplySearch,
            item.item_id,
            getProductId(item),
            item.name,
            item.unit,
            item.category,
            item.classification,
          ),
      ),
    [inventoryItems, search, supplySearch],
  );

  const {
    action,
    closeAction,
    closeReceipt,
    error,
    getBorrowedBalance: getMyBorrowedBalance,
    openAction,
    openReceipt,
    quantity,
    receiptRecord,
    remarks,
    returnedBy,
    setQuantity,
    setRemarks,
    setReturnedBy,
    submitAction,
  } = useInventoryActions({
    inventory: inventoryItems,
    records: recordItems,
    balanceRecords: myRecords,
    setInventory,
    setRecords,
    person,
    requirePerson: true,
    requireRemarks: true,
    returnLimitMessage: "You cannot return more than you borrowed.",
  });

  return (
    <div className="dashboard module-page staff-inventory-page">
      <PageHeader
        eyebrow="FACULTY & STAFF · SELF-SERVICE PORTAL"
        title="Office supplies"
        subtitle="Borrow, return, or record supplies used under your account."
      />

      <StaffSupplyList
        items={visibleItems}
        totalItems={inventoryItems.length}
        isLoading={inventoryLoading}
        loadError={inventoryError}
        supplySearch={supplySearch}
        onSupplySearchChange={setSupplySearch}
        canRecord={Boolean(person)}
        getMyBorrowedBalance={getMyBorrowedBalance}
        onOpenAction={openAction}
      />

      <StaffHistoryTable
        records={myRecords}
        hasName={Boolean(person)}
        onViewReceipt={openReceipt}
      />

      <StaffBorrowModal
        action={action}
        quantity={quantity}
        setQuantity={setQuantity}
        returnedBy={returnedBy}
        setReturnedBy={setReturnedBy}
        remarks={remarks}
        setRemarks={setRemarks}
        error={error}
        maxQuantity={
          action
            ? action.type === "Return"
              ? getMyBorrowedBalance(action.item)
              : Number(action.item.quantity)
            : 0
        }
        onSubmit={submitAction}
        onClose={closeAction}
      />

      <InventoryReceiptModal
        record={receiptRecord}
        inventory={inventoryItems}
        records={recordItems}
        onClose={closeReceipt}
      />
    </div>
  );
}

export default StaffInventory;
