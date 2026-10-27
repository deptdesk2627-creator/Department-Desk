import { useEffect, useState } from "react";

const OFFICE_FIELDS = [
  {
    key: "department",
    label: "Department / office name",
    placeholder: "e.g. College of Computer Studies",
  },
  {
    key: "officeLocation",
    label: "Office location",
    placeholder: "e.g. Room 101, Main Building",
  },
  {
    key: "officeHours",
    label: "Office hours",
    placeholder: "e.g. Mon–Fri, 8:00 AM – 5:00 PM",
  },
  {
    key: "contactEmail",
    label: "Office contact email",
    placeholder: "office@deptdesk.edu",
    type: "email",
  },
  {
    key: "contactPhone",
    label: "Office phone / local",
    placeholder: "e.g. (02) 8123-4567 loc. 101",
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
    onNotice({ type: "success", text: "Office details saved." });
  }

  return (
    <form
      className="module-form system-form"
      role="tabpanel"
      id="settings-panel-office"
      aria-labelledby="settings-tab-office"
      onSubmit={handleSubmit}
    >
      <p className="system-form__full system-hint">
        Shown to everyone under Help &amp; FAQ → Contact the office.
        {!canManageData && " Only the Secretary can change these details."}
      </p>
      {OFFICE_FIELDS.map((field) => (
        <label key={field.key}>
          {field.label}
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
        </label>
      ))}
      {canManageData && (
        <div className="system-form__full system-actions">
          <span className="system-actions__spacer" />
          <button type="submit" className="primary-button">
            Save office details
          </button>
        </div>
      )}
    </form>
  );
}

export default SettingsOfficeTab;

