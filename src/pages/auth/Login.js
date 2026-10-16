import { useState } from "react";
import "./Login.css";
import { ROLE_LIST } from "../../utils/roles";

const DEMO_ACCOUNTS = {
  "secretary@deptdesk.edu": "secretary",
  "dean@deptdesk.edu": "dean",
  "staff@deptdesk.edu": "staff",
};

function Login({ onLogin, defaultRoleId = "secretary" }) {
  const [email, setEmail] = useState("secretary@deptdesk.edu");
  const [password, setPassword] = useState("deptdesk123");
  const [selectedRole, setSelectedRole] = useState(defaultRoleId);
  const [error, setError] = useState("");

  function handleRoleSelect(roleId) {
    setSelectedRole(roleId);
    setEmail(`${roleId}@deptdesk.edu`);
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password.trim()) {
      setError("Please enter both your email address and password.");
      return;
    }

    const matchedRole = DEMO_ACCOUNTS[trimmedEmail] || selectedRole;
    setError("");
    onLogin?.(matchedRole);
  }

  return (
    <section className="login-card" aria-labelledby="login-heading">
      <div className="login-card__header">
        <p className="login-card__eyebrow">WELCOME BACK</p>
        <h2 id="login-heading">Sign in to DeptDesk</h2>
        <p>Enter your account credentials or choose a workspace role below.</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-form__field">
          Workspace role
          <select
            value={selectedRole}
            onChange={(event) => handleRoleSelect(event.target.value)}
          >
            {ROLE_LIST.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label} ({role.name})
              </option>
            ))}
          </select>
        </label>

        <label className="login-form__field">
          Email address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@deptdesk.edu"
            autoComplete="username"
            required
          />
        </label>

        <label className="login-form__field">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className="login-form__error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="primary-button login-form__submit"
        >
          Sign in to workspace
        </button>
      </form>

      <div className="login-divider">Quick demo sign-in</div>

      <div className="login-demo-roles">
        {ROLE_LIST.map((role) => (
          <button
            key={role.id}
            type="button"
            className="login-demo-role"
            onClick={() => onLogin?.(role.id)}
          >
            <span className="login-demo-role__avatar" aria-hidden="true">
              {role.initials}
            </span>
            <span className="login-demo-role__info">
              <strong>
                {role.label} — {role.name}
              </strong>
              <span>{role.description}</span>
            </span>
            <span className="login-demo-role__action">Continue →</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default Login;
