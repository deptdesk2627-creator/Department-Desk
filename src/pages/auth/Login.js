import { useState } from "react";
import "./Login.css";
import { ROLE_LIST } from "../../constants/roles";
import { registerUser } from "../../firebase/authService";
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
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpSubmitted, setSignUpSubmitted] = useState(false);
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

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (isSignUp) {
      if (!fullName.trim() || !trimmedEmail || !password || !confirmPassword) {
        setError("Please complete all fields.");
        return;
      }
      if (password.length < 8) {
        setError("Your password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Your passwords do not match.");
        return;
      }

      setError("");
      setSignUpSubmitted(false);
      setIsValidating(true);
      try {
        await registerUser(
          trimmedEmail,
          password,
          fullName.trim(),
          selectedRole,
        );
        setSignUpSubmitted(true);
      } catch (registrationError) {
        setError(
          registrationError?.message ||
            "Unable to create your account. Please try again.",
        );
      } finally {
        setIsValidating(false);
      }
      return;
    }

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
              {isSignUp ? "Create your DeptDesk account" : "Sign in to DeptDesk"}
            </h2>
            <p className="login-form-subtitle">
              {isSignUp
                ? "Join your department workspace with a new account."
                : "Enter your account credentials or choose a workspace role below."}
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {!isSignUp && (
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
            )}

            {isSignUp && (
              <>
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
                      <circle cx="12" cy="8" r="4" />
                      <path d="M5 21a7 7 0 0 1 14 0" />
                    </svg>
                  </div>
                  <div className="login-card-field__content">
                    <label
                      htmlFor="signup-name"
                      className="login-card-field__label"
                    >
                      Full name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      className="login-card-field__input"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setSignUpSubmitted(false);
                      }}
                      placeholder="Your full name"
                      autoComplete="name"
                      required
                      disabled={isExiting || isValidating}
                    />
                  </div>
                </div>

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
                      htmlFor="signup-role"
                      className="login-card-field__label"
                    >
                      Account role
                    </label>
                    <div className="login-select-wrapper">
                      <select
                        id="signup-role"
                        className="login-card-field__select"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        disabled={isExiting || isValidating}
                      >
                        {ROLE_LIST.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.label}
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
              </>
            )}

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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSignUpSubmitted(false);
                  }}
                  placeholder="name@deptdesk.edu"
                  autoComplete={isSignUp ? "email" : "username"}
                  required
                  disabled={isExiting || isValidating}
                />
              </div>
            </div>

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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSignUpSubmitted(false);
                  }}
                  placeholder="••••••••••••••"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  disabled={isExiting || isValidating}
                />
              </div>
            </div>

            {isSignUp ? (
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
                    htmlFor="signup-confirm-password"
                    className="login-card-field__label"
                  >
                    Confirm password
                  </label>
                  <input
                    id="signup-confirm-password"
                    type="password"
                    className="login-card-field__input"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setSignUpSubmitted(false);
                    }}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    required
                    disabled={isExiting || isValidating}
                  />
                </div>
              </div>
            ) : (
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
            )}

            {error && (
              <p className="login-error-alert" role="alert">
                {error}
              </p>
            )}
            {signUpSubmitted && (
              <p className="login-signup-notice" role="status">
                Account created successfully. You can now sign in.
              </p>
            )}

            <button
              type="submit"
              className="login-btn-workspace"
              aria-label={isSignUp ? "Create account" : "Sign in to workspace"}
              disabled={isExiting || isValidating}
            >
              {isSignUp ? (
                "Create account"
              ) : isValidating ? (
                <>
                  <span className="login-spinner" aria-hidden="true" />
                  Authenticating...
                </>
              ) : (
                "Sign in to workspace"
              )}
            </button>
          </form>

          {!isSignUp && (
            <>
              <div className="login-demo-divider">
                <span className="login-demo-divider__line" />
                <span className="login-demo-divider__text">
                  QUICK DEMO SIGN-IN
                </span>
                <span className="login-demo-divider__line" />
              </div>

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
            </>
          )}

          <p className="login-account-prompt">
            {isSignUp ? "Already have an account?" : "Not a member yet?"}{" "}
            <button
              type="button"
              className="login-mode-link"
              onClick={() => {
                const nextIsSignUp = !isSignUp;
                setIsSignUp(nextIsSignUp);
                setError("");
                setSignUpSubmitted(false);
                setEmail(nextIsSignUp ? "" : `${selectedRole}@deptdesk.edu`);
                setPassword(nextIsSignUp ? "" : "deptdesk123");
                setFullName("");
                setConfirmPassword("");
              }}
              disabled={isExiting || isValidating}
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
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
