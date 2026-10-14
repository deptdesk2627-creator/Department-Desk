import { useEffect, useMemo, useState } from "react";
import "./styles/Transactions.css";
import { getRequestStatus } from "../../utils/requestStatus";

const statuses = ["Pending", "Under Review", "Action Needed", "Approved", "Archived"];
const filters = ["All Requests", ...statuses];
const offices = ["Registrar", "Office of the President", "Dean's Office", "Secretary's Office", "Finance Office", "Facilities Office", "HR Office", "Other"];
const categories = ["Document", "Request"];
function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function statusClass(status) {
    return `status-${getRequestStatus(status).toLowerCase().replaceAll(" ", "-")}`;
}

function requestName(request) {
    return request.document || request.description || "Untitled request";
}

function requestOffice(request) {
    return request.office || request.location || "—";
}

function requestCategory(request) {
    return request.category || request.type || "Request";
}

function csvValue(value) {
    return `"${String(value || "").replaceAll('"', '""')}"`;
}

function Transactions({
    requests = [],
    setRequests = () => { throw new Error("Transactions requires a setRequests callback."); },
    search = "",
}) {
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [activeFilter, setActiveFilter] = useState("All Requests");
    const [requestSearch, setRequestSearch] = useState("");
    const [formError, setFormError] = useState("");
    const [view, setView] = useState("table");
    const [form, setForm] = useState({
        dateTime: new Date().toISOString().slice(0, 16),
        description: "",
        document: "",
        student: "",
        office: "Registrar",
        type: "Document",
        status: "Pending",
    });

    useEffect(() => {
        if (!selectedTransaction) return undefined;
        function closeOnEscape(event) {
            if (event.key === "Escape") setSelectedTransaction(null);
        }
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [selectedTransaction]);

    const visibleRequests = useMemo(() => {
        const globalQuery = String(search || "").trim().toLowerCase();
        const localQuery = requestSearch.trim().toLowerCase();
        const requestItems = Array.isArray(requests) ? requests.filter(Boolean) : [];
        return requestItems.filter((request) => {
            const normalizedStatus = getRequestStatus(request.status);
            const matchesFilter = activeFilter === "All Requests" || normalizedStatus === activeFilter;
            const searchableValues = [
                request.id,
                request.student,
                requestName(request),
                request.description,
                request.notes,
                requestOffice(request),
                requestCategory(request),
                normalizedStatus,
                request.dateTime,
            ].map((value) => String(value || "").toLowerCase());
            const matchesGlobalSearch = !globalQuery || searchableValues.some((value) => value.includes(globalQuery));
            const matchesLocalSearch = !localQuery || searchableValues.some((value) => value.includes(localQuery));
            const matchesSearch = matchesGlobalSearch && matchesLocalSearch;
            return matchesFilter && matchesSearch;
        });
    }, [requests, search, requestSearch, activeFilter]);

    function addRequest(event) {
        event.preventDefault();
        if (!form.student.trim() || !form.document.trim()) {
            setFormError("Enter a requester and form name before adding the request.");
            return;
        }
        setFormError("");
        const submittedAt = Date.now();
        const request = {
            ...form,
            id: `REQ-${new Date(submittedAt).getFullYear()}-${submittedAt.toString().slice(-6)}`,
            location: form.office,
            notes: form.description,
            history: [{ status: getRequestStatus(form.status), location: form.office, dateTime: new Date().toISOString() }],
        };
        setRequests((current) => {
            const currentRequests = Array.isArray(current) ? current : [];
            const baseId = request.id;
            let id = baseId;
            let suffix = 1;
            while (currentRequests.some((item) => item?.id === id)) {
                id = `${baseId}-${suffix}`;
                suffix += 1;
            }
            return [{ ...request, id }, ...currentRequests];
        });
        setForm({
            dateTime: new Date().toISOString().slice(0, 16),
            description: "",
            document: "",
            student: "",
            office: "Registrar",
            type: "Document",
            status: "Pending",
        });
    }

    function updateRequestStatus(request, status) {
        const nextStatus = getRequestStatus(status);
        const nextLocation = request.office || request.location || "—";
        const history = Array.isArray(request.history) ? [...request.history] : [];
        const lastEntry = history[history.length - 1];

        if (!lastEntry || lastEntry.status !== nextStatus || lastEntry.location !== nextLocation) {
            history.push({ status: nextStatus, location: nextLocation, dateTime: new Date().toISOString() });
        }

        return {
            ...request,
            status: nextStatus,
            office: nextLocation,
            location: nextLocation,
            history,
        };
    }

    function updateStatus(id, status) {
        setRequests((current) => (Array.isArray(current) ? current : []).map((request) => request?.id === id ? updateRequestStatus(request, status) : request));
        setSelectedTransaction((current) => current?.id === id ? updateRequestStatus(current, status) : current);
    }

    function deleteRequest(id) {
        setRequests((current) => (Array.isArray(current) ? current : []).filter((request) => request?.id !== id));
        if (selectedTransaction?.id === id) setSelectedTransaction(null);
    }

    function exportRequest(request) {
        const headings = ["Request ID", "Form Name", "Requested By", "Office", "Date Submitted", "Category", "Status", "Request Notes"];
        const values = [
            request.id,
            requestName(request),
            request.student,
            requestOffice(request),
            formatDateTime(request.dateTime),
            requestCategory(request),
            getRequestStatus(request.status),
            request.notes || request.description,
        ];
        const blob = new Blob([[headings, values].map((row) => row.map(csvValue).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${String(request.id || "request").replace(/[^a-z0-9-_]/gi, "_")}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    const requestTrail = selectedTransaction
        ? [
            { title: "Form Submitted", dateTime: selectedTransaction.dateTime },
            ...(Array.isArray(selectedTransaction.history) ? selectedTransaction.history.filter(Boolean) : []).map((item) => ({
                title: getRequestStatus(item.status),
                dateTime: item.dateTime,
                office: item.location,
            })),
        ]
        : [];

    return (
        <div className="dashboard module-page transactions-page">
            <section className="page-heading">
                <div><p className="eyebrow">OFFICE WORKSPACE · REQUESTS</p><h1>Request tracker</h1><p className="page-subtitle">Follow every request from submission through approval.</p></div>
            </section>

            <section className="card panel module-form-panel" aria-labelledby="new-transaction-title">
                <div className="panel-heading"><div><h2 id="new-transaction-title">Add a request</h2><p>Log a document or request and its destination office.</p></div></div>
                <form className="module-form transaction-form" onSubmit={addRequest}>
                    <label>Date and time<input required type="datetime-local" value={form.dateTime} onChange={(event) => setForm({ ...form, dateTime: event.target.value })} /></label>
                    <label>Requested by<input required value={form.student} onChange={(event) => { setForm({ ...form, student: event.target.value }); setFormError(""); }} placeholder="Student or staff name" /></label>
                    <label>Office<select required value={form.office} onChange={(event) => setForm({ ...form, office: event.target.value })}>{offices.map((office) => <option key={office} value={office}>{office}</option>)}</select></label>
                    <label>Category<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                    <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                    <label className="transaction-form-name">Form name<input required value={form.document} onChange={(event) => { setForm({ ...form, document: event.target.value }); setFormError(""); }} placeholder="Name of the form or request" /></label>
                    <label className="transaction-description">Request notes<textarea rows="2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add details or purpose (optional)" /></label>
                    <div className="transaction-form-actions"><button className="primary-button" type="submit">＋ Add request</button></div>
                </form>
                {formError && <p className="empty-state" role="alert">{formError}</p>}
            </section>

            <section className="card panel module-list-panel request-tracker-panel" aria-labelledby="transactions-list-title">
                <div className="request-toolbar">
                    <div className="request-toolbar-heading">
                        <div><h2 id="transactions-list-title">Requests <span className="count-badge">{visibleRequests.length}</span></h2><p>Search, filter, and review submitted requests.</p></div>
                    </div>
                    <div className="request-controls">
                        <div className="request-filter-list" role="group" aria-label="Filter requests">
                            {filters.map((filter) => <button key={filter} type="button" className={`request-filter${activeFilter === filter ? " is-active" : ""}`} aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)}>{filter}</button>)}
                        </div>
                        <div className="request-display-controls">
                            <label className="request-search">
                                <span className="request-search-icon" aria-hidden="true">⌕</span>
                                <input type="search" aria-label="Search requests" placeholder="Search requests..." value={requestSearch} onChange={(event) => setRequestSearch(event.target.value)} />
                            </label>
                            <div className="request-view-toggle" role="group" aria-label="Request display">
                                <button type="button" className={view === "table" ? "is-active" : ""} aria-pressed={view === "table"} onClick={() => setView("table")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><path d="M3.5 9.5h17M9 9.5v10M15 9.5v10" /></svg> Table View</button>
                                <button type="button" className={view === "board" ? "is-active" : ""} aria-pressed={view === "board"} onClick={() => setView("board")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><path d="M9 5v14M15 5v14" /></svg> Kanban View</button>
                            </div>
                        </div>
                    </div>
                </div>

                {visibleRequests.length ? view === "table" ? <div className="request-table-wrap">
                    <table className="request-tracker-table">
                        <thead><tr><th>Request ID</th><th>Form name</th><th>Office</th><th>Date submitted</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>{visibleRequests.map((request) => (
                            <tr key={request.id}>
                                <td><span className="request-id-badge">{request.id}</span></td>
                                <td className="request-name-cell"><strong>{requestName(request)}</strong><span>{request.student || "Requester not specified"}</span></td>
                                <td>{requestOffice(request)}</td>
                                <td>{formatDate(request.dateTime)}</td>
                                <td><span className="request-category">{requestCategory(request)}</span></td>
                                <td><select aria-label={`Status for ${request.id}`} className={`request-status-select ${statusClass(request.status)}`} value={getRequestStatus(request.status)} onChange={(event) => updateStatus(request.id, event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td>
                                <td><div className="request-actions">
                                    <button type="button" className="request-icon-button" aria-label={`View details for ${request.id}`} title="View details" onClick={() => setSelectedTransaction(request)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg></button>
                                    <button type="button" className="request-icon-button" aria-label={`Export ${request.id}`} title="Export request" onClick={() => exportRequest(request)}><span aria-hidden="true">⇩</span></button>
                                    <button type="button" className="request-icon-button request-delete-button" aria-label={`Delete ${request.id}`} title="Delete request" onClick={() => deleteRequest(request.id)}><span aria-hidden="true">×</span></button>
                                </div></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div> : <div className="request-kanban">
                    {statuses.map((status) => {
                        const statusRequests = visibleRequests.filter((request) => getRequestStatus(request.status) === status);
                        return <section className="request-kanban-column" key={status} aria-label={`${status} requests`}>
                            <div className="request-kanban-heading"><h3><span className={`request-status-dot ${statusClass(status)}`} />{status}</h3><span>{statusRequests.length}</span></div>
                            <div className="request-kanban-cards">
                                {statusRequests.map((request) => <article className="request-kanban-card" key={request.id}>
                                    <div className="request-kanban-card-top"><span className="request-id-badge">{request.id}</span><button type="button" className="request-icon-button" aria-label={`View details for ${request.id}`} onClick={() => setSelectedTransaction(request)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg></button></div>
                                    <h4>{requestName(request)}</h4>
                                    <p>{requestOffice(request)}</p>
                                    <div className="request-kanban-card-footer"><span>{request.student || "Requester not specified"}</span><time>{formatDate(request.dateTime)}</time></div>
                                </article>)}
                                {!statusRequests.length && <p className="request-column-empty">No requests</p>}
                            </div>
                        </section>;
                    })}
                </div> : <p className="request-empty-state">{Array.isArray(requests) && requests.length ? "No requests match the selected filters." : "No requests yet. Add one above to get started."}</p>}
            </section>

            {selectedTransaction && <div className="request-drawer-overlay">
                <button className="request-drawer-backdrop" type="button" aria-label="Close request details" onClick={() => setSelectedTransaction(null)} />
                <aside className="request-drawer" role="dialog" aria-modal="true" aria-labelledby="request-drawer-title" tabIndex="-1">
                    <div className="request-drawer-header">
                        <div><span className="request-id-badge">{selectedTransaction.id}</span><h2 id="request-drawer-title">{requestName(selectedTransaction)}</h2><span className={`request-status-badge ${statusClass(selectedTransaction.status)}`}>{getRequestStatus(selectedTransaction.status)}</span></div>
                        <button type="button" className="request-drawer-close" aria-label="Close request details" onClick={() => setSelectedTransaction(null)}>×</button>
                    </div>
                    <div className="request-drawer-actions"><button type="button" className="request-pdf-button" onClick={() => window.print()}><span aria-hidden="true">⇩</span> Download PDF</button></div>
                    <section className="request-drawer-section" aria-labelledby="request-summary-heading">
                        <h3 id="request-summary-heading">Request summary</h3>
                        <dl className="request-summary-grid">
                            <div><dt>Requested by</dt><dd>{selectedTransaction.student || "—"}</dd></div>
                            <div><dt>Office</dt><dd>{requestOffice(selectedTransaction)}</dd></div>
                            <div><dt>Submitted date</dt><dd>{formatDateTime(selectedTransaction.dateTime)}</dd></div>
                            <div><dt>Category</dt><dd>{requestCategory(selectedTransaction)}</dd></div>
                        </dl>
                    </section>
                    <section className="request-notes-box"><h3>Request notes</h3><p>{selectedTransaction.notes || selectedTransaction.description || "No request notes provided."}</p></section>
                    <section className="request-drawer-section request-trail-section" aria-labelledby="request-trail-heading">
                        <h3 id="request-trail-heading">Approval trail</h3>
                        <ol className="request-timeline">
                            {requestTrail.map((item, index) => <li key={`${item.title}-${item.dateTime || index}`} className={index === requestTrail.length - 1 ? "is-current" : ""}>
                                <span className="request-timeline-marker" />
                                <div><strong>{item.title}</strong>{item.office && <span>{item.office}</span>}{item.dateTime && <time>{formatDateTime(item.dateTime)}</time>}</div>
                            </li>)}
                            {!requestTrail.length && <li className="is-current"><span className="request-timeline-marker" /><div><strong>Form Submitted</strong></div></li>}
                        </ol>
                    </section>
                </aside>
            </div>}
        </div>
    );
}

export default Transactions;
