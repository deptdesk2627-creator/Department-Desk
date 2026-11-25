import { useEffect, useRef, useState } from "react";
import "./Login.css";
import { ROLE_LIST } from "../../constants/roles";
import { supabase } from "../../supabase/supabaseClient";
import LoginBrandPanel from "./components/LoginBrandPanel";

const OTP_LENGTH = 8;
const EMPTY_OTP = Array(OTP_LENGTH).fill("");
const RESEND_COOLDOWN_SECONDS = 60;
const AWAITING_APPROVAL_MESSAGE =
  "Please wait for confirmation of your account from the Secretary or Dean. If you have any questions or clarifications, please proceed to the OIC / Department Office.";

function PasswordEyeIcon({ visible }) {
  if (visible) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

async function checkAccountApproval(authUserId, userRole) {
  if (!authUserId || userRole === "secretary" || userRole === "dean") {
    return "approved";
  }
  if (typeof supabase?.from !== "function") {
    return "approved";
  }

  try {
    const query = supabase
      .from("users")
      .select("approval_status")
      .eq("auth_user_id", authUserId);
    const result =
      typeof query?.maybeSingle === "function"
        ? await query.maybeSingle()
        : await query;
    if (result?.error || !result?.data) {
      return "approved";
    }
    const status = String(result.data.approval_status || "approved")
      .trim()
      .toLowerCase();
    return status === "pending" || status === "declined" ? status : "approved";
  } catch {
    return "approved";
  }
}

function Login({ onLogin, theme = "light" }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [role, setRole] = useState("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(EMPTY_OTP);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [error, setError] = useState("");
  const [hasInvalidCredentials, setHasInvalidCredentials] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupRoleAvailability, setSignupRoleAvailability] = useState({});
  const [isLoadingSignupRoles, setIsLoadingSignupRoles] = useState(false);
  const [signupRoleAvailabilityError, setSignupRoleAvailabilityError] =
    useState("");
  const otpInputRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timerId = window.setInterval(() => {
      setResendCooldown((seconds) => (seconds > 1 ? seconds - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [resendCooldown]);

  async function loadSignupRoleAvailability() {
    setIsLoadingSignupRoles(true);
    setSignupRoleAvailabilityError("");
    try {
      const { data, error: availabilityError } = await supabase.rpc(
        "get_signup_role_availability",
      );
      if (availabilityError) throw availabilityError;

      const availability = Object.fromEntries(
        (Array.isArray(data) ? data : []).map((entry) => [
          entry.role,
          Boolean(entry.is_available),
        ]),
      );
      if (!Object.prototype.hasOwnProperty.call(availability, "staff")) {
        throw new Error("Signup availability response omitted the staff role.");
      }
      setSignupRoleAvailability(availability);
      setRole((currentRole) => {
        if (availability[currentRole]) return currentRole;
        return (
          ROLE_LIST.find((item) => availability[item.id])?.id || currentRole
        );
      });
    } catch (availabilityError) {
      console.error("Could not load signup role availability.", availabilityError);
      setSignupRoleAvailability({});
      setSignupRoleAvailabilityError(
        "Could not check limited-role availability. Only Staff signup is available right now.",
      );
    } finally {
      setIsLoadingSignupRoles(false);
    }
  }

  function changeMode(nextMode) {
    if (mode === "reset-password" && nextMode !== "reset-password") {
      supabase.auth?.signOut?.().catch(() => {});
    }
    setMode(nextMode);
    setError("");
    setMessage("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setHasInvalidCredentials(false);
    setOtpDigits(EMPTY_OTP);
    if (nextMode === "login" || nextMode === "forgot-password") {
      setPassword("");
      setConfirmPassword("");
    }
    if (nextMode === "signup") {
      loadSignupRoleAvailability();
    }
  }

  function focusOtpBox(index) {
    const targetIndex = Math.max(0, Math.min(OTP_LENGTH - 1, index));
    otpInputRefs.current[targetIndex]?.focus();
  }

  function handleOtpChange(index, rawValue) {
    const digitsOnly = String(rawValue || "").replace(/\D/g, "");
    if (!digitsOnly) {
      setOtpDigits((current) => {
        const next = [...current];
        next[index] = "";
        return next;
      });
      return;
    }

    if (digitsOnly.length > 1) {
      const chars = digitsOnly.slice(0, OTP_LENGTH - index).split("");
      setOtpDigits((current) => {
        const next = [...current];
        chars.forEach((digit, offset) => {
          next[index + offset] = digit;
        });
        return next;
      });
      focusOtpBox(Math.min(OTP_LENGTH - 1, index + chars.length));
      return;
    }

    setOtpDigits((current) => {
      const next = [...current];
      next[index] = digitsOnly;
      return next;
    });
    if (index < OTP_LENGTH - 1) {
      focusOtpBox(index + 1);
    }
  }

  function handleOtpKeyDown(index, event) {
    if (event.key === "Backspace") {
      if (otpDigits[index]) {
        setOtpDigits((current) => {
          const next = [...current];
          next[index] = "";
          return next;
        });
      } else if (index > 0) {
        event.preventDefault();
        setOtpDigits((current) => {
          const next = [...current];
          next[index - 1] = "";
          return next;
        });
        focusOtpBox(index - 1);
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusOtpBox(index - 1);
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusOtpBox(index + 1);
    }
  }

  function handleOtpPaste(index, event) {
    const pastedDigits = String(
      event.clipboardData?.getData("text") || "",
    ).replace(/\D/g, "");
    if (!pastedDigits) return;
    event.preventDefault();
    const startIndex = index;
    const chars = pastedDigits.slice(0, OTP_LENGTH - startIndex).split("");
    setOtpDigits((current) => {
      const next = [...current];
      chars.forEach((digit, offset) => {
        next[startIndex + offset] = digit;
      });
      return next;
    });
    focusOtpBox(Math.min(OTP_LENGTH - 1, startIndex + chars.length - 1));
  }

  async function handleResendOtp() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || isResendingOtp || resendCooldown > 0) return;
    setError("");
    setMessage("");
    setIsResendingOtp(true);
    try {
      if (mode === "verify-recovery-otp") {
        const { error: resetError } =
          await supabase.auth.resetPasswordForEmail(trimmedEmail);
        if (resetError) throw resetError;
        setOtpDigits(EMPTY_OTP);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setMessage(
          `A new 8-digit recovery code has been sent to ${trimmedEmail}.`,
        );
      } else {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email: trimmedEmail,
        });
        if (resendError) throw resendError;
        setOtpDigits(EMPTY_OTP);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setMessage(
          `A new 8-digit verification code has been sent to ${trimmedEmail}.`,
        );
      }
      focusOtpBox(0);
    } catch (resendError) {
      setError(
        resendError.message || "Could not resend verification code. Try again.",
      );
    } finally {
      setIsResendingOtp(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setHasInvalidCredentials(false);

    const trimmedEmail = email.trim().toLowerCase();
    if (mode === "forgot-password") {
      if (!trimmedEmail) {
        setError("Enter your account email address.");
        return;
      }
      setIsSubmitting(true);
      try {
        const { error: resetError } =
          await supabase.auth.resetPasswordForEmail(trimmedEmail);
        if (resetError) throw resetError;
        setMode("verify-recovery-otp");
        setOtpDigits(EMPTY_OTP);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setMessage(
          `We sent an 8-digit recovery code to ${trimmedEmail}. Enter it below to reset your password.`,
        );
      } catch (resetError) {
        setError(
          resetError.message ||
            "Could not send password recovery code. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === "verify-recovery-otp") {
      const token = otpDigits.join("");
      if (token.length !== OTP_LENGTH) {
        setError(`Enter all ${OTP_LENGTH} digits of your recovery code.`);
        return;
      }
      setIsSubmitting(true);
      try {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: trimmedEmail,
          token,
          type: "recovery",
        });
        if (verifyError) throw verifyError;
        setMode("reset-password");
        setOtpDigits(EMPTY_OTP);
        setPassword("");
        setConfirmPassword("");
        setResendCooldown(0);
        setMessage("Code verified. Create a new password for your account.");
      } catch (verifyError) {
        const rawMessage = verifyError.message || "";
        setError(
          /expired|invalid/i.test(rawMessage)
            ? "That recovery code has expired or is invalid. Check your latest email or click Resend OTP code."
            : rawMessage ||
                "Invalid or expired recovery code. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === "reset-password") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Your password must be at least 6 characters.");
        return;
      }
      setIsSubmitting(true);
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) throw updateError;
        await supabase.auth?.signOut?.().catch(() => {});
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setMessage(
          "Password updated! You can now sign in with your new password.",
        );
      } catch (updateError) {
        setError(
          updateError.message ||
            "Could not update your password. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    if (mode === "verify-otp") {
      const token = otpDigits.join("");
      if (token.length !== OTP_LENGTH) {
        setError(`Enter all ${OTP_LENGTH} digits of your verification code.`);
        return;
      }

      setIsSubmitting(true);
      try {
        let verifyResult = await supabase.auth.verifyOtp({
          email: trimmedEmail,
          token,
          type: "signup",
        });

        if (
          verifyResult.error &&
          /expired|invalid/i.test(verifyResult.error.message || "")
        ) {
          const fallbackResult = await supabase.auth.verifyOtp({
            email: trimmedEmail,
            token,
            type: "email",
          });
          if (!fallbackResult.error) {
            verifyResult = fallbackResult;
          }
        }

        if (verifyResult.error) throw verifyResult.error;
        const { data } = verifyResult;

        let verifiedRole = role;
        if (data?.session) {
          const { data: claimsData } = await supabase.auth.getClaims();
          verifiedRole =
            claimsData?.claims?.app_metadata?.role ||
            data.user?.app_metadata?.role ||
            data.user?.user_metadata?.role ||
            role;
          const approvalStatus = await checkAccountApproval(
            data.user?.id,
            verifiedRole,
          );
          if (approvalStatus === "declined") {
            await supabase.auth.signOut().catch(() => {});
            setMode("login");
            setOtpDigits(EMPTY_OTP);
            setPassword("");
            setConfirmPassword("");
            setResendCooldown(0);
            setError(
              "Your account registration was declined by the department. Contact the Secretary or Dean.",
            );
            return;
          }
          if (
            approvalStatus === "pending" ||
            verifiedRole === "staff"
          ) {
            await supabase.auth.signOut().catch(() => {});
            setMode("awaiting-approval");
            setOtpDigits(EMPTY_OTP);
            setPassword("");
            setConfirmPassword("");
            setResendCooldown(0);
            setMessage(AWAITING_APPROVAL_MESSAGE);
            return;
          }
          if (ROLE_LIST.some((item) => item.id === verifiedRole)) {
            onLogin?.({
              ...data.user,
              app_metadata: {
                ...data.user?.app_metadata,
                role: verifiedRole,
              },
            });
            return;
          }
        }

        if (verifiedRole === "staff") {
          setMode("awaiting-approval");
          setOtpDigits(EMPTY_OTP);
          setPassword("");
          setConfirmPassword("");
          setResendCooldown(0);
          setMessage(AWAITING_APPROVAL_MESSAGE);
          return;
        }

        setMode("login");
        setOtpDigits(EMPTY_OTP);
        setPassword("");
        setConfirmPassword("");
        setResendCooldown(0);
        setMessage("Email verified! You can now sign in to your account.");
      } catch (verifyError) {
        const rawMessage = verifyError.message || "";
        setError(
          /expired|invalid/i.test(rawMessage)
            ? "That code has expired or was replaced by a newer email. Check your latest email or click Resend OTP code."
            : rawMessage ||
                "Invalid or expired verification code. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Your password must be at least 6 characters.");
        return;
      }
      if (isLoadingSignupRoles) {
        setError("Wait for signup role availability to finish loading.");
        return;
      }
      if (
        !signupRoleAvailabilityError &&
        signupRoleAvailability[role] !== true
      ) {
        setError("That role is no longer available. Choose another role.");
        loadSignupRoleAvailability();
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

        const isExistingOrConfirmedUser =
          Array.isArray(data?.user?.identities) &&
          data.user.identities.length === 0;
        if (isExistingOrConfirmedUser) {
          setMode("login");
          setPassword("");
          setConfirmPassword("");
          setError(
            "An account with this email already exists. Please sign in with your password.",
          );
          return;
        }

        if (data?.session) {
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) throw signOutError;
          setMode("login");
          setPassword("");
          setConfirmPassword("");
          setMessage("Account created. You can now sign in.");
          return;
        }

        setMode("verify-otp");
        setOtpDigits(EMPTY_OTP);
        setPassword("");
        setConfirmPassword("");
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setMessage(
          `We sent an 8-digit verification code to ${trimmedEmail}. Enter it below to verify your account.`,
        );
        return;
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
      if (signInError) {
        if (/email not confirmed/i.test(signInError.message || "")) {
          if (typeof supabase.auth.resend === "function") {
            await supabase.auth
              .resend({
                type: "signup",
                email: trimmedEmail,
              })
              .catch(() => {});
          }
          setMode("verify-otp");
          setOtpDigits(EMPTY_OTP);
          setResendCooldown(RESEND_COOLDOWN_SECONDS);
          setMessage(
            `Your email is not verified yet. We sent a fresh 8-digit verification code to ${trimmedEmail}.`,
          );
          return;
        }
        if (
          /invalid login credentials|invalid credentials|invalid email or password/i.test(
            signInError.message || "",
          )
        ) {
          setHasInvalidCredentials(true);
        }
        throw signInError;
      }

      const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims();
      if (claimsError) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        throw claimsError;
      }

      const userRole = claimsData?.claims?.app_metadata?.role;
      if (!ROLE_LIST.some((item) => item.id === userRole)) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        throw new Error(
          "This account is missing a valid app_metadata.role JWT claim. Contact your administrator.",
        );
      }

      const approvalStatus = await checkAccountApproval(
        data.user?.id,
        userRole,
      );
      if (approvalStatus === "pending") {
        await supabase.auth.signOut().catch(() => {});
        setMode("awaiting-approval");
        setPassword("");
        setMessage(AWAITING_APPROVAL_MESSAGE);
        return;
      }
      if (approvalStatus === "declined") {
        await supabase.auth.signOut().catch(() => {});
        throw new Error(
          "Your account request was declined by the Secretary or Dean. Contact the department office for assistance.",
        );
      }

      onLogin?.({
        ...data.user,
        app_metadata: {
          ...data.user?.app_metadata,
          role: userRole,
        },
      });
    } catch (submitError) {
      setError(submitError.message || "Authentication failed. Please try again.");
      if (mode === "signup") {
        loadSignupRoleAvailability();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSignup = mode === "signup";
  const isVerifyOtp = mode === "verify-otp";
  const isForgotPassword = mode === "forgot-password";
  const isVerifyRecoveryOtp = mode === "verify-recovery-otp";
  const isResetPassword = mode === "reset-password";
  const isAnyOtp = isVerifyOtp || isVerifyRecoveryOtp;
  const isAwaitingApproval = mode === "awaiting-approval";
  const showForgotPasswordAction = mode === "login" && hasInvalidCredentials;
  const signupRoles = signupRoleAvailabilityError
    ? ROLE_LIST.filter((item) => item.id === "staff")
    : ROLE_LIST.filter((item) => signupRoleAvailability[item.id] === true);

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
              {isAwaitingApproval
                ? "Awaiting account confirmation"
                : isVerifyOtp
                  ? "Verify your email"
                  : isForgotPassword
                    ? "Reset your password"
                    : isVerifyRecoveryOtp
                      ? "Verify recovery code"
                      : isResetPassword
                        ? "Set a new password"
                        : isSignup
                          ? "Create your account"
                          : "Sign in to DeptDesk"}
            </h2>
            <p className="login-form-subtitle">
              {isAwaitingApproval
                ? "Your email has been verified and your registration is in the approval queue."
                : isVerifyOtp
                  ? `Enter the 8-digit verification code sent to ${email.trim().toLowerCase() || "your email"}.`
                  : isForgotPassword
                    ? "Enter your account email to receive an 8-digit recovery code."
                    : isVerifyRecoveryOtp
                      ? `Enter the 8-digit recovery code sent to ${email.trim().toLowerCase() || "your email"}.`
                      : isResetPassword
                        ? `Create a new password for ${email.trim().toLowerCase() || "your account"}.`
                        : isSignup
                          ? "Enter your details to create a DeptDesk account."
                          : "Enter your account credentials to continue."}
            </p>
          </div>

          {isAwaitingApproval ? (
            <div
              className="login-approval-card"
              role="status"
              aria-live="polite"
            >
              <div className="login-approval-card__badge">
                <span
                  className="login-approval-card__dot"
                  aria-hidden="true"
                />
                Pending Secretary or Dean Confirmation
              </div>
              <p className="login-approval-card__text">
                {message || AWAITING_APPROVAL_MESSAGE}
              </p>
              {email && (
                <p className="login-approval-card__meta">
                  Registered email:{" "}
                  <strong>{email.trim().toLowerCase()}</strong>
                </p>
              )}
              <button
                type="button"
                className="login-btn-workspace"
                onClick={() => changeMode("login")}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleSubmit}>
            {isAnyOtp ? (
              <div className="login-otp-section">
                <div
                  className="login-otp-grid"
                  role="group"
                  aria-label={
                    isVerifyRecoveryOtp
                      ? "8-digit recovery code"
                      : "8-digit verification code"
                  }
                >
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={OTP_LENGTH}
                      autoFocus={index === 0}
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      className="login-otp-box"
                      aria-label={`Verification code digit ${index + 1}`}
                      value={digit}
                      onChange={(event) =>
                        handleOtpChange(index, event.target.value)
                      }
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      onPaste={(event) => handleOtpPaste(index, event)}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
                <div className="login-otp-actions">
                  <span>Didn&apos;t receive the code?</span>
                  <button
                    type="button"
                    className="login-mode-toggle"
                    onClick={handleResendOtp}
                    disabled={
                      isSubmitting || isResendingOtp || resendCooldown > 0
                    }
                  >
                    {isResendingOtp
                      ? "Sending code..."
                      : resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Resend OTP code"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {isSignup && (
                  <>
                    <div className="login-card-field">
                      <div className="login-card-field__content">
                        <label
                          className="login-card-field__label"
                          htmlFor="signup-name"
                        >
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
                        <label
                          className="login-card-field__label"
                          htmlFor="signup-role"
                        >
                          Role
                        </label>
                        <div className="login-select-wrapper">
                          <select
                            id="signup-role"
                            className="login-card-field__select"
                            value={role}
                            onChange={(event) => setRole(event.target.value)}
                            disabled={isSubmitting || isLoadingSignupRoles}
                          >
                            {signupRoles.map((item) => (
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

                {!isResetPassword && (
                  <div className="login-card-field">
                    <div className="login-card-field__content">
                      <label
                        className="login-card-field__label"
                        htmlFor="login-email"
                      >
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
                )}

                {!isForgotPassword && (
                  <div className="login-card-field">
                    <div className="login-card-field__content">
                      <label
                        className="login-card-field__label"
                        htmlFor="login-password"
                      >
                        {isResetPassword ? "New password" : "Password"}
                      </label>
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        className="login-card-field__input"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete={
                          isSignup || isResetPassword
                            ? "new-password"
                            : "current-password"
                        }
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      disabled={isSubmitting}
                    >
                      <PasswordEyeIcon visible={showPassword} />
                    </button>
                  </div>
                )}

                {(isSignup || isResetPassword) && (
                  <div className="login-card-field">
                    <div className="login-card-field__content">
                      <label
                        className="login-card-field__label"
                        htmlFor="signup-confirm-password"
                      >
                        {isResetPassword
                          ? "Confirm new password"
                          : "Confirm password"}
                      </label>
                      <input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        className="login-card-field__input"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide password confirmation"
                          : "Show password confirmation"
                      }
                      aria-pressed={showConfirmPassword}
                      disabled={isSubmitting}
                    >
                      <PasswordEyeIcon visible={showConfirmPassword} />
                    </button>
                  </div>
                )}
              </>
            )}

            {isSignup && signupRoleAvailabilityError && (
              <p className="login-error-alert" role="alert">
                {signupRoleAvailabilityError}
              </p>
            )}

            {error && (
              <div
                className={`login-error-alert${
                  showForgotPasswordAction
                    ? " login-error-alert--with-action"
                    : ""
                }`}
                role="alert"
              >
                <span>{error}</span>
                {showForgotPasswordAction && (
                  <button
                    type="button"
                    className="login-error-alert__action"
                    onClick={() => changeMode("forgot-password")}
                    disabled={isSubmitting}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}
            {message && (
              <p className="login-success-alert" role="status">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="login-btn-workspace"
              disabled={isSubmitting || (isSignup && isLoadingSignupRoles)}
            >
              {isSubmitting
                ? isAnyOtp
                  ? "Verifying code..."
                  : isForgotPassword
                    ? "Sending recovery code..."
                    : isResetPassword
                      ? "Updating password..."
                      : isSignup
                        ? "Creating account..."
                        : "Signing in..."
                : isAnyOtp
                  ? "Verify code"
                  : isForgotPassword
                    ? "Send recovery code"
                    : isResetPassword
                      ? "Update password"
                      : isSignup
                        ? "Create account"
                        : "Sign in to workspace"}
            </button>
          </form>
          )}

          {!isAwaitingApproval && (
            <p className="login-not-member">
              <span>
                {isAnyOtp
                  ? "Entered the wrong email?"
                  : isForgotPassword
                    ? "Remembered your password?"
                    : isResetPassword
                      ? "Changed your mind?"
                      : isSignup
                        ? "Already have an account?"
                        : "Not a member yet?"}
              </span>
              <button
                type="button"
                className="login-mode-toggle"
                onClick={() =>
                  changeMode(mode === "login" ? "signup" : "login")
                }
                disabled={isSubmitting}
              >
                {mode === "login"
                  ? "Create an account"
                  : isSignup
                    ? "Sign in"
                    : "Back to sign in"}
              </button>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default Login;
