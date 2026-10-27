import { useState } from "react";
import "./Login.css";
import { ROLE_LIST } from "../../constants/roles";

const DEMO_ACCOUNTS = {
  "secretary@deptdesk.edu": "secretary",
  "dean@deptdesk.edu": "dean",
  "staff@deptdesk.edu": "staff",
  secretary: "secretary",
  dean: "dean",
  staff: "staff",
};

function Login({ onLogin, defaultRoleId = "secretary" }) {
  const [selectedRole, setSelectedRole] = useState(defaultRoleId);
  const [email, setEmail] = useState(`${defaultRoleId}@deptdesk.edu`);
  const [password, setPassword] = useState("deptdesk123");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [modalMode, setModalMode] = useState("demo"); // 'demo' | 'forgot'

  function handleRoleSelect(roleId) {
    setSelectedRole(roleId);
    setEmail(`${roleId}@deptdesk.edu`);
    setError("");
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
    onLogin?.(matchedRole);
  }

  function handleQuickSignIn(roleId) {
    setSelectedRole(roleId);
    setEmail(`${roleId}@deptdesk.edu`);
    setPassword("deptdesk123");
    setError("");
    setShowDemoModal(false);
    onLogin?.(roleId);
  }

  return (
    <div className="login-split-page">
      {/* Left Brand Panel */}
      <aside className="login-brand-panel" aria-label="DeptDesk Overview">
        {/* Decorative Background Design */}
        <div className="login-brand-decorations" aria-hidden="true">
          {/* Subtle Grid Overlay */}
          <div className="login-brand-decorations__grid" />

          {/* Atmospheric Ambient Glows */}
          <div className="login-brand-decorations__glow-top" />
          <div className="login-brand-decorations__glow-bottom" />

          {/* Workflow Ribbon Curves & Geometric Rings */}
          <svg
            className="login-brand-decorations__waves"
            viewBox="0 0 500 800"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fdba74" stopOpacity="0.32" />
                <stop offset="50%" stopColor="#ea580c" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#7c2d12" stopOpacity="0.02" />
              </linearGradient>

              <linearGradient id="waveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#f97316" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#431407" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="ribbonGlow" x1="0%" y1="30%" x2="100%" y2="70%">
                <stop offset="0%" stopColor="#fdba74" stopOpacity="0.0" />
                <stop offset="30%" stopColor="#fb923c" stopOpacity="0.65" />
                <stop offset="65%" stopColor="#fcd34d" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
              </linearGradient>

              <filter id="waveGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Workflow Ribbon Waves */}
            <path
              d="M-50,300 C110,240 210,430 370,370 C460,335 510,270 560,290"
              stroke="url(#waveGrad1)"
              strokeWidth="1.5"
            />
            <path
              d="M-60,335 C100,270 225,460 385,400 C475,360 520,295 570,315"
              stroke="url(#ribbonGlow)"
              strokeWidth="2.4"
              filter="url(#waveGlow)"
            />
            <path
              d="M-70,370 C90,305 240,490 400,430 C490,390 530,320 580,340"
              stroke="url(#waveGrad2)"
              strokeWidth="1.5"
            />
            <path
              d="M-80,405 C80,340 255,520 415,460 C505,420 540,345 590,365"
              stroke="url(#waveGrad1)"
              strokeWidth="1.2"
              strokeDasharray="4 6"
            />

            {/* Concentric Architectural Rings */}
            <circle cx="450" cy="700" r="130" stroke="rgba(254, 215, 170, 0.09)" strokeWidth="1.5" />
            <circle cx="450" cy="700" r="210" stroke="rgba(254, 215, 170, 0.06)" strokeWidth="1.2" strokeDasharray="3 5" />
            <circle cx="450" cy="700" r="290" stroke="rgba(254, 215, 170, 0.04)" strokeWidth="1" />
          </svg>
        </div>

        {/* Brand Logo Header */}
        <div className="login-brand-header">
          <div className="login-brand-logo-mark" aria-hidden="true">
            D
          </div>
          <span className="login-brand-name">DeptDesk</span>
        </div>

        {/* Center Hero Message */}
        <div className="login-brand-hero">
          <h1 className="login-brand-title">
            Hello,
            <br />
            welcome!
          </h1>
          <p className="login-brand-subtitle">
            Departmental workflow, task management, and supply inventory system.
          </p>
        </div>

        {/* Bottom Footer */}
        <p className="login-brand-footer">
          DeptDesk · Departmental Workflow &amp; Inventory System
        </p>
      </aside>

      {/* Right Login Form Panel */}
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
                    stroke="#94a3b8"
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
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <p className="login-error-alert" role="alert">
                {error}
              </p>
            )}

            {/* Button 1: White Sign In To Workspace */}
            <button
              type="submit"
              className="login-btn-workspace"
              aria-label="Sign in to workspace"
            >
              Sign in to workspace
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
          >
            Quick demo sign-in
          </button>
        </div>
      </main>

      {/* Interactive Modal for Quick Demo Accounts or Password Help */}
      {showDemoModal && (
        <div
          className="login-demo-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowDemoModal(false)}
        >
          <div
            className="login-demo-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login-demo-modal-header">
              <h3>
                {modalMode === "forgot"
                  ? "Default Demo Credentials"
                  : "Quick Demo Sign-In"}
              </h3>
              <button
                type="button"
                className="login-demo-modal-close"
                onClick={() => setShowDemoModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <p className="login-demo-modal-desc">
              {modalMode === "forgot"
                ? "This workspace uses default credentials (password: deptdesk123). Click any role below to sign in:"
                : "Choose an active workspace role below to sign in instantly:"}
            </p>

            <div className="login-demo-modal-list">
              {ROLE_LIST.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className="login-demo-modal-item"
                  onClick={() => handleQuickSignIn(role.id)}
                >
                  <span className="login-demo-modal-avatar" aria-hidden="true">
                    {role.initials}
                  </span>
                  <div className="login-demo-modal-info">
                    <strong>
                      {role.label} — {role.name}
                    </strong>
                    <span>{role.id}@deptdesk.edu</span>
                    <small>{role.description}</small>
                  </div>
                  <span className="login-demo-modal-action">Sign in →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
