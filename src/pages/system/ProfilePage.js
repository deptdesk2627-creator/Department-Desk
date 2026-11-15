import { useEffect, useState } from "react";
import { PageHeader } from "../../components/ui";
import { AVAILABILITY_OPTIONS, getDefaultProfile } from "../../constants/system";
import { supabase } from "../../supabase/supabaseClient";
import ProfileSummaryCard from "./components/ProfileSummaryCard";
import "./ProfilePage.css";

const PROFILE_INPUTS = [
  { key: "name", label: "Display name", placeholder: "e.g. Ma'am Aubrey", required: true },
  { key: "title", label: "Position / title", placeholder: "e.g. Department Secretary" },
  { key: "email", label: "Email address", placeholder: "name@deptdesk.edu", type: "email" },
  { key: "phone", label: "Phone / local extension", placeholder: "e.g. Local 4022" },
  { key: "office", label: "Office / room", placeholder: "e.g. Room 204, Admin Building" },
];

function ProfilePage({ role, profile, onSave, data, onNavigate }) {
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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
      title: String(draft.title || "").trim(),
      email: String(draft.email || "").trim(),
      office: String(draft.office || "").trim(),
      phone: String(draft.phone || "").trim(),
      statusNote: String(draft.statusNote || "").trim(),
    });
    setSavedNotice(true);
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    if (newPassword.length < 6) {
      setPasswordStatus({
        type: "error",
        text: "New password must be at least 6 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: "error",
        text: "Passwords do not match.",
      });
      return;
    }
    if (typeof supabase?.auth?.updateUser !== "function") {
      setPasswordStatus({
        type: "error",
        text: "Password update is unavailable in this environment.",
      });
      return;
    }
    setIsUpdatingPassword(true);
    setPasswordStatus(null);
    try {
      const result = await supabase.auth.updateUser({ password: newPassword });
      if (result?.error) throw result.error;
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStatus({ type: "success", text: "Password updated." });
    } catch (err) {
      setPasswordStatus({
        type: "error",
        text: err?.message || "Could not update password.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
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
        <ProfileSummaryCard
          role={role}
          draft={draft}
          data={data}
          onNavigate={onNavigate}
        />

        <div className="system-page__main">
          <section className="card panel">
            <div className="panel-heading">
              <div>
                <h2>Edit profile details</h2>
                <p>Saved changes sync with your account profile.</p>
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

              <label className="system-form__full">
                Status note / consultation hours
                <input
                  type="text"
                  value={draft.statusNote || ""}
                  placeholder="e.g. Available 9 AM – 4 PM · Leave urgent forms in CICT Cabinet 4 - D1"
                  onChange={(event) => update("statusNote", event.target.value)}
                />
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

          <section className="card panel system-security-card">
            <div className="panel-heading">
              <div>
                <h2>Account &amp; password security</h2>
                <p>Update the password used to sign in to your DeptDesk account.</p>
              </div>
            </div>

            {passwordStatus && (
              <p
                className={`system-notice system-notice--${passwordStatus.type}`}
                role={passwordStatus.type === "error" ? "alert" : "status"}
              >
                {passwordStatus.text}
              </p>
            )}

            <form
              className="module-form system-form"
              onSubmit={handlePasswordSubmit}
            >
              <label>
                New password
                <input
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </label>
              <label>
                Confirm new password
                <input
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>
              <div className="system-form__full system-actions">
                <span className="system-actions__spacer" />
                <button
                  type="submit"
                  className="secondary-button"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? "Updating…" : "Update password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
