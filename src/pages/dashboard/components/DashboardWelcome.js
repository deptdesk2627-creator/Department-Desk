function DashboardWelcome({
  greeting,
  dateTime,
  formattedDate,
  role,
}) {
  const isDean = role?.id === "dean";

  return (
    <section className="dashboard-welcome" aria-label="Dashboard welcome">
      <div className="dashboard-welcome-copy">
        {isDean && (
          <p className="eyebrow dashboard-welcome-eyebrow">
            EXECUTIVE OVERSIGHT · READ-ONLY WORKSPACE
          </p>
        )}
        <h1>
          {greeting}
          {" "}
          <svg
            className="welcome-sparkle"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="m12 2 1.8 7.1L21 11l-7.2 1.9L12 20l-1.8-7.1L3 11l7.2-1.9L12 2Z" />
            <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
          </svg>
        </h1>
        <p>
          {isDean
            ? "Monitor departmental requests, approval turnarounds, tasks, and supply thresholds."
            : "Here’s what’s happening in your department today."}
        </p>
      </div>
      <div className="dashboard-date-badge">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
        <time dateTime={dateTime}>{formattedDate}</time>
      </div>
    </section >
  );
}

export default DashboardWelcome;
