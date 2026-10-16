import EmptyState from "../../../../components/ui/EmptyState";
import StatusPill from "../../../../components/ui/StatusPill";
import { getRequestStatus } from "../../../../utils/requestStatus";

function DashboardRecentTable({
  title,
  titleId,
  actionLabel,
  onNavigate,
  tableClassName,
  items,
  isDocumentMode = false,
  hasQuery,
  emptyQueryMessage,
  emptyDefaultMessage,
}) {
  return (
    <section className="card panel recent-module" aria-labelledby={titleId}>
      <div className="panel-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="text-button"
          type="button"
          onClick={() => onNavigate("transactions")}
        >
          {actionLabel}
        </button>
      </div>
      {items.length > 0 ? (
        <div className="table-scroll">
          <table className={`request-table ${tableClassName}`}>
            <thead>
              <tr>
                <th>{isDocumentMode ? "Document name" : "Requested by"}</th>
                <th>{isDocumentMode ? "Requested by" : "Description"}</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>
                      {isDocumentMode ? item.document : item.student}
                    </strong>
                    <span>{item.id}</span>
                  </td>
                  <td>
                    {isDocumentMode
                      ? item.student
                      : item.description || item.document}
                  </td>
                  <td>
                    <StatusPill status={getRequestStatus(item.status)} />
                  </td>
                  <td>{item.office || item.location || "—"}</td>
                </tr>
              ))}
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
