import StaffInventory from "./Inventory";

// Faculty & Staff: inventory portal only (borrow, return, record usage).
export function getStaffPages({ data, search }) {
  return {
    "staff-inventory": (
      <StaffInventory
        inventory={data.inventory}
        setInventory={data.setInventory}
        records={data.inventoryRecords}
        setRecords={data.setInventoryRecords}
        search={search}
      />
    ),
  };
}
