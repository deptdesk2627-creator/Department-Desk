import "./TransactionCabinets.css";
import { cabinetGroups, UNFILED_LOCATION } from "../constants";

function TransactionCabinets({
  requests = [],
  statusClass,
  getRequestStatus,
  requestName,
  requestOffice,
  formatDate,
  onUpdateFileLocation,
  onSelect,
  readOnly = false,
}) {
  const unfiledRequests = requests.filter(
    (request) =>
      !request.fileLocation || request.fileLocation === UNFILED_LOCATION,
  );

  return (
    <div className="cabinet-locator" aria-label="CICT File Cabinet Locator">
      <section
        className="cabinet-unfiled-tray"
        aria-label="In Process (Not yet filed)"
      >
        <div className="cabinet-unfiled-header">
          <div>
            <h3>
              In Process (Not yet filed){" "}
              <span className="count-badge">{unfiledRequests.length}</span>
            </h3>
            <p>
              Active documents currently being processed on the desk. Assign a
              CICT cabinet &amp; drawer once ready or completed.
            </p>
          </div>
        </div>
        {unfiledRequests.length ? (
          <div className="cabinet-unfiled-grid">
            {unfiledRequests.map((request) => (
              <article key={request.id} className="cabinet-doc-card">
                <div className="cabinet-doc-top">
                  <span className="request-id-badge">{request.id}</span>
                  <span
                    className={`request-status-badge ${statusClass(request.status)}`}
                  >
                    {getRequestStatus(request.status)}
                  </span>
                </div>
                <button
                  type="button"
                  className="cabinet-doc-title"
                  onClick={() => onSelect(request)}
                >
                  {requestName(request)}
                </button>
                <p className="cabinet-doc-meta">
                  {request.student || "—"} · {requestOffice(request)} ·{" "}
                  {formatDate(request.dateTime)}
                </p>
                {!readOnly && (
                  <label className="cabinet-doc-assign">
                    <span>Put in cabinet / drawer:</span>
                    <select
                      aria-label={`Assign cabinet for ${request.id}`}
                      value={request.fileLocation || UNFILED_LOCATION}
                      onChange={(event) =>
                        onUpdateFileLocation?.(request.id, event.target.value)
                      }
                    >
                      <option value={UNFILED_LOCATION}>
                        {UNFILED_LOCATION}
                      </option>
                      {cabinetGroups.map((group) => (
                        <optgroup
                          key={group.id}
                          label={`${group.title} (${group.owner})`}
                        >
                          {group.drawers.map((drawer) => (
                            <option key={drawer.id} value={drawer.id}>
                              {drawer.id}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="cabinet-empty-note">
            All documents in this view have been placed into a cabinet drawer.
          </p>
        )}
      </section>

      <div className="cabinet-units-grid">
        {cabinetGroups.map((group) => {
          const cabinetTotal = group.drawers.reduce(
            (sum, drawer) =>
              sum +
              requests.filter((req) => req.fileLocation === drawer.id).length,
            0,
          );
          return (
            <section
              key={group.id}
              className="cabinet-unit"
              aria-label={`${group.title} (${group.owner})`}
            >
              <header className="cabinet-unit-header">
                <div>
                  <span className="cabinet-unit-owner">{group.owner}</span>
                  <h3>{group.title}</h3>
                </div>
                <span className="cabinet-unit-count">
                  {cabinetTotal} {cabinetTotal === 1 ? "file" : "files"}
                </span>
              </header>

              <div className="cabinet-drawers-stack">
                {group.drawers.map((drawer) => {
                  const drawerDocs = requests.filter(
                    (req) => req.fileLocation === drawer.id,
                  );
                  return (
                    <div key={drawer.id} className="cabinet-drawer-box">
                      <div className="cabinet-drawer-bar">
                        <div className="cabinet-drawer-title">
                          <span className="cabinet-drawer-handle" aria-hidden="true" />
                          <strong>{drawer.shortLabel}</strong>
                          <span>{drawer.id}</span>
                        </div>
                        <span className="cabinet-drawer-badge">
                          {drawerDocs.length}
                        </span>
                      </div>

                      {drawerDocs.length ? (
                        <ul className="cabinet-drawer-files">
                          {drawerDocs.map((request) => (
                            <li key={request.id} className="cabinet-drawer-file">
                              <div className="cabinet-drawer-file-main">
                                <button
                                  type="button"
                                  className="cabinet-drawer-file-link"
                                  onClick={() => onSelect(request)}
                                >
                                  <span className="request-id-badge">
                                    {request.id}
                                  </span>
                                  <strong>{requestName(request)}</strong>
                                </button>
                                <span
                                  className={`request-status-badge ${statusClass(request.status)}`}
                                >
                                  {getRequestStatus(request.status)}
                                </span>
                              </div>
                              <div className="cabinet-drawer-file-sub">
                                <span>
                                  {request.student || "—"} ·{" "}
                                  {requestOffice(request)}
                                </span>
                                {!readOnly && (
                                  <select
                                    aria-label={`Move ${request.id} to another drawer`}
                                    className="cabinet-drawer-move-select"
                                    value={
                                      request.fileLocation || UNFILED_LOCATION
                                    }
                                    onChange={(event) =>
                                      onUpdateFileLocation?.(
                                        request.id,
                                        event.target.value,
                                      )
                                    }
                                  >
                                    <option value={UNFILED_LOCATION}>
                                      {UNFILED_LOCATION}
                                    </option>
                                    {cabinetGroups.map((g) => (
                                      <optgroup
                                        key={g.id}
                                        label={`${g.title} (${g.owner})`}
                                      >
                                        {g.drawers.map((d) => (
                                          <option key={d.id} value={d.id}>
                                            {d.id}
                                          </option>
                                        ))}
                                      </optgroup>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="cabinet-drawer-empty">Empty drawer</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default TransactionCabinets;
