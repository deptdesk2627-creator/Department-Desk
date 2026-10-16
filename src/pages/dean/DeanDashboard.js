import Dashboard from "../secretary/dashboard/Dashboard";

// Dean overview: same dashboard widgets, but quick actions are filtered
// by the Dean's permissions (monitor documents/inventory, manage tasks).
function DeanDashboard({ role, data, search, navigate }) {
  return (
    <Dashboard
      role={role}
      userName={role.name}
      requests={data.requests}
      tasks={data.tasks}
      inventory={data.inventory}
      search={search}
      onNavigate={navigate}
    />
  );
}

export default DeanDashboard;
