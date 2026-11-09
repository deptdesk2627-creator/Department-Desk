import { useMemo, useState } from "react";
import "../inventory/Inventory.css";
import "./InventoryStaff.css";
import { PageHeader } from "../../components/ui";
import {
  getProductId,
  useInventoryActions,
} from "../../hooks/useInventoryActions";
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
  const person = String(
    profile?.name || profile?.email || role?.name || "Faculty / Staff",
  ).trim();

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
          matchesQuery(search, getProductId(item), item.name, item.unit) &&
          matchesQuery(supplySearch, getProductId(item), item.name, item.unit),
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
