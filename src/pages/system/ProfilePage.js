import { useEffect, useMemo, useState } from "react";
import { ConfirmModal, PageHeader } from "../../components/ui";
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
    readOnly: true,
    helper: "Managed by your sign-in account and used for office notifications.",
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

const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "upper", label: "One uppercase letter (A–Z)", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "One lowercase letter (a–z)", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "One number (0–9)", test: (v) => /\d/.test(v) },
  {
    id: "special",
    label: "One special character (!@#$…)",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

function evaluatePasswordStrength(password) {
  const results = PASSWORD_RULES.map((rule) => ({
    ...rule,
    met: rule.test(password),
  }));
  const passedCount = results.filter((rule) => rule.met).length;
  const isStrong = passedCount === PASSWORD_RULES.length;

  let level = "empty";
  let label = "";
  if (password.length > 0) {
    if (passedCount <= 2) {
      level = "weak";
      label = "Weak";
    } else if (passedCount === 3) {
      level = "fair";
      label = "Fair";
    } else if (passedCount === 4) {
      level = "good";
      label = "Good";
    } else {
      level = "strong";
      label = "Strong";
    }
  }

  return { results, passedCount, isStrong, level, label };
}

function ProfilePage({ role, profile, onSave, data, onNavigate }) {
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const passwordStrength = useMemo(
    () => evaluatePasswordStrength(newPassword),
    [newPassword],
  );

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

  function togglePasswordVisibility(field) {
    setShowPasswords((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    if (!currentPassword) {
      setPasswordStatus({
        type: "error",
        text: "Please enter your current password.",
      });
      return;
    }
    if (!passwordStrength.isStrong) {
      setPasswordStatus({
        type: "error",
        text: "New password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.",
      });
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordStatus({
        type: "error",
        text: "New password must be different from your current password.",
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
    if (
      typeof supabase?.auth?.updateUser !== "function" ||
      typeof supabase?.auth?.signInWithPassword !== "function"
    ) {
      setPasswordStatus({
        type: "error",
        text: "Password update is unavailable in this environment.",
      });
      return;
    }
    setIsUpdatingPassword(true);
    setPasswordStatus(null);
    try {
      let email = String(profile?.email || draft?.email || "").trim();
      if (typeof supabase?.auth?.getUser === "function") {
        const userResult = await supabase.auth.getUser();
        if (userResult?.data?.user?.email) {
          email = userResult.data.user.email;
        }
      }
      if (!email) {
        setPasswordStatus({
          type: "error",
          text: "Could not verify your account email.",
        });
        return;
      }

      const verifyResult = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyResult?.error) {
        setPasswordStatus({
          type: "error",
          text: "Current password is incorrect.",
        });
        return;
      }

      const result = await supabase.auth.updateUser({ password: newPassword });
      if (result?.error) throw result.error;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswords({ current: false, next: false, confirm: false });
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
    setIsConfirmingReset(false);
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
                {field.verified &&
                  draft[field.key] &&
                  String(draft[field.key]).trim().toLowerCase() ===
                    String(profile?.[field.key] || "").trim().toLowerCase() && (
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
                  readOnly={Boolean(field.readOnly)}
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

        <form
          className="system-form-grid"
          onSubmit={handlePasswordSubmit}
          noValidate
        >
          <label className="system-field system-field--full">
            <span className="system-field__header">
              <span className="system-field__label">Current password</span>
              <span className="system-field__tag">Required</span>
            </span>
            <span className="system-input-wrap">
              <span className="system-input-wrap__icon">
                <SystemIcon name="shield" size={16} />
              </span>
              <input
                type={showPasswords.current ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
              <button
                type="button"
                className="system-password-toggle"
                onClick={() => togglePasswordVisibility("current")}
                aria-label={
                  showPasswords.current
                    ? "Hide current password"
                    : "Show current password"
                }
              >
                <SystemIcon
                  name={showPasswords.current ? "eyeOff" : "eye"}
                  size={16}
                />
              </button>
            </span>
            <span className="system-field__helper">
              Verify your existing password before setting a new one.
            </span>
          </label>

          <label className="system-field">
            <span className="system-field__header">
              <span className="system-field__label">New password</span>
              <span className="system-field__tag">Strong password required</span>
            </span>
            <span className="system-input-wrap">
              <span className="system-input-wrap__icon">
                <SystemIcon name="lock" size={16} />
              </span>
              <input
                type={showPasswords.next ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <button
                type="button"
                className="system-password-toggle"
                onClick={() => togglePasswordVisibility("next")}
                aria-label={
                  showPasswords.next
                    ? "Hide new password"
                    : "Show new password"
                }
              >
                <SystemIcon
                  name={showPasswords.next ? "eyeOff" : "eye"}
                  size={16}
                />
              </button>
            </span>
            <span className="system-field__helper">
              Use at least 8 characters with uppercase, lowercase, a number, and a symbol.
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
                type={showPasswords.confirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <button
                type="button"
                className="system-password-toggle"
                onClick={() => togglePasswordVisibility("confirm")}
                aria-label={
                  showPasswords.confirm
                    ? "Hide confirm new password"
                    : "Show confirm new password"
                }
              >
                <SystemIcon
                  name={showPasswords.confirm ? "eyeOff" : "eye"}
                  size={16}
                />
              </button>
            </span>
            {confirmPassword ? (
              <span
                className={`system-field__helper ${
                  newPassword === confirmPassword
                    ? "system-field__helper--match"
                    : "system-field__helper--mismatch"
                }`}
              >
                {newPassword === confirmPassword
                  ? "Passwords match."
                  : "Passwords do not match."}
              </span>
            ) : (
              <span className="system-field__helper">
                Must match the new password entered on the left.
              </span>
            )}
          </label>

          <div
            className="system-field--full system-password-meter"
            aria-live="polite"
          >
            <div className="system-password-meter__head">
              <span className="system-password-meter__title">
                Password strength
              </span>
              {passwordStrength.label && (
                <span
                  className="system-password-meter__label"
                  data-level={passwordStrength.level}
                >
                  {passwordStrength.label}
                </span>
              )}
            </div>
            <div
              className="system-password-meter__track"
              role="progressbar"
              aria-label="Password strength"
              aria-valuemin={0}
              aria-valuemax={PASSWORD_RULES.length}
              aria-valuenow={passwordStrength.passedCount}
            >
              <span
                className="system-password-meter__fill"
                data-level={passwordStrength.level}
                style={{
                  width: `${(passwordStrength.passedCount / PASSWORD_RULES.length) * 100}%`,
                }}
              />
            </div>
          </div>

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
              onClick={() => setIsConfirmingReset(true)}
            >
              Reset to default
            </button>
          </div>
        </div>
      </section>

      <ConfirmModal
        isOpen={isConfirmingReset}
        onClose={() => setIsConfirmingReset(false)}
        onConfirm={handleReset}
        eyebrow="SYSTEM · PROFILE RESET"
        title="Reset profile to defaults?"
        titleId="confirm-reset-profile-title"
        message={`Are you sure you want to restore your display name, title, availability, and contact fields to the default values for the ${role?.label || "current"} role?`}
        confirmLabel="Yes, reset profile"
        cancelLabel="Cancel"
        danger
      />
    </div>
  );
}

export default ProfilePage;
