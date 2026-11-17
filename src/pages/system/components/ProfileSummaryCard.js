import { getRequestStatus } from "../../../constants/requestStatus";
import { PERMISSION_LABELS } from "../../../constants/system";
import { isLowStock } from "../../../utils/inventory";
import { SystemIcon } from "./SystemIcons";

function buildWorkloadItems(role, draft, data) {
  if (role?.id === "staff") {
    const availableCount = (
      Array.isArray(data?.inventory) ? data.inventory : []
    ).filter((item) => Number(item?.quantity) > 0).length;
    const staffName = String(draft?.name || "")
      .trim()
      .toLowerCase();
    const myLogsCount = (
      Array.isArray(data?.inventoryRecords) ? data.inventoryRecords : []
    ).filter(
      (rec) =>
        rec &&
        (!staffName ||
          String(rec.person || "")
            .trim()
            .toLowerCase() === staffName),
    ).length;

    return [
      {
        label: "Available supplies",
        value: availableCount,
        page: "staff-inventory",
      },
      {
        label: "My supply logs",
        value: myLogsCount,
        page: "staff-inventory",
      },
    ];
  }

  const activeRequests = (
    Array.isArray(data?.requests) ? data.requests : []
  ).filter(
    (req) =>
      req &&
      !["Approved", "Archived", "Sent Out"].includes(
        getRequestStatus(req.status),
      ),
  ).length;
  const openTasks = (Array.isArray(data?.tasks) ? data.tasks : []).filter(
    (task) => task && !task.done && task.status !== "Done",
  ).length;
  const lowStockCount = (
    Array.isArray(data?.inventory) ? data.inventory : []
  ).filter(isLowStock).length;

  return [
    { label: "Active requests", value: activeRequests, page: "transactions" },
    { label: "Open tasks", value: openTasks, page: "tasks" },
    { label: "Low-stock items", value: lowStockCount, page: "inventory" },
  ];
}

function ProfileSummaryCard({ role, draft, data, onNavigate }) {
  const permissions = Object.entries(role?.can || {});
  const workloadItems = buildWorkloadItems(role, draft, data);

  return (
    <>
      <section className="card system-card">
        <div className="system-card-head">
          <div className="system-card-head__title">
            <span className="system-card-icon">
              <SystemIcon name="activity" />
            </span>
            <div>
              <h2>Workspace snapshot</h2>
              <p>Live activity summary for your current role.</p>
            </div>
          </div>
          <span className="system-status-badge system-status-badge--neutral">
            {role?.label}
          </span>
        </div>

        <div className="system-workload-grid">
          {workloadItems.map((item) =>
            onNavigate ? (
              <button
                key={item.label}
                type="button"
                className="system-workload-tile"
                onClick={() => onNavigate(item.page)}
              >
                <div className="system-workload-tile__top">
                  <strong>{item.value}</strong>
                  <span className="system-workload-tile__arrow" aria-hidden="true">
                    →
                  </span>
                </div>
                <span>{item.label}</span>
              </button>
            ) : (
              <div key={item.label} className="system-workload-tile">
                <div className="system-workload-tile__top">
                  <strong>{item.value}</strong>
                </div>
                <span>{item.label}</span>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="card system-card system-permissions">
        <div className="system-card-head">
          <div className="system-card-head__title">
            <span className="system-card-icon">
              <SystemIcon name="shield" />
            </span>
            <div>
              <h2>Role &amp; permissions</h2>
              <p>Capabilities granted to the {role?.label} role.</p>
            </div>
          </div>
          <span className="system-status-badge system-status-badge--accent">
            {permissions.filter(([, allowed]) => allowed).length} of{" "}
            {permissions.length} enabled
          </span>
        </div>

        <ul className="system-permissions-grid">
          {permissions.map(([key, allowed]) => (
            <li key={key} data-allowed={allowed ? "true" : "false"}>
              <span aria-hidden="true">{allowed ? "✓" : "—"}</span>
              <span>{PERMISSION_LABELS[key] || key}</span>
              <span className="sr-only">
                {allowed ? " (allowed)" : " (not allowed)"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default ProfileSummaryCard;
