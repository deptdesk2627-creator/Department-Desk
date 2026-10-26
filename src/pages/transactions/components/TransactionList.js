import "./TransactionList.css";
import TransactionKanban from "./TransactionKanban";
import TransactionTable from "./TransactionTable";

function TransactionList({
  activeTab = "outgoing",
  requests,
  totalRequests,
  activeFilter,
  setActiveFilter,
  filters,
  officeFilter = "All Offices",
  setOfficeFilter = () => {},
  offices = [],
  categoryFilter = "All Categories",
  setCategoryFilter = () => {},
  categories = [],
  hasActiveFilters = false,
  onResetFilters = () => {},
  requestSearch,
  setRequestSearch,
  view,
  setView,
  statuses,
  signatureOptions = [],
  forwardedDestinations = [],
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
    <section
      className={`card panel module-list-panel request-tracker-panel transactions-folder-panel ${
        isIncoming
          ? "transactions-folder-panel--incoming"
          : "transactions-folder-panel--outgoing"
      }`}
      aria-labelledby="transactions-list-title"
    >
      <div className="request-toolbar">
        <div className="request-toolbar-heading">
          <div>
            <h2 id="transactions-list-title">
              {isIncoming ? "Incoming Documents & Requests" : "Outgoing Requests"}{" "}
              <span className="count-badge">{requests.length}</span>
            </h2>
            <p>
              {isIncoming
                ? "Track documents from other offices, record if signed by our office, and log where they are sent out."
                : "Search, filter, and review submitted outgoing requests."}
            </p>
          </div>
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
                placeholder={
                  isIncoming
                    ? "Search incoming documents, sender, office..."
                    : "Search requests..."
                }
                value={requestSearch}
                onChange={(event) => setRequestSearch(event.target.value)}
              />
            </label>
            <div className="request-filter-dropdowns">
              <select
                className="request-filter-select"
                value={officeFilter}
                onChange={(event) => setOfficeFilter(event.target.value)}
                aria-label="Filter by office"
              >
                <option value="All Offices">All offices</option>
                {offices.map((office) => (
                  <option key={office} value={office}>
                    {office}
                  </option>
                ))}
              </select>
              <select
                className="request-filter-select"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter by category"
              >
                <option value="All Categories">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="request-filter-reset-btn"
                  onClick={onResetFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {requests.length ? (
        view === "table" ? (
          <TransactionTable
            activeTab={activeTab}
            requests={requests}
            statuses={statuses}
            signatureOptions={signatureOptions}
            forwardedDestinations={forwardedDestinations}
            statusClass={statusClass}
            getRequestStatus={getRequestStatus}
            requestName={requestName}
            requestOffice={requestOffice}
            requestCategory={requestCategory}
            formatDate={formatDate}
            onUpdateStatus={onUpdateStatus}
            onUpdateIncoming={onUpdateIncoming}
            onSelect={onSelect}
            onExport={onExport}
            onDelete={onDelete}
            readOnly={readOnly}
          />
        ) : (
          <TransactionKanban
            activeTab={activeTab}
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
            ? "No items match the selected filters."
            : isIncoming
              ? "No incoming documents yet. Click '＋ Log incoming' above to track documents from other offices."
              : "No outgoing requests yet. Click '＋ New request' above to get started."}
        </p>
      )}
    </section>
  );
}

export default TransactionList;
