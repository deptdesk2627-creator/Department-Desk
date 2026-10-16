import Inventory from "../secretary/inventory/Inventory";

// Dean reviews stock levels, borrowing history, and budgeting statistics only.
function DeanInventory({ data, search }) {
  return (
    <Inventory
      inventory={data.inventory}
      setInventory={data.setInventory}
      records={data.inventoryRecords}
      setRecords={data.setInventoryRecords}
      search={search}
      readOnly
    />
  );
}

export default DeanInventory;
