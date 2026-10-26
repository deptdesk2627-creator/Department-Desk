import "./TransactionTable.css";

function TransactionTable({
  activeTab = "outgoing",
  requests,
  statuses,
  signatureOptions = [
    "Unsigned",
    "Signed by Secretary",
    "Signed by Dean",
    "Signed by Both",
  ],
  forwardedDestinations = ["Not sent out", "Returned to Sender"],
  statusClass,
  getRequestStatus,
  requestName,
  requestOffice,
  requestCategory,
  formatDate,
  onUpdateStatus,
  onUpdateIncoming,
  onSelect,
  onExport,
  onDelete,
  readOnly = false,
}) {
  const isIncoming = activeTab === "incoming";

  return (
    <div className="request-table-wrap">
      <table className="request-tracker-table">
        <thead>
          {isIncoming ? (
            <tr>
              <th>Document ID</th>
              <th>Document &amp; Sender</th>
              <th>From Office</th>
              <th>Date Received</th>
              <th>Our Signature</th>
              <th>Sent Out To</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          ) : (
            <tr>
              <th>Request ID</th>
              <th>Form name</th>
              <th>Office</th>
              <th>Date submitted</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          )}
        </thead>
        <tbody>
          {requests.map((request) => {
            const signedValue = request.signedByOffice || "Unsigned";
            const isSigned = signedValue !== "Unsigned";
            const forwardedValue = request.forwardedTo || "Not sent out";
            const isForwarded = forwardedValue !== "Not sent out";

            return (
              <tr
                key={request.id}
                className="request-tracker-row"
                onClick={() => onSelect(request)}
              >
                <td>
                  <span className="request-id-badge">{request.id}</span>
                </td>
                <td className="request-name-cell">
                  <strong>{requestName(request)}</strong>
                  <span>{request.student || "Sender not specified"}</span>
                </td>
                <td>{requestOffice(request)}</td>
                <td>{formatDate(request.dateTime)}</td>
                {isIncoming ? (
                  <>
                    <td onClick={(event) => event.stopPropagation()}>
                      {readOnly ? (
                        <span
                          className={`request-status-badge ${
                            isSigned ? "status-approved" : "status-pending"
                          }`}
                        >
                          {signedValue}
                        </span>
                      ) : (
                        <select
                          aria-label={`Signature status for ${request.id}`}
                          className={`request-status-select ${
                            isSigned ? "status-approved" : "status-pending"
                          }`}
                          value={signedValue}
                          onChange={(event) =>
                            onUpdateIncoming?.(request.id, {
                              signedByOffice: event.target.value,
                            })
                          }
                        >
                          {signatureOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      {readOnly ? (
                        <span
                          className={`request-status-badge ${
                            isForwarded
                              ? "status-under-review"
                              : "status-archived"
                          }`}
                        >
                          {forwardedValue}
                        </span>
                      ) : (
                        <select
                          aria-label={`Forwarded destination for ${request.id}`}
                          className={`request-status-select ${
                            isForwarded
                              ? "status-under-review"
                              : "status-archived"
                          }`}
                          value={forwardedValue}
                          onChange={(event) =>
                            onUpdateIncoming?.(request.id, {
                              forwardedTo: event.target.value,
                            })
                          }
                        >
                          {forwardedDestinations.map((dest) => (
                            <option key={dest} value={dest}>
                              {dest}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </>
                ) : (
                  <td>
                    <span className="request-category">
                      {requestCategory(request)}
                    </span>
                  </td>
                )}
                <td onClick={(event) => event.stopPropagation()}>
                  {readOnly ? (
                    <span
                      className={`request-status-badge ${statusClass(request.status)}`}
                    >
                      {getRequestStatus(request.status)}
                    </span>
                  ) : (
                    <select
                      aria-label={`Status for ${request.id}`}
                      className={`request-status-select ${statusClass(request.status)}`}
                      value={getRequestStatus(request.status)}
                      onChange={(event) =>
                        onUpdateStatus(request.id, event.target.value)
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td onClick={(event) => event.stopPropagation()}>
                  <div className="request-actions">
                    <button
                      type="button"
                      className="request-icon-button"
                      aria-label={`View details for ${request.id}`}
                      title="View details"
                      onClick={() => onSelect(request)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M7 17 17 7M8 7h9v9" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="request-icon-button"
                      aria-label={`Export ${request.id}`}
                      title="Export request"
                      onClick={() => onExport(request)}
                    >
                      <span aria-hidden="true">⇩</span>
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        className="request-icon-button request-delete-button"
                        aria-label={`Delete ${request.id}`}
                        title="Delete request"
                        onClick={() => onDelete(request.id)}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionTable;
