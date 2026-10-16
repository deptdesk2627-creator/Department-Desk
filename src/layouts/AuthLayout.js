import "./AuthLayout.css";

function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <aside className="auth-layout__brand-panel" aria-label="DeptDesk overview">
        <div className="auth-layout__brand">
          <span className="auth-layout__brand-mark" aria-hidden="true">
            D
          </span>
          <span className="auth-layout__brand-name">
            <strong>Dept</strong>
            <span>Desk</span>
          </span>
        </div>

        <div className="auth-layout__hero">
          <p className="auth-layout__eyebrow">OFFICE WORKSPACE PORTAL</p>
          <h1>Departmental operations in one organized workspace.</h1>
          <p>
            Track incoming documents and requests, manage office tasks, and
            monitor supply inventory across Secretary, Dean, and Faculty &amp;
            Staff roles.
          </p>
          <ul className="auth-layout__features">
            <li>
              <span className="auth-layout__feature-dot" aria-hidden="true">
                ✓
              </span>
              Real-time document &amp; request status trail
            </li>
            <li>
              <span className="auth-layout__feature-dot" aria-hidden="true">
                ✓
              </span>
              Role-based access for Secretary, Dean, and Staff
            </li>
            <li>
              <span className="auth-layout__feature-dot" aria-hidden="true">
                ✓
              </span>
              Office supply borrowing, returns &amp; low-stock alerts
            </li>
          </ul>
        </div>

        <p className="auth-layout__footer">
          DeptDesk · Departmental Workflow &amp; Inventory System
        </p>
      </aside>

      <main id="auth-page" className="auth-layout__content">
        {children}
      </main>
    </div>
  );
}

export default AuthLayout;
