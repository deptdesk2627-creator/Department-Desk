import {
  AVAILABILITY_OPTIONS,
  PERMISSION_LABELS,
  getInitials,
} from "../../../constants/system";

function ProfileSummaryCard({ role, draft }) {
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

        <dl className="system-meta-list">
          {metaRows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
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

