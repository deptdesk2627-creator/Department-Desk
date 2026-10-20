import Dashboard from "./dashboard/Dashboard";
import Inventory from "./inventory/Inventory";
import StaffInventory from "./staff/Inventory";
import TaskManagement from "./task-management/TaskManagement";
import Transactions from "./transactions/Transactions";

export function getRolePages({ role, data, search, navigate }) {
  if (role?.id === "staff") {
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

  const canEditDocuments = role ? Boolean(role.can?.editDocuments) : true;
  const canManageInventory = role ? Boolean(role.can?.manageInventory) : true;

  return {
    dashboard: (
      <Dashboard
        role={role}
        userName={role?.name}
        requests={data.requests}
        tasks={data.tasks}
        inventory={data.inventory}
        search={search}
        onNavigate={navigate}
      />
    ),
    transactions: (
      <Transactions
        requests={data.requests}
        setRequests={data.setRequests}
        search={search}
        readOnly={!canEditDocuments}
      />
    ),
    tasks: (
      <TaskManagement
        tasks={data.tasks}
        setTasks={data.setTasks}
        search={search}
      />
    ),
    inventory: (
      <Inventory
        inventory={data.inventory}
        setInventory={data.setInventory}
        records={data.inventoryRecords}
        setRecords={data.setInventoryRecords}
        search={search}
        readOnly={!canManageInventory}
      />
    ),
  };
}
