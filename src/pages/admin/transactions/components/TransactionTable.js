function TransactionTable({
  requests,
  statuses,
  statusClass,
  getRequestStatus,
  requestName,
  requestOffice,
  requestCategory,
  formatDate,
  onUpdateStatus,
  onSelect,
  onExport,
  onDelete,
}) {
  return (
    <div className="request-table-wrap">
      <table className="request-tracker-table">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Form name</th>
            <th>Office</th>
            <th>Date submitted</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>
                <span className="request-id-badge">{request.id}</span>
              </td>
              <td className="request-name-cell">
                <strong>{requestName(request)}</strong>
                <span>{request.student || "Requester not specified"}</span>
              </td>
              <td>{requestOffice(request)}</td>
              <td>{formatDate(request.dateTime)}</td>
              <td>
                <span className="request-category">
                  {requestCategory(request)}
                </span>
              </td>
              <td>
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
              </td>
              <td>
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
                  <button
                    type="button"
                    className="request-icon-button request-delete-button"
                    aria-label={`Delete ${request.id}`}
                    title="Delete request"
                    onClick={() => onDelete(request.id)}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionTable;
