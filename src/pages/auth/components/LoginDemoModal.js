import "./LoginDemoModal.css";
import { ROLE_LIST } from "../../../constants/roles";

function LoginDemoModal({
  isOpen,
  modalMode = "demo",
  onClose,
  onSelectRole,
  roles = ROLE_LIST,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="login-demo-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
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
            onClick={onClose}
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
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              className="login-demo-modal-item"
              onClick={() => onSelectRole(role.id)}
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
  );
}

export default LoginDemoModal;
