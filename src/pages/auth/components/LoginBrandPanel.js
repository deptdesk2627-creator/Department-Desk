import "./LoginBrandPanel.css";

function LoginBrandPanel() {
  return (
    <aside className="login-brand-panel" aria-label="DeptDesk Overview">
      {/* Background Decorative Layer */}
      <div className="login-brand-decorations" aria-hidden="true">
        <div className="login-brand-decorations__grid" />
        <div className="login-brand-decorations__glow-top" />
        <div className="login-brand-decorations__glow-bottom" />
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
          <circle cx="450" cy="700" r="130" stroke="rgba(254, 215, 170, 0.09)" strokeWidth="1.5" />
          <circle cx="450" cy="700" r="210" stroke="rgba(254, 215, 170, 0.06)" strokeWidth="1.2" strokeDasharray="3 5" />
          <circle cx="450" cy="700" r="290" stroke="rgba(254, 215, 170, 0.04)" strokeWidth="1" />
        </svg>
      </div>

      {/* Brand Header */}
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
  );
}

export default LoginBrandPanel;
