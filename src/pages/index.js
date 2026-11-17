import Dashboard from "./dashboard/Dashboard";
import Inventory from "./inventory/Inventory";
import StaffInventory from "./staff/Inventory";
import HelpPage from "./system/HelpPage";
import ProfilePage from "./system/ProfilePage";
import SettingsPage from "./system/SettingsPage";
import TaskManagement from "./task-management/TaskManagement";
import Transactions from "./transactions/Transactions";

export function getRolePages({
  role,
  data,
  search,
  navigate,
  profile,
  onSaveProfile,
  settings,
  onSettingsChange,
  theme,
  onThemeChange,
  isSidebarOpen,
  onSidebarOpenChange,
}) {
  const systemPages = {
    profile: (
      <ProfilePage
        role={role}
        profile={profile}
        onSave={onSaveProfile}
        data={data}
        onNavigate={navigate}
      />
    ),
    settings: (
      <SettingsPage
        role={role}
        settings={settings}
        onSettingsChange={onSettingsChange}
        theme={theme}
        onThemeChange={onThemeChange}
        data={data}
        onNavigate={navigate}
        isSidebarOpen={isSidebarOpen}
        onSidebarOpenChange={onSidebarOpenChange}
      />
    ),
    help: (
      <HelpPage
        role={role}
        settings={settings}
        search={search}
        onNavigate={navigate}
      />
    ),
  };

  const taskPage = (
    <TaskManagement
      tasks={data.tasks}
      setTasks={data.setTasks}
      search={search}
      defaultView={settings?.defaultTaskView}
    />
  );

  if (role?.id === "staff") {
    return {
      tasks: taskPage,
      "staff-inventory": (
        <StaffInventory
          inventory={data.inventory}
          setInventory={data.setInventory}
          records={data.inventoryRecords}
          setRecords={data.setInventoryRecords}
          search={search}
          profile={profile}
          role={role}
        />
      ),
      ...systemPages,
    };
  }

  const canEditDocuments = role ? Boolean(role.can?.editDocuments) : true;
  const canManageInventory = role ? Boolean(role.can?.manageInventory) : true;

  return {
    dashboard: (
      <Dashboard
        role={role}
        userName={profile?.name || role?.name}
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
        defaultView={settings?.defaultRequestView}
      />
    ),
    tasks: taskPage,
    inventory: (
      <Inventory
        inventory={data.inventory}
        setInventory={data.setInventory}
        records={data.inventoryRecords}
        setRecords={data.setInventoryRecords}
        search={search}
        readOnly={!canManageInventory}
        userName={profile?.name || role?.name}
      />
    ),
    ...systemPages,
  };
}
