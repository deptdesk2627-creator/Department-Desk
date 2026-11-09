import { useState } from "react";
import "./Login.css";
import { ROLE_LIST } from "../../constants/roles";
import { supabase } from "../../supabase/supabaseClient";
import LoginBrandPanel from "./components/LoginBrandPanel";

function Login({ onLogin, theme = "light" }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [role, setRole] = useState("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Your password must be at least 6 characters.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: name.trim(),
              role,
            },
          },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) throw signOutError;
        }

        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setMessage(
          "Account created. If email confirmation is enabled, verify your address, then sign in.",
        );
        return;
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
      if (signInError) throw signInError;

      const userRole = data.user?.user_metadata?.role;
      if (!ROLE_LIST.some((item) => item.id === userRole)) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        throw new Error(
          "This account does not have a valid workspace role. Contact your administrator.",
        );
      }

      onLogin?.(data.user);
    } catch (submitError) {
      setError(submitError.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Enter your email address to reset your password.");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(trimmedEmail);
      if (resetError) throw resetError;
      setMessage("If an account exists for this email, a reset link has been sent.");
    } catch (resetError) {
      setError(resetError.message || "Unable to send a password reset email.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <div
      className="login-split-page"
      data-theme={theme}
      data-testid="login-split-page"
    >
      <LoginBrandPanel />

      <main className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2 id="login-heading" className="login-form-title">
              {isSignup ? "Create your account" : "Sign in to DeptDesk"}
            </h2>
            <p className="login-form-subtitle">
              {isSignup
                ? "Enter your details to create a DeptDesk account."
                : "Enter your account credentials to continue."}
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {isSignup && (
              <>
                <div className="login-card-field">
                  <div className="login-card-field__content">
                    <label className="login-card-field__label" htmlFor="signup-name">
                      Full name
                    </label>
                    <input
                      id="signup-name"
                      className="login-card-field__input"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="login-card-field">
                  <div className="login-card-field__content">
                    <label className="login-card-field__label" htmlFor="signup-role">
                      Role
                    </label>
                    <div className="login-select-wrapper">
                      <select
                        id="signup-role"
                        className="login-card-field__select"
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                        disabled={isSubmitting}
                      >
                        {ROLE_LIST.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
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
              <div className="login-card-field__content">
                <label className="login-card-field__label" htmlFor="login-email">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="login-card-field__input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@deptdesk.edu"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="login-card-field">
              <div className="login-card-field__content">
                <label
                  className="login-card-field__label"
                  htmlFor="login-password"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="login-card-field__input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {isSignup && (
              <div className="login-card-field">
                <div className="login-card-field__content">
                  <label
                    className="login-card-field__label"
                    htmlFor="signup-confirm-password"
                  >
                    Confirm password
                  </label>
                  <input
                    id="signup-confirm-password"
                    type="password"
                    className="login-card-field__input"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            {!isSignup && (
              <div className="login-options-row">
                <span />
                <button
                  type="button"
                  className="login-forgot-link"
                  onClick={handlePasswordReset}
                  disabled={isSubmitting}
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
            {message && (
              <p className="login-success-alert" role="status">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="login-btn-workspace"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isSignup
                  ? "Creating account..."
                  : "Signing in..."
                : isSignup
                  ? "Create account"
                  : "Sign in to workspace"}
            </button>
          </form>

          <p className="login-not-member">
            {isSignup ? "Already have an account?" : "Not a member yet?"}
          </p>
          <button
            type="button"
            className="login-btn-demo"
            onClick={() => changeMode(isSignup ? "login" : "signup")}
            disabled={isSubmitting}
          >
            {isSignup ? "Sign in" : "Create an account"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default Login;
