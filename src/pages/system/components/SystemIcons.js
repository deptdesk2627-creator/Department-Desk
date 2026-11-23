export function SystemIcon({ name, size = 18, className = "" }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.85,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    className: className || undefined,
  };

  switch (name) {
    case "user":
      return (
        <svg {...props}>
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="8" r="4" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...props}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case "building":
      return (
        <svg {...props}>
          <path d="M4 21h16" />
          <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
          <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
        </svg>
      );
    case "mail":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case "phone":
      return (
        <svg {...props}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9Z" />
        </svg>
      );
    case "mapPin":
      return (
        <svg {...props}>
          <path d="M12 21s-6-5.7-6-10.5a6 6 0 1 1 12 0C18 15.3 12 21 12 21Z" />
          <circle cx="12" cy="10.5" r="2.2" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path d="M12 3 4.5 6.2v5.4c0 5 3.2 8.7 7.5 10.4 4.3-1.7 7.5-5.4 7.5-10.4V6.2L12 3Z" />
          <path d="m9.2 12.2 2 2 3.8-4" />
        </svg>
      );
    case "lock":
      return (
        <svg {...props}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    case "bell":
      return (
        <svg {...props}>
          <path d="M6 9a6 6 0 1 1 12 0c0 5 2 7 2 7H4s2-2 2-7Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      );
    case "sliders":
      return (
        <svg {...props}>
          <path d="M4 7h16M4 17h16" />
          <circle cx="9" cy="7" r="2.2" fill="var(--surface)" />
          <circle cx="15" cy="17" r="2.2" fill="var(--surface)" />
        </svg>
      );
    case "database":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
          <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
        </svg>
      );
    case "download":
      return (
        <svg {...props}>
          <path d="M12 3v12m0 0-4-4m4 4 4-4" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      );
    case "upload":
      return (
        <svg {...props}>
          <path d="M12 15V3m0 0-4 4m4-4 4 4" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      );
    case "alertTriangle":
      return (
        <svg {...props}>
          <path d="M10.3 3.9 2.4 17.5A1.9 1.9 0 0 0 4 20.3h16a1.9 1.9 0 0 0 1.6-2.8L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z" />
          <path d="M12 9.5v4.2M12 16.8h.01" />
        </svg>
      );
    case "helpCircle":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.6 2.6 0 0 1 5 .8c0 1.8-2.5 2.2-2.5 3.7" />
          <path d="M12 17.2h.01" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "keyboard":
      return (
        <svg {...props}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
          <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9" />
        </svg>
      );
    case "folder":
      return (
        <svg {...props}>
          <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2.5h6.5A2.5 2.5 0 0 1 21 9v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <path d="m5 12.5 4.2 4.2L19 7" />
        </svg>
      );
    case "sun":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      );
    case "moon":
      return (
        <svg {...props}>
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
        </svg>
      );
    case "activity":
      return (
        <svg {...props}>
          <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />
        </svg>
      );
    case "volume":
      return (
        <svg {...props}>
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 5a10 10 0 0 1 0 14" />
        </svg>
      );
    case "volumeOff":
      return (
        <svg {...props}>
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <path d="m22 9-6 6" />
          <path d="m16 9 6 6" />
        </svg>
      );
    case "eye":
      return (
        <svg {...props}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "eyeOff":
      return (
        <svg {...props}>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.39-1.61" />
          <path d="m2 2 20 20" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
