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
          <table className={`request-table ${tableClassName}`}>
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
                    <td>
                      <strong>
                        {item.document || item.description || "Untitled item"}
                      </strong>
                      <span>{item.id}</span>
                    </td>
                    {isIncomingMode ? (
                      <>
                        <td>
                          <strong>{item.office || item.location || "—"}</strong>
                          {item.student && <span>From: {item.student}</span>}
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              isSigned ? "status-done" : "status-waiting"
                            }`}
                          >
                            {signature}
                          </span>
                        </td>
                        <td>
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
                        <td>{item.student || "—"}</td>
                        <td>
                          <StatusPill status={getRequestStatus(item.status)} />
                        </td>
                        <td>{item.office || item.location || "—"}</td>
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
