import { useEffect, useState } from "react";
import { PageHeader } from "../../components/ui";
import { AVAILABILITY_OPTIONS, getDefaultProfile } from "../../constants/system";
import ProfileSummaryCard from "./components/ProfileSummaryCard";
import "./SystemPages.css";

const PROFILE_INPUTS = [
  { key: "name", label: "Display name", placeholder: "e.g. Ma'am Aubrey", required: true },
  { key: "title", label: "Position / title", placeholder: "e.g. Department Secretary" },
  { key: "email", label: "Email address", placeholder: "name@deptdesk.edu", type: "email" },
  { key: "phone", label: "Phone / local extension", placeholder: "e.g. Local 4022" },
  { key: "office", label: "Office / room", placeholder: "e.g. Room 204, Admin Building" },
];

function ProfilePage({ role, profile, onSave }) {
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDraft(profile);
    setError("");
  }, [profile]);

  if (!draft) return null;

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSavedNotice(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) {
      setError("Please enter your display name.");
      setSavedNotice(false);
      return;
    }
    setError("");
    onSave?.({
      ...draft,
      name,
      title: draft.title.trim(),
      email: draft.email.trim(),
      office: draft.office.trim(),
      phone: draft.phone.trim(),
    });
    setSavedNotice(true);
  }

  function handleReset() {
    const defaults = getDefaultProfile(role);
    setDraft(defaults);
    onSave?.(defaults);
    setError("");
    setSavedNotice(true);
  }

  return (
    <div className="dashboard module-page system-page">
      <PageHeader
        eyebrow="SYSTEM · PROFILE"
        title="My profile"
        subtitle="Manage how you appear in DeptDesk and how colleagues can reach you."
      />

      <div className="system-page__grid">
        <ProfileSummaryCard role={role} draft={draft} />

        <section className="card panel system-page__main">
          <div className="panel-heading">
            <div>
              <h2>Edit profile details</h2>
              <p>Changes are saved in this browser for your current role.</p>
            </div>
          </div>

          {savedNotice && (
            <p className="system-notice system-notice--success" role="status">
              Profile updated.
            </p>
          )}
          {error && (
            <p className="system-notice system-notice--error" role="alert">
              {error}
            </p>
          )}

          <form className="module-form system-form" onSubmit={handleSubmit}>
            {PROFILE_INPUTS.map((field) => (
              <label key={field.key}>
                {field.label}
                <input
                  required={field.required}
                  type={field.type || "text"}
                  value={draft[field.key] || ""}
                  placeholder={field.placeholder}
                  onChange={(event) => update(field.key, event.target.value)}
                />
              </label>
            ))}

            <label>
              Availability
              <select
                value={draft.status}
                onChange={(event) => update("status", event.target.value)}
              >
                {AVAILABILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="system-form__full system-actions">
              <button
                type="button"
                className="text-button system-actions__reset"
                onClick={handleReset}
              >
                Reset to default
              </button>
              <span className="system-actions__spacer" />
              <button type="submit" className="primary-button">
                Save profile
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default ProfilePage;
