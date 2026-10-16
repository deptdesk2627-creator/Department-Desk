import "./HeaderSearch.css";

function HeaderSearch({
  isOpen,
  onClose,
  onNavigate,
  onSearchChange,
  results,
  search,
  searchInputRef,
  searchRef,
}) {
  return (
    <div className="app-header__search-container" ref={searchRef}>
      <label className="app-header__search">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input
          id="global-search"
          ref={searchInputRef}
          type="search"
          aria-label="Search documents, tasks, and inventory"
          aria-keyshortcuts="Control+K Meta+K"
          aria-controls="search-results-dropdown"
          placeholder="Search documents, tasks, inventory..."
          value={search}
          onFocus={() => onClose(true)}
          onChange={(event) => {
            onClose(true);
            onSearchChange?.(event.target.value);
          }}
        />
      </label>
      {isOpen && (
        <div
          className="search-results-dropdown"
          id="search-results-dropdown"
          role="list"
          aria-label="Search results"
        >
          {results.length ? (
            results.map((result) => (
              <div role="listitem" key={result.id}>
                <button
                  className="search-result-card"
                  type="button"
                  onClick={() => {
                    onClose(false);
                    onNavigate?.(result.page);
                  }}
                >
                  <span className="search-result-card__icon" aria-hidden="true">
                    {result.type === "request" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 3.75h7l4 4v12.5H7z" />
                        <path d="M14 3.75v4h4M10 12h5M10 15.5h5" />
                      </svg>
                    )}
                    {result.type === "task" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="5" width="14" height="16" rx="2" />
                        <path d="M9 5V3.75h6V5M8.5 11h7M8.5 15h7" />
                      </svg>
                    )}
                    {result.type === "inventory" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m4 7 8-4 8 4v10l-8 4-8-4z" />
                        <path d="m4 7 8 4 8-4M12 11v10M8 5l8 4" />
                      </svg>
                    )}
                  </span>
                  <span className="search-result-card__content">
                    <strong>{result.title}</strong>
                    <span>{result.subtitle}</span>
                  </span>
                </button>
              </div>
            ))
          ) : (
            <p className="search-results-dropdown__empty">
              No matching results.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default HeaderSearch;
