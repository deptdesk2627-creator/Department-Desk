import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../../components/ui";
import {
  AVAILABILITY_OPTIONS,
  getDefaultProfile,
  getInitials,
} from "../../constants/system";
import { supabase } from "../../supabase/supabaseClient";
import ProfileSummaryCard from "./components/ProfileSummaryCard";
import { SystemIcon } from "./components/SystemIcons";
import "./SystemShared.css";
import "./ProfilePage.css";

const PROFILE_INPUTS = [
  {
    key: "name",
    label: "Display name",
    placeholder: "e.g. Ma'am Aubrey",
    required: true,
    icon: "user",
    tag: "Required",
    helper: "Shown in the header menu, requests, and activity logs.",
  },
  {
    key: "title",
    label: "Position / title",
    placeholder: "e.g. Department Secretary",
    icon: "briefcase",
    helper: "Your official department or academic role.",
  },
  {
    key: "email",
    label: "Email address",
    placeholder: "name@deptdesk.edu",
    type: "email",
    icon: "mail",
    verified: true,
    helper: "Used for account sign-in and office notifications.",
  },
  {
    key: "phone",
    label: "Phone / local extension",
    placeholder: "e.g. Local 4022",
    icon: "phone",
    helper: "Internal local or direct contact number.",
  },
  {
    key: "office",
    label: "Office / room",
    placeholder: "e.g. Room 204, Admin Building",
    icon: "mapPin",
    helper: "Where colleagues can reach you or drop off documents.",
  },
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

  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !profile) return false;
    const keys = [
      "name",
      "title",
      "email",
      "phone",
      "office",
      "status",
      "statusNote",
    ];
    return keys.some(
      (key) => String(draft[key] || "") !== String(profile[key] || ""),
    );
  }, [draft, profile]);

  if (!draft) return null;

  const availabilityLabel =
    AVAILABILITY_OPTIONS.find((opt) => opt.value === draft.status)?.label ||
    "Available at desk";

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSavedNotice(false);
  }

  function handleDiscard() {
    setDraft(profile);
    setError("");
    setSavedNotice(false);
  }

  function saveProfileDraft() {
    const name = String(draft.name || "").trim();
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

  function handleSubmit(event) {
    event.preventDefault();
    saveProfileDraft();
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
        actions={
          hasUnsavedChanges ? (
            <div className="system-header-actions" role="region" aria-label="Unsaved profile changes">
              <span className="system-unsaved-indicator">Unsaved changes</span>
              <button
                type="button"
                className="secondary-button system-header-btn"
                onClick={handleDiscard}
              >
                Discard
              </button>
              <button
                type="button"
                className="primary-button system-header-btn"
                onClick={saveProfileDraft}
              >
                Save Changes
              </button>
            </div>
          ) : null
        }
      />

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

      <section className="card system-card">
        <div className="system-card-head">
          <div className="system-card-head__title">
            <span className="system-card-icon">
              <SystemIcon name="user" />
            </span>
            <div>
              <h2>Profile &amp; identity</h2>
              <p>Saved changes sync with your account profile.</p>
            </div>
          </div>
          <span className="system-status-badge system-status-badge--dot">
            {availabilityLabel}
          </span>
        </div>

        <div className="system-inset-banner">
          <div className="system-inset-banner__main">
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

          <div className="system-inset-banner__meta">
            <strong>Account status</strong>
            <span>{draft.office || "No room assigned"}</span>
            <span>{draft.email || "No email set"}</span>
          </div>
        </div>

        <form className="system-form-grid" onSubmit={handleSubmit}>
          {PROFILE_INPUTS.map((field) => (
            <label key={field.key} className="system-field">
              <span className="system-field__header">
                <span className="system-field__label">{field.label}</span>
                {field.tag && (
                  <span className="system-field__tag">{field.tag}</span>
                )}
                {field.verified && draft[field.key] && (
                  <span className="system-field__tag system-field__tag--verified">
                    <SystemIcon name="check" size={13} /> Verified
                  </span>
                )}
              </span>
              <span className="system-input-wrap">
                <span className="system-input-wrap__icon">
                  <SystemIcon name={field.icon} size={16} />
                </span>
                <input
                  required={field.required}
                  type={field.type || "text"}
                  value={draft[field.key] || ""}
                  placeholder={field.placeholder}
                  onChange={(event) => update(field.key, event.target.value)}
                />
              </span>
              {field.helper && (
                <span className="system-field__helper">{field.helper}</span>
              )}
            </label>
          ))}

          <label className="system-field">
            <span className="system-field__header">
              <span className="system-field__label">Availability</span>
              <span className="system-field__tag">Live status</span>
            </span>
            <span className="system-input-wrap">
              <span className="system-input-wrap__icon">
                <SystemIcon name="clock" size={16} />
              </span>
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
            </span>
            <span className="system-field__helper">
              Controls the status indicator on your avatar.
            </span>
          </label>

          <label className="system-field system-field--full">
            <span className="system-field__header">
              <span className="system-field__label">
                Status note / consultation hours
              </span>
              <span className="system-field__tag">Optional</span>
            </span>
            <span className="system-input-wrap">
              <span className="system-input-wrap__icon">
                <SystemIcon name="activity" size={16} />
              </span>
              <input
                type="text"
                value={draft.statusNote || ""}
                placeholder="e.g. Available 9 AM – 4 PM · Leave urgent forms in CICT Cabinet 4 - D1"
                onChange={(event) => update("statusNote", event.target.value)}
              />
            </span>
            <span className="system-field__helper">
              Displayed as a quick note for colleagues checking your availability.
            </span>
          </label>

          <div className="system-field--full system-actions">
            <span className="system-actions__spacer" />
            {hasUnsavedChanges && (
              <button
                type="button"
                className="secondary-button"
                onClick={handleDiscard}
              >
                Discard
              </button>
            )}
            <button type="submit" className="primary-button">
              Save profile
            </button>
          </div>
        </form>
      </section>

      <section className="card system-card system-security-card">
        <div className="system-card-head">
          <div className="system-card-head__title">
            <span className="system-card-icon">
              <SystemIcon name="lock" />
            </span>
            <div>
              <h2>Account &amp; password security</h2>
              <p>
                Update the password used to sign in to your DeptDesk account.
              </p>
            </div>
          </div>
          <span className="system-status-badge system-status-badge--neutral">
            Password Auth
          </span>
        </div>

        {passwordStatus && (
          <p
            className={`system-notice system-notice--${passwordStatus.type}`}
            style={{ marginBottom: "16px" }}
            role={passwordStatus.type === "error" ? "alert" : "status"}
          >
            {passwordStatus.text}
          </p>
        )}

        <form className="system-form-grid" onSubmit={handlePasswordSubmit}>
          <label className="system-field">
            <span className="system-field__header">
              <span className="system-field__label">New password</span>
              <span className="system-field__tag">Min 6 chars</span>
            </span>
            <span className="system-input-wrap">
              <span className="system-input-wrap__icon">
                <SystemIcon name="lock" size={16} />
              </span>
              <input
                type="password"
                minLength={6}
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </span>
            <span className="system-field__helper">
              Use a strong password unique to your department account.
            </span>
          </label>

          <label className="system-field">
            <span className="system-field__header">
              <span className="system-field__label">Confirm new password</span>
            </span>
            <span className="system-input-wrap">
              <span className="system-input-wrap__icon">
                <SystemIcon name="lock" size={16} />
              </span>
              <input
                type="password"
                minLength={6}
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </span>
            <span className="system-field__helper">
              Must match the new password entered on the left.
            </span>
          </label>

          <div className="system-field--full system-actions">
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

      <ProfileSummaryCard
        role={role}
        draft={draft}
        data={data}
        onNavigate={onNavigate}
      />

      <section className="card system-danger-card">
        <div className="system-danger-card__head">
          <span className="system-danger-card__title">
            <SystemIcon name="alertTriangle" size={17} />
            Danger Zone
          </span>
          <span className="system-danger-card__tag">Profile Reset</span>
        </div>
        <div className="system-danger-card__body">
          <div className="system-danger-row">
            <div className="system-danger-row__text">
              <strong>Reset profile to defaults</strong>
              <span>
                Restore your display name, title, availability, and contact
                fields to the default values for the {role?.label} role.
              </span>
            </div>
            <button
              type="button"
              className="system-danger-outline-btn"
              onClick={handleReset}
            >
              Reset to default
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProfilePage;
