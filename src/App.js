import { useEffect, useMemo, useState } from "react";
import "./Pages/admin/styles/Shared.css";
import Header from "./Components/Header";
import SideBar from "./Components/Sidebar";
import Dashboard from "./Pages/admin/Dashboard";
import Inventory from "./Pages/admin/Inventory";
import TaskManagement from "./Pages/admin/TaskManagement";
import Transactions from "./Pages/admin/Transactions";
import { useStoredState } from "./hooks/useStoredState";
import {
  initialInventory,
  initialRequests,
  initialTasks,
} from "./mockData";

const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

function App() {
  const [page, setPage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [requests, setRequests] = useStoredState("officeflow.requests", initialRequests);
  const [tasks, setTasks] = useStoredState("officeflow.tasks", initialTasks);
  const [inventory, setInventory] = useStoredState("officeflow.inventory", initialInventory);
  const [inventoryRecords, setInventoryRecords] = useStoredState("officeflow.inventory-records", []);

  const safeTasks = asArray(tasks);
  const safeInventory = asArray(inventory);
  const safeInventoryRecords = asArray(inventoryRecords);
  const safeSearch = typeof search === "string" ? search : "";
  const normalizedRequests = useMemo(
    () =>
      (Array.isArray(requests) ? requests : [])
        .filter(Boolean)
        .map((request) => {
          const sample = initialRequests.find((item) => item.id === request.id);
          return {
            ...sample,
            ...request,
            dateTime:
              request.dateTime ||
              sample?.dateTime ||
              request.history?.[0]?.dateTime ||
              "",
            type: request.type || sample?.type || "Document",
            office: request.office || request.location || sample?.location || "",
            history: Array.isArray(request.history)
              ? request.history
              : sample?.history || [],
          };
        }),
    [requests],
  );

  useEffect(() => {
    if (JSON.stringify(requests) !== JSON.stringify(normalizedRequests)) {
      setRequests(normalizedRequests);
    }
  }, [requests, normalizedRequests, setRequests]);

  const pages = {
    dashboard: (
      <Dashboard
        requests={normalizedRequests}
        tasks={safeTasks}
        inventory={safeInventory}
        search={safeSearch}
        onNavigate={setPage}
      />
    ),
    transactions: (
      <Transactions
        requests={normalizedRequests}
        setRequests={setRequests}
        search={safeSearch}
      />
    ),
    tasks: (
      <TaskManagement
        tasks={safeTasks}
        setTasks={setTasks}
        search={safeSearch}
      />
    ),
    inventory: (
      <Inventory
        inventory={safeInventory}
        setInventory={setInventory}
        records={safeInventoryRecords}
        setRecords={setInventoryRecords}
        search={safeSearch}
      />
    ),
  };

  return (
    <div className={`main-layout${isSidebarOpen ? "" : " main-layout--sidebar-closed"}`}>
      <SideBar
        currentPage={page}
        onNavigate={setPage}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((open) => !open)}
      />
      <div className="main-layout-container">
        <Header
          requests={normalizedRequests}
          tasks={safeTasks}
          inventory={safeInventory}
          search={safeSearch}
          onSearchChange={setSearch}
          onNavigate={setPage}
        />
        <main id="dashboard" key={page}>{pages[page]}</main>
      </div>
    </div>
  );
}

export default App;
