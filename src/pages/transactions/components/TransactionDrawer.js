import "./TransactionDrawer.css";
import { formatDateTime } from "../../../utils/formatters";

function TransactionDrawer({
  request,
  trail,
  getRequestStatus,
  requestName,
  requestOffice,
  requestCategory,
  statusClass,
  onClose,
}) {
  if (!request) return null;
  const isIncoming = request.direction === "incoming";

  return (
    <div className="request-drawer-overlay">
      <button
        className="request-drawer-backdrop"
        type="button"
        aria-label="Close request details"
        onClick={onClose}
      />
      <aside
        className="request-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-drawer-title"
        tabIndex="-1"
      >
        <div className="request-drawer-header">
          <div>
            <span className="request-id-badge">{request.id}</span>
            <h2 id="request-drawer-title">{requestName(request)}</h2>
            <span
              className={`request-status-badge ${statusClass(request.status)}`}
            >
              {getRequestStatus(request.status)}
            </span>
          </div>
          <button
            type="button"
            className="request-drawer-close"
            aria-label="Close request details"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="request-drawer-actions">
          <button
            type="button"
            className="request-pdf-button"
            onClick={() => window.print()}
          >
            <span aria-hidden="true">⇩</span> Download PDF
          </button>
        </div>
        <section
          className="request-drawer-section"
          aria-labelledby="request-summary-heading"
        >
          <h3 id="request-summary-heading">
            {isIncoming ? "Incoming document summary" : "Request summary"}
          </h3>
          <dl className="request-summary-grid">
            <div>
              <dt>{isIncoming ? "Sender / Contact" : "Requested by"}</dt>
              <dd>{request.student || "—"}</dd>
            </div>
            <div>
              <dt>{isIncoming ? "From office" : "Office"}</dt>
              <dd>{requestOffice(request)}</dd>
            </div>
            <div>
              <dt>{isIncoming ? "Date received" : "Submitted date"}</dt>
              <dd>{formatDateTime(request.dateTime)}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{requestCategory(request)}</dd>
            </div>
            {isIncoming && (
              <>
                <div>
                  <dt>Signed by our office</dt>
                  <dd>{request.signedByOffice || "Unsigned"}</dd>
                </div>
                <div>
                  <dt>Sent out / Forwarded to</dt>
                  <dd>{request.forwardedTo || "Not sent out"}</dd>
                </div>
              </>
            )}
          </dl>
        </section>
        <section className="request-notes-box">
          <h3>{isIncoming ? "Routing & signature notes" : "Request notes"}</h3>
          <p>{request.notes || request.description || "No request notes provided."}</p>
        </section>
        <section
          className="request-drawer-section request-trail-section"
          aria-labelledby="request-trail-heading"
        >
          <h3 id="request-trail-heading">
            {isIncoming ? "Document & signature trail" : "Approval trail"}
          </h3>
          <ol className="request-timeline">
            {trail.map((item, index) => (
              <li
                key={`${item.title}-${item.dateTime || index}`}
                className={index === trail.length - 1 ? "is-current" : ""}
              >
                <span className="request-timeline-marker" />
                <div>
                  <strong>{item.title}</strong>
                  {item.office && <span>{item.office}</span>}
                  {item.dateTime && (
                    <time>{formatDateTime(item.dateTime)}</time>
                  )}
                </div>
              </li>
            ))}
            {!trail.length && (
              <li className="is-current">
                <span className="request-timeline-marker" />
                <div>
                  <strong>
                    {isIncoming ? "Document Received" : "Form Submitted"}
                  </strong>
                </div>
              </li>
            )}
          </ol>
        </section>
      </aside>
    </div>
  );
}

export default TransactionDrawer;
