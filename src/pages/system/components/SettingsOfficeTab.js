import { useEffect, useState } from "react";
import { SystemIcon } from "./SystemIcons";

const OFFICE_FIELDS = [
  {
    key: "department",
    label: "Department / office name",
    placeholder: "e.g. College of Computer Studies",
    icon: "building",
    full: true,
    helper: "Displayed in Help & FAQ and official request headers.",
  },
  {
    key: "officeLocation",
    label: "Office location",
    placeholder: "e.g. Room 101, Main Building",
    icon: "mapPin",
    helper: "Physical room or building for document drop-offs.",
  },
  {
    key: "officeHours",
    label: "Office hours",
    placeholder: "e.g. Mon–Fri, 8:00 AM – 5:00 PM",
    icon: "clock",
    helper: "Standard operating hours for staff and visitors.",
  },
  {
    key: "contactEmail",
    label: "Office contact email",
    placeholder: "office@deptdesk.edu",
    type: "email",
    icon: "mail",
    helper: "Used for the Email the office button in Help & FAQ.",
  },
  {
    key: "contactPhone",
    label: "Office phone / local",
    placeholder: "e.g. (02) 8123-4567 loc. 101",
    icon: "phone",
    helper: "Direct department line or internal local extension.",
  },
];

function SettingsOfficeTab({ settings, canManageData, onSave, onNotice }) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = Object.fromEntries(
      OFFICE_FIELDS.map(({ key }) => [key, String(draft?.[key] || "").trim()]),
    );
    onSave(trimmed);
    onNotice?.({ type: "success", text: "Office details saved." });
  }

  return (
    <section className="card system-card">
      <div className="system-card-head">
        <div className="system-card-head__title">
          <span className="system-card-icon">
            <SystemIcon name="building" />
          </span>
          <div>
            <h2>Office details</h2>
            <p>
              Shown under Help &amp; FAQ → Contact the office.
              {!canManageData && " Only the Secretary can change these details."}
            </p>
          </div>
        </div>
        <span
          className={`system-status-badge ${
            canManageData
              ? "system-status-badge--dot"
              : "system-status-badge--neutral"
          }`}
        >
          {canManageData ? "Editable" : "Read-only"}
        </span>
      </div>

      <div className="system-inset-banner">
        <div className="system-inset-banner__main">
          <span className="system-card-icon">
            <SystemIcon name="building" size={18} />
          </span>
          <div className="system-office-summary">
            <strong>{draft?.department || "Department Office"}</strong>
            <span>
              {draft?.officeLocation || "No location set"} ·{" "}
              {draft?.officeHours || "Hours not set"}
            </span>
          </div>
        </div>
        <div className="system-inset-banner__meta">
          <strong>Public directory</strong>
          <span>Visible in Help &amp; FAQ</span>
        </div>
      </div>

      <form className="system-form-grid" onSubmit={handleSubmit}>
        {OFFICE_FIELDS.map((field) => (
          <label
            key={field.key}
            className={`system-field${field.full ? " system-field--full" : ""}`}
          >
            <span className="system-field__header">
              <span className="system-field__label">{field.label}</span>
              {!canManageData && (
                <span className="system-field__tag">Read-only</span>
              )}
            </span>
            <span className="system-input-wrap">
              <span className="system-input-wrap__icon">
                <SystemIcon name={field.icon} size={16} />
              </span>
              <input
                type={field.type || "text"}
                value={draft?.[field.key] || ""}
                placeholder={field.placeholder}
                readOnly={!canManageData}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
              />
            </span>
            {field.helper && (
              <span className="system-field__helper">{field.helper}</span>
            )}
          </label>
        ))}

        {canManageData && (
          <div className="system-field--full system-actions">
            <span className="system-actions__spacer" />
            <button type="submit" className="primary-button">
              Save office details
            </button>
          </div>
        )}
      </form>
    </section>
  );
}

export default SettingsOfficeTab;
