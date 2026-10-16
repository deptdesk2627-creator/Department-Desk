import "./TransactionList.css";
import TransactionKanban from "./TransactionKanban";
import TransactionTable from "./TransactionTable";

function TransactionList({
  requests,
  totalRequests,
  activeFilter,
  setActiveFilter,
  filters,
  requestSearch,
  setRequestSearch,
  view,
  setView,
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
  readOnly = false,
}) {
  return (
    <section
      className="card panel module-list-panel request-tracker-panel"
      aria-labelledby="transactions-list-title"
    >
      <div className="request-toolbar">
        <div className="request-toolbar-heading">
          <div>
            <h2 id="transactions-list-title">
              Requests <span className="count-badge">{requests.length}</span>
            </h2>
            <p>Search, filter, and review submitted requests.</p>
          </div>
        </div>
        <div className="request-controls">
          <div className="request-filter-list" role="group" aria-label="Filter requests">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`request-filter${activeFilter === filter ? " is-active" : ""}`}
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="request-display-controls">
            <label className="request-search">
              <span className="request-search-icon" aria-hidden="true">⌕</span>
              <input
                type="search"
                aria-label="Search requests"
                placeholder="Search requests..."
                value={requestSearch}
                onChange={(event) => setRequestSearch(event.target.value)}
              />
            </label>
            <div className="request-view-toggle" role="group" aria-label="Request display">
              <button
                type="button"
                className={view === "table" ? "is-active" : ""}
                aria-pressed={view === "table"}
                onClick={() => setView("table")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
                  <path d="M3.5 9.5h17M9 9.5v10M15 9.5v10" />
                </svg>
                Table View
              </button>
              <button
                type="button"
                className={view === "board" ? "is-active" : ""}
                aria-pressed={view === "board"}
                onClick={() => setView("board")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
                  <path d="M9 5v14M15 5v14" />
                </svg>
                Kanban View
              </button>
            </div>
          </div>
        </div>
      </div>
      {requests.length ? (
        view === "table" ? (
          <TransactionTable
            requests={requests}
            statuses={statuses}
            statusClass={statusClass}
            getRequestStatus={getRequestStatus}
            requestName={requestName}
            requestOffice={requestOffice}
            requestCategory={requestCategory}
            formatDate={formatDate}
            onUpdateStatus={onUpdateStatus}
            onSelect={onSelect}
            onExport={onExport}
            onDelete={onDelete}
            readOnly={readOnly}
          />
        ) : (
          <TransactionKanban
            requests={requests}
            statuses={statuses}
            statusClass={statusClass}
            getRequestStatus={getRequestStatus}
            requestName={requestName}
            requestOffice={requestOffice}
            formatDate={formatDate}
            onSelect={onSelect}
          />
        )
      ) : (
        <p className="request-empty-state">
          {totalRequests
            ? "No requests match the selected filters."
            : "No requests yet. Add one above to get started."}
        </p>
      )}
    </section>
  );
}

export default TransactionList;
