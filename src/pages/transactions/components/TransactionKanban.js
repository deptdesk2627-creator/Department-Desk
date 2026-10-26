import "./TransactionKanban.css";

function TransactionKanban({
  activeTab = "outgoing",
  requests,
  statuses,
  statusClass,
  getRequestStatus,
  requestName,
  requestOffice,
  formatDate,
  onSelect,
}) {
  const isIncoming = activeTab === "incoming";

  return (
    <div className="request-kanban">
      {statuses.map((status) => {
        const statusRequests = requests.filter(
          (request) => getRequestStatus(request.status) === status,
        );
        return (
          <section
            className="request-kanban-column"
            key={status}
            aria-label={`${status} requests`}
          >
            <div className="request-kanban-heading">
              <h3>
                <span className={`request-status-dot ${statusClass(status)}`} />
                {status}
              </h3>
              <span>{statusRequests.length}</span>
            </div>
            <div className="request-kanban-cards">
              {statusRequests.map((request) => (
                <article className="request-kanban-card" key={request.id}>
                  <div className="request-kanban-card-top">
                    <span className="request-id-badge">{request.id}</span>
                    <button
                      type="button"
                      className="request-icon-button"
                      aria-label={`View details for ${request.id}`}
                      onClick={() => onSelect(request)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M7 17 17 7M8 7h9v9" />
                      </svg>
                    </button>
                  </div>
                  <h4>{requestName(request)}</h4>
                  <p>
                    {isIncoming
                      ? `From: ${requestOffice(request)}`
                      : requestOffice(request)}
                  </p>
                  {isIncoming && (
                    <div className="request-kanban-incoming-meta">
                      <span>{request.signedByOffice || "Unsigned"}</span>
                      {request.forwardedTo &&
                        request.forwardedTo !== "Not sent out" && (
                          <span>→ {request.forwardedTo}</span>
                        )}
                    </div>
                  )}
                  <div className="request-kanban-card-footer">
                    <span>{request.student || "Requester not specified"}</span>
                    <time>{formatDate(request.dateTime)}</time>
                  </div>
                </article>
              ))}
              {!statusRequests.length && (
                <p className="request-column-empty">No items</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default TransactionKanban;
