import { useMemo } from "react";
import "../secretary/inventory/Inventory.css";
import "./InventoryStaff.css";
import PageHeader from "../../components/ui/PageHeader";
import {
  getProductId,
  useInventoryActions,
} from "../../hooks/useInventoryActions";
import { useStoredState } from "../../hooks/useStoredState";
import { matchesQuery } from "../../utils/search";
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
}) {
  const [staffName, setStaffName] = useStoredState("officeflow.staff-name", "");
  const person = String(staffName || "").trim();

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
      inventoryItems.filter((item) =>
        matchesQuery(search, getProductId(item), item.name, item.unit),
      ),
    [inventoryItems, search],
  );

  const {
    action,
    closeAction,
    error,
    getBorrowedBalance: getMyBorrowedBalance,
    openAction,
    quantity,
    remarks,
    setQuantity,
    setRemarks,
    submitAction,
  } = useInventoryActions({
    inventory: inventoryItems,
    records: recordItems,
    balanceRecords: myRecords,
    setInventory,
    setRecords,
    person,
    requirePerson: true,
    returnLimitMessage: "You cannot return more than you borrowed.",
  });

  const outstandingCount = inventoryItems.filter(
    (item) => getMyBorrowedBalance(item) > 0,
  ).length;

  const suggestedStaffNames = useMemo(() => {
    const defaults = [
      "Prof. Juan Dela Cruz",
      "Prof. Maria Clara",
      "Engr. Paolo Reyes",
    ];
    const fromRecords = recordItems
      .map((r) => String(r.person || "").trim())
      .filter(Boolean);
    return Array.from(new Set([...defaults, ...fromRecords])).slice(0, 5);
  }, [recordItems]);

  return (
    <div className="dashboard module-page staff-inventory-page">
      <PageHeader
        eyebrow="FACULTY & STAFF · SELF-SERVICE PORTAL"
        title="Office supplies"
        subtitle="Select or enter your name below to borrow, return, or record supplies used."
      />

      <section className="card panel staff-identity" aria-label="Your name">
        <div className="staff-identity__main">
          <label>
            <span className="staff-identity__label-row">
              <span>Recording as</span>
              <span
                className={`status-pill ${person ? "status-done" : "status-waiting"}`}
              >
                {person ? "● Active borrower session" : "Identify yourself to unlock actions"}
              </span>
            </span>
            <input
              value={staffName}
              onChange={(event) => setStaffName(event.target.value)}
              placeholder="Enter your full name (e.g. Prof. Juan Dela Cruz)"
            />
          </label>
          <div className="staff-identity__quick-picks" aria-label="Quick select staff member">
            <span className="staff-identity__quick-label">Quick select:</span>
            {suggestedStaffNames.map((name) => {
              const isSelected = person.toLowerCase() === name.toLowerCase();
              return (
                <button
                  key={name}
                  type="button"
                  className={`staff-chip ${isSelected ? "staff-chip--active" : ""}`}
                  onClick={() => setStaffName(name)}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="staff-identity-stats">
          <div className="staff-stat-box">
            <strong>{myRecords.length}</strong>
            <span>logged activity</span>
          </div>
          <div className="staff-stat-box">
            <strong>{outstandingCount}</strong>
            <span>currently borrowed</span>
          </div>
        </div>
      </section>

      <StaffSupplyList
        items={visibleItems}
        totalItems={inventoryItems.length}
        canRecord={Boolean(person)}
        getMyBorrowedBalance={getMyBorrowedBalance}
        onOpenAction={openAction}
      />

      <StaffHistoryTable records={myRecords} hasName={Boolean(person)} />

      <StaffBorrowModal
        action={action}
        quantity={quantity}
        setQuantity={setQuantity}
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
    </div>
  );
}

export default StaffInventory;
