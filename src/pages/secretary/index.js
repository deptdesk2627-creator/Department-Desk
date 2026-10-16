import Dashboard from "./dashboard/Dashboard";
import Inventory from "./inventory/Inventory";
import TaskManagement from "./task-management/TaskManagement";
import Transactions from "./transactions/Transactions";

// Secretary (main administrator): full access to every workspace page.
export function getSecretaryPages({ role, data, search, navigate }) {
  return {
    dashboard: (
      <Dashboard
        role={role}
        userName={role.name}
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
      />
    ),
    tasks: (
      <TaskManagement tasks={data.tasks} setTasks={data.setTasks} search={search} />
    ),
    inventory: (
      <Inventory
        inventory={data.inventory}
        setInventory={data.setInventory}
        records={data.inventoryRecords}
        setRecords={data.setInventoryRecords}
        search={search}
      />
    ),
  };
}
