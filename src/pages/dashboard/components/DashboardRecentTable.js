import { EmptyState, StatusPill } from "../../../components/ui";
import { getRequestStatus } from "../../../constants/requestStatus";

function DashboardRecentTable({
  title,
  titleId,
  actionLabel,
  onNavigate,
  tableClassName,
  items,
  isIncomingMode = false,
  hasQuery,
  emptyQueryMessage,
  emptyDefaultMessage,
}) {
  function handleViewAll() {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "officeflow.transactions-tab",
          isIncomingMode ? "incoming" : "outgoing",
        );
      }
    } catch {
      // Ignore storage errors
    }
    onNavigate("transactions");
  }

  return (
    <section className="card panel recent-module" aria-labelledby={titleId}>
      <div className="panel-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="text-button"
          type="button"
          onClick={handleViewAll}
        >
          {actionLabel}
        </button>
      </div>
      {items.length > 0 ? (
        <div className="table-scroll">
          <table className={`request-table mobile-stack-table ${tableClassName}`}>
            <thead>
              {isIncomingMode ? (
                <tr>
                  <th>Document / Request</th>
                  <th>From Office</th>
                  <th>Our Signature</th>
                  <th>Status / Sent Out To</th>
                </tr>
              ) : (
                <tr>
                  <th>Form / Request</th>
                  <th>Requested by</th>
                  <th>Status</th>
                  <th>Office</th>
                </tr>
              )}
            </thead>
            <tbody>
              {items.map((item) => {
                const signature = item.signedByOffice || "Unsigned";
                const isSigned = signature !== "Unsigned";
                const forwarded =
                  item.forwardedTo && item.forwardedTo !== "Not sent out"
                    ? item.forwardedTo
                    : null;

                return (
                  <tr key={item.id}>
                    <td
                      className="mobile-card-primary"
                      data-label={
                        isIncomingMode ? "Document / Request" : "Form / Request"
                      }
                    >
                      <strong>
                        {item.document || item.description || "Untitled item"}
                      </strong>
                      <span>{item.id}</span>
                    </td>
                    {isIncomingMode ? (
                      <>
                        <td data-label="From Office">
                          <strong>{item.office || item.location || "—"}</strong>
                          {item.student && <span>From: {item.student}</span>}
                        </td>
                        <td data-label="Our Signature">
                          <span
                            className={`status-pill ${
                              isSigned ? "status-done" : "status-waiting"
                            }`}
                          >
                            {signature}
                          </span>
                        </td>
                        <td data-label="Status / Sent Out To">
                          <div className="dashboard-incoming-status">
                            <StatusPill status={getRequestStatus(item.status)} />
                            {forwarded && (
                              <span className="dashboard-forwarded-note">
                                → {forwarded}
                              </span>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td data-label="Requested by">{item.student || "—"}</td>
                        <td data-label="Status">
                          <StatusPill status={getRequestStatus(item.status)} />
                        </td>
                        <td data-label="Office">
                          {item.office || item.location || "—"}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          hasQuery={hasQuery}
          queryMessage={emptyQueryMessage}
          defaultMessage={emptyDefaultMessage}
        />
      )}
    </section>
  );
}

export default DashboardRecentTable;
