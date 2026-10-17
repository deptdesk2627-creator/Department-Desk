import Dashboard from "../secretary/dashboard/Dashboard";

// Dean overview: renders the dashboard with executive read-only context,
// role-tailored quick actions, and clean aligned metrics.
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
