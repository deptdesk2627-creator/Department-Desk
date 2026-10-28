import { useState } from "react";
import "./Login.css";
import { ROLE_LIST } from "../../constants/roles";
import LoginBrandPanel from "./components/LoginBrandPanel";
import LoginDemoModal from "./components/LoginDemoModal";

const DEMO_ACCOUNTS = {
  "secretary@deptdesk.edu": "secretary",
  "dean@deptdesk.edu": "dean",
  "staff@deptdesk.edu": "staff",
  secretary: "secretary",
  dean: "dean",
  staff: "staff",
};

function Login({
  onLogin,
  defaultRoleId = "secretary",
  theme = "light",
  onThemeChange,
}) {
  const [selectedRole, setSelectedRole] = useState(defaultRoleId);
  const [email, setEmail] = useState(`${defaultRoleId}@deptdesk.edu`);
  const [password, setPassword] = useState("deptdesk123");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [modalMode, setModalMode] = useState("demo"); // 'demo' | 'forgot'
  const [isValidating, setIsValidating] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  function handleRoleSelect(roleId) {
    setSelectedRole(roleId);
    setEmail(`${roleId}@deptdesk.edu`);
    setError("");
  }

  function triggerLogin(roleId) {
    if (isExiting) return;
    setIsExiting(true);

    const isTest = process.env.NODE_ENV === "test";
    if (isTest) {
      onLogin?.(roleId);
      return;
    }

    setTimeout(() => {
      onLogin?.(roleId);
    }, 220);
  }

  function handleSubmit(event) {
    if (event) event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password.trim()) {
      setError("Please enter both your email address and password.");
      return;
    }

    const matchedRole = DEMO_ACCOUNTS[trimmedEmail] || selectedRole;
    setError("");

    const isTest = process.env.NODE_ENV === "test";
    if (isTest) {
      triggerLogin(matchedRole);
      return;
    }

    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      triggerLogin(matchedRole);
    }, 180);
  }

  function handleQuickSignIn(roleId) {
    setSelectedRole(roleId);
    setEmail(`${roleId}@deptdesk.edu`);
    setPassword("deptdesk123");
    setError("");
    setShowDemoModal(false);
    triggerLogin(roleId);
  }

  return (
    <div
      className={`login-split-page${isExiting ? " login-split-page--exiting" : ""}`}
      data-theme={theme}
      data-testid="login-split-page"
    >
      {/* Left Brand Panel */}
      <LoginBrandPanel />

      {/* Right Form Panel */}
      <main className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2 id="login-heading" className="login-form-title">
              Sign in to DeptDesk
            </h2>
            <p className="login-form-subtitle">
              Enter your account credentials or choose a workspace role below.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {/* 1. Workspace Role Card */}
            <div className="login-card-field">
              <div className="login-card-field__icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="M14 8h3M14 12h3" />
                </svg>
              </div>
              <div className="login-card-field__content">
                <label
                  htmlFor="login-workspace-role"
                  className="login-card-field__label"
                >
                  Workspace role
                </label>
                <div className="login-select-wrapper">
                  <select
                    id="login-workspace-role"
                    className="login-card-field__select"
                    value={selectedRole}
                    onChange={(e) => handleRoleSelect(e.target.value)}
                    disabled={isExiting || isValidating}
                  >
                    {ROLE_LIST.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label} ({role.name})
                      </option>
                    ))}
                  </select>
                  <svg
                    className="login-select-chevron"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 2. Email Address Card */}
            <div className="login-card-field">
              <div className="login-card-field__icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div className="login-card-field__content">
                <label
                  htmlFor="login-email"
                  className="login-card-field__label"
                >
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="login-card-field__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@deptdesk.edu"
                  autoComplete="username"
                  required
                  disabled={isExiting || isValidating}
                />
              </div>
            </div>

            {/* 3. Password Card */}
            <div className="login-card-field">
              <div className="login-card-field__icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="login-card-field__content">
                <label
                  htmlFor="login-password"
                  className="login-card-field__label"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="login-card-field__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  autoComplete="current-password"
                  required
                  disabled={isExiting || isValidating}
                />
              </div>
            </div>

            {/* Options: Remember Me & Forgot Password */}
            <div className="login-options-row">
              <label className="login-checkbox-label">
                <input
                  type="checkbox"
                  className="login-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isExiting || isValidating}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="login-forgot-link"
                onClick={() => {
                  setModalMode("forgot");
                  setShowDemoModal(true);
                }}
                disabled={isExiting || isValidating}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <p className="login-error-alert" role="alert">
                {error}
              </p>
            )}

            {/* Button 1: White Sign In To Workspace with Validating Feedback */}
            <button
              type="submit"
              className="login-btn-workspace"
              aria-label="Sign in to workspace"
              disabled={isExiting || isValidating}
            >
              {isValidating ? (
                <>
                  <span className="login-spinner" aria-hidden="true" />
                  Authenticating...
                </>
              ) : (
                "Sign in to workspace"
              )}
            </button>
          </form>

          {/* Divider: Quick Demo Sign-In */}
          <div className="login-demo-divider">
            <span className="login-demo-divider__line" />
            <span className="login-demo-divider__text">QUICK DEMO SIGN-IN</span>
            <span className="login-demo-divider__line" />
          </div>

          <p className="login-not-member">Not a member yet?</p>

          {/* Button 2: Orange Quick Demo Sign-In */}
          <button
            type="button"
            className="login-btn-demo"
            onClick={() => {
              setModalMode("demo");
              setShowDemoModal(true);
            }}
            disabled={isExiting || isValidating}
          >
            Quick demo sign-in
          </button>
        </div>
      </main>

      {/* Interactive Modal for Quick Demo Accounts or Password Help */}
      <LoginDemoModal
        isOpen={showDemoModal}
        modalMode={modalMode}
        onClose={() => setShowDemoModal(false)}
        onSelectRole={handleQuickSignIn}
      />
    </div>
  );
}

export default Login;
