import { getRequestStatus } from "../../../constants/requestStatus";
import {
  AVAILABILITY_OPTIONS,
  PERMISSION_LABELS,
  getInitials,
} from "../../../constants/system";
import { isLowStock } from "../../../utils/inventory";

function buildWorkloadItems(role, draft, data) {
  if (role?.id === "staff") {
    const availableCount = (Array.isArray(data?.inventory) ? data.inventory : []).filter(
      (item) => Number(item?.quantity) > 0,
    ).length;
    const staffName = String(draft?.name || "").trim().toLowerCase();
    const myLogsCount = (
      Array.isArray(data?.inventoryRecords) ? data.inventoryRecords : []
    ).filter(
      (rec) =>
        rec &&
        (!staffName || String(rec.person || "").trim().toLowerCase() === staffName),
    ).length;

    return [
      { label: "Available supplies", value: availableCount, page: "staff-inventory" },
      { label: "My supply logs", value: myLogsCount, page: "staff-inventory" },
    ];
  }

  const activeRequests = (Array.isArray(data?.requests) ? data.requests : []).filter(
    (req) =>
      req &&
      !["Approved", "Archived", "Sent Out"].includes(getRequestStatus(req.status)),
  ).length;
  const openTasks = (Array.isArray(data?.tasks) ? data.tasks : []).filter(
    (task) => task && !task.done && task.status !== "Done",
  ).length;
  const lowStockCount = (Array.isArray(data?.inventory) ? data.inventory : []).filter(
    isLowStock,
  ).length;

  return [
    { label: "Active requests", value: activeRequests, page: "transactions" },
    { label: "Open tasks", value: openTasks, page: "tasks" },
    { label: "Low-stock items", value: lowStockCount, page: "inventory" },
  ];
}

function ProfileSummaryCard({ role, draft, data, onNavigate }) {
  const permissions = Object.entries(role?.can || {});
  const availabilityLabel =
    AVAILABILITY_OPTIONS.find((opt) => opt.value === draft.status)?.label ||
    "Available at desk";

  const metaRows = [
    ["Status", availabilityLabel],
    ["Email", draft.email],
    ["Phone / local", draft.phone],
    ["Office / room", draft.office],
  ].filter(([, value]) => value);

  const workloadItems = buildWorkloadItems(role, draft, data);

  return (
    <div className="system-page__sidebar">
      <section className="card panel">
        <div className="system-profile-card">
          <span className="system-profile-card__avatar" aria-hidden="true">
            {getInitials(draft.name, role?.initials)}
            <span className="system-status-dot" data-status={draft.status} />
          </span>
          <div className="system-profile-card__info">
            <strong>{draft.name || "Your name"}</strong>
            <span>{draft.title || role?.label}</span>
            <span className="system-role-chip">
              {role?.label} · {role?.description}
            </span>
          </div>
        </div>

        {draft.statusNote && (
          <p className="system-profile-note">{draft.statusNote}</p>
        )}

        <dl className="system-meta-list">
          {metaRows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card panel system-workload-card">
        <div className="panel-heading">
          <div>
            <h2>Workspace snapshot</h2>
            <p>Live summary for your current role.</p>
          </div>
        </div>
        <div className="system-workload-list">
          {workloadItems.map((item) =>
            onNavigate ? (
              <button
                key={item.label}
                type="button"
                className="system-workload-item"
                onClick={() => onNavigate(item.page)}
              >
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </button>
            ) : (
              <div key={item.label} className="system-workload-item">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="card panel system-permissions">
        <div className="panel-heading">
          <div>
            <h2>Role permissions</h2>
            <p>Capabilities granted to the {role?.label} role.</p>
          </div>
        </div>
        <ul>
          {permissions.map(([key, allowed]) => (
            <li key={key} data-allowed={allowed ? "true" : "false"}>
              <span aria-hidden="true">{allowed ? "✓" : "—"}</span>
              {PERMISSION_LABELS[key] || key}
              <span className="sr-only">
                {allowed ? " (allowed)" : " (not allowed)"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ProfileSummaryCard;
