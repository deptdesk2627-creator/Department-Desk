import { useMemo, useState } from "react";
import "./styles/Inventory.css";

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function getProductId(item) {
    if (item.productId) return item.productId;
    const legacyNumber = Number(String(item.id).match(/(\d+)$/)?.[1]);
    return `PRD-${String(legacyNumber || 0).padStart(4, "0")}`;
}

function Inventory({
    inventory = [],
    setInventory = () => { throw new Error("Inventory requires a setInventory callback."); },
    records = [],
    setRecords = () => { throw new Error("Inventory requires a setRecords callback."); },
    search = "",
}) {
    const [form, setForm] = useState({ name: "", quantity: "", unit: "units", lowStockAt: "2", unitCost: "" });
    const [action, setAction] = useState(null);
    const [actionQuantity, setActionQuantity] = useState("1");
    const [formError, setFormError] = useState("");
    const [actionError, setActionError] = useState("");
    const [recordFilter, setRecordFilter] = useState("All");
    const inventoryItems = useMemo(
        () => Array.isArray(inventory) ? inventory.filter(Boolean) : [],
        [inventory],
    );
    const recordItems = useMemo(
        () => Array.isArray(records) ? records.filter(Boolean) : [],
        [records],
    );
    const visibleItems = useMemo(() => {
        const query = String(search || "").trim().toLowerCase();
        if (!query) return inventoryItems;
        return inventoryItems.filter((item) =>
            [item.productId, item.id, item.name, item.unit, item.quantity, item.lowStockAt].some((value) => String(value || "").toLowerCase().includes(query))
        );
    }, [inventoryItems, search]);
    const visibleRecords = useMemo(() => {
        const query = String(search || "").trim().toLowerCase();
        return recordItems.filter((record) => {
            const matchesFilter = recordFilter === "All" || record.status === recordFilter;
            const matchesQuery = !query || [record.id, record.productId, record.productName, record.status, record.unit, record.quantity, record.dateTime]
                .some((value) => String(value || "").toLowerCase().includes(query));
            return matchesFilter && matchesQuery;
        });
    }, [recordItems, search, recordFilter]);
    const loggedUsageValue = recordItems.filter((record) => record.status === "Used")
        .reduce((total, record) => {
            const quantity = Number(record.quantity);
            const parsedUnitCost = Number(record.unitCost);
            const unitCost = Number.isFinite(parsedUnitCost) ? parsedUnitCost : 0;
            return Number.isFinite(quantity) ? total + quantity * unitCost : total;
        }, 0);
    const lowStockCount = inventoryItems.filter((item) =>
        Number.isFinite(Number(item.quantity)) && Number(item.quantity) <= Number(item.lowStockAt || 0)
    ).length;

    function addItem(event) {
        event.preventDefault();
        const quantity = Number(form.quantity);
        const lowStockAt = Number(form.lowStockAt);
        const unitCost = form.unitCost === "" ? 0 : Number(form.unitCost);
        if (!form.name.trim() || !form.unit.trim() || !Number.isInteger(quantity) || quantity < 0 ||
            !Number.isInteger(lowStockAt) || lowStockAt < 0 || !Number.isFinite(unitCost) || unitCost < 0) {
            setFormError("Enter a product name, unit, and valid non-negative stock and cost values.");
            return;
        }
        setFormError("");
        setInventory((current) => {
            const currentItems = Array.isArray(current) ? current.filter(Boolean) : [];
            const nextProductNumber = currentItems.reduce((highest, item) => {
                const productNumber = Number(getProductId(item).match(/(\d+)$/)?.[1]) || 0;
                return Math.max(highest, productNumber);
            }, 0) + 1;
            return [{
                ...form,
                name: form.name.trim(),
                unit: form.unit.trim(),
                id: `supply-${nextProductNumber}`,
                productId: `PRD-${String(nextProductNumber).padStart(4, "0")}`,
                quantity,
                lowStockAt,
                unitCost,
                usedThisYear: 0,
            }, ...currentItems];
        });
        setForm({ name: "", quantity: "", unit: "units", lowStockAt: "2", unitCost: "" });
    }

    function openAction(item, type) {
        setAction({ item, type });
        setActionQuantity("1");
        setActionError("");
    }

    function getBorrowedBalance(item) {
        const productId = getProductId(item);
        return recordItems.reduce((balance, record) => {
            if (record.productId !== productId) return balance;
            const quantity = Number(record.quantity);
            if (!Number.isFinite(quantity)) return balance;
            if (record.status === "Borrowed") return balance + quantity;
            if (record.status === "Returned") return balance - quantity;
            return balance;
        }, 0);
    }

    function submitAction(event) {
        event.preventDefault();
        if (!action) return;
        const quantity = Number(actionQuantity);
        const item = inventoryItems.find((stock) => stock.id === action.item.id) || action.item;
        if (!Number.isInteger(quantity) || quantity <= 0) {
            setActionError("Enter a whole-number quantity greater than zero.");
            return;
        }
        if (action.type !== "Return" && quantity > Number(item.quantity)) {
            setActionError("The quantity cannot exceed the available stock.");
            return;
        }
        if (action.type === "Return" && quantity > getBorrowedBalance(item)) {
            setActionError("The return quantity cannot exceed the borrowed balance.");
            return;
        }
        setActionError("");
        const productId = getProductId(item);
        const record = {
            id: `REC-${Date.now()}-${recordItems.length + 1}`,
            dateTime: new Date().toISOString(),
            productId,
            productName: item.name,
            quantity,
            unit: item.unit,
            status: action.type === "Borrow" ? "Borrowed" : action.type === "Return" ? "Returned" : "Used",
            unitCost: Number(item.unitCost) || 0,
        };

        setInventory((current) => (Array.isArray(current) ? current : []).map((stock) => stock?.id === item.id ? {
            ...stock,
            productId,
            quantity: Number(stock.quantity) + (action.type === "Return" ? quantity : -quantity),
            usedThisYear: Number(stock.usedThisYear || 0) + (action.type === "Use" ? quantity : 0),
        } : stock));
        setRecords((current) => [record, ...(Array.isArray(current) ? current : [])]);
        setAction(null);
    }

    return (
        <div className="dashboard module-page">
            <section className="page-heading">
                <div><p className="eyebrow">OFFICE WORKSPACE · SUPPLY &amp; INVENTORY</p><h1>Supply &amp; inventory</h1><p className="page-subtitle">Track products, record borrowing and use, and keep a history of returns.</p></div>
            </section>

            <section className="metrics-grid inventory-metrics" aria-label="Inventory summary">
                <article className="card metric-card"><div className="metric-top"><span>Tracked products</span><span className="metric-icon">▤</span></div><p className="metric-value">{inventoryItems.length}</p><p className="metric-foot">Products in the office</p></article>
                <article className="card metric-card"><div className="metric-top"><span>Low stock</span><span className="metric-icon orange">!</span></div><p className="metric-value">{lowStockCount}</p><p className="metric-foot">At or below reorder level</p></article>
                <article className="card metric-card"><div className="metric-top"><span>Recorded usage value</span><span className="metric-icon green">₱</span></div><p className="metric-value inventory-cost">₱{loggedUsageValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="metric-foot">Estimated cost of logged usage</p></article>
                <article className="card metric-card"><div className="metric-top"><span>Transaction records</span><span className="metric-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3.75h8l4 4v12.5H6z" /><path d="M14 3.75v4h4M9 12h6M9 15.5h6" /></svg></span></div><p className="metric-value">{recordItems.length}</p><p className="metric-foot">Borrow, use, and return history</p></article>
            </section>

            <section className="card panel module-form-panel" aria-labelledby="new-supply-title">
                <div className="panel-heading"><div><h2 id="new-supply-title">Add a product</h2><p>Product ID is generated automatically when you add the item.</p></div></div>
                <form className="module-form inventory-form" onSubmit={addItem}>
                    <label>Product name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Printer paper" /></label>
                    <label>Starting quantity<input required min="0" step="1" type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label>
                    <label>Unit<input required value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="pcs, boxes, reams..." /></label>
                    <label>Low-stock level<input required min="0" step="1" type="number" value={form.lowStockAt} onChange={(event) => setForm({ ...form, lowStockAt: event.target.value })} /></label>
                    <label>Cost per unit (₱)<input min="0" step="0.01" type="number" value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: event.target.value })} placeholder="Optional" /></label>
                    <div className="form-actions"><button className="primary-button" type="submit">＋ Add product</button></div>
                </form>
                {formError && <p className="empty-state" role="alert">{formError}</p>}
            </section>

            <section className="card panel module-list-panel" aria-labelledby="inventory-list-title">
                <div className="panel-heading"><div><h2 id="inventory-list-title">Inventory <span className="count-badge">{visibleItems.length}</span></h2><p>Borrowing and use reduce available quantity; returns add it back.</p></div></div>
                {visibleItems.length ? <div className="table-scroll module-table-scroll">
                    <table className="request-table inventory-table">
                        <thead><tr><th>Product-ID No.</th><th>Product name</th><th>Quantity</th><th>Stock level</th><th>Actions</th></tr></thead>
                        <tbody>{visibleItems.map((item) => {
                            const lowStock = Number(item.quantity) <= Number(item.lowStockAt);
                            return <tr key={item.id}>
                                <td><strong>{getProductId(item)}</strong></td>
                                <td>{item.name}</td>
                                <td><strong>{item.quantity} {item.unit}</strong></td>
                                <td><span className={`status-pill ${lowStock ? "status-waiting" : "status-done"}`}>{lowStock ? "Low stock" : "In stock"}</span></td>
                                <td><div className="stock-actions"><button type="button" className="stock-adjust-button borrow-button" onClick={() => openAction(item, "Borrow")} disabled={Number(item.quantity) <= 0}>Borrow</button><button type="button" className="stock-adjust-button use-button" onClick={() => openAction(item, "Use")} disabled={Number(item.quantity) <= 0}>Use</button><button type="button" className="stock-adjust-button" onClick={() => openAction(item, "Return")} disabled={getBorrowedBalance(item) <= 0}>Return</button><button className="delete-button" type="button" onClick={() => setInventory((current) => (Array.isArray(current) ? current : []).filter((stock) => stock?.id !== item.id))} aria-label={`Delete ${item.name}`}>×</button></div></td>
                            </tr>;
                        })}</tbody>
                    </table>
                </div> : <p className="empty-state">{inventoryItems.length ? "No products match your search." : "No products yet. Add one above to start tracking inventory."}</p>}
            </section>

            <section className="card panel module-list-panel" aria-labelledby="records-title">
                <div className="module-toolbar">
                    <div><h2 id="records-title">Transaction records <span className="count-badge">{visibleRecords.length}</span></h2><p>History of borrowed, used, and returned products.</p></div>
                    <label className="record-filter">Filter status<select value={recordFilter} onChange={(event) => setRecordFilter(event.target.value)}><option>All</option><option>Borrowed</option><option>Returned</option><option>Used</option></select></label>
                </div>
                {visibleRecords.length ? <div className="table-scroll module-table-scroll">
                    <table className="request-table inventory-record-table">
                        <thead><tr><th>ID No.</th><th>Date &amp; time</th><th>Product-ID No.</th><th>Product name</th><th>Quantity</th><th>Status</th></tr></thead>
                        <tbody>{visibleRecords.map((record) => <tr key={record.id}>
                            <td><strong>{record.id}</strong></td><td>{formatDateTime(record.dateTime)}</td><td>{record.productId}</td><td>{record.productName}</td><td>{record.quantity} {record.unit}</td>
                            <td><span className={`status-pill ${record.status === "Returned" ? "status-done" : record.status === "Borrowed" ? "status-waiting" : "status-started"}`}>{record.status}</span></td>
                        </tr>)}</tbody>
                    </table>
                </div> : <p className="empty-state">{recordItems.length ? "No records match this filter or search." : "No inventory transactions yet. Borrow, use, or return an item to create a record."}</p>}
            </section>

            {action && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAction(null); }}>
                <section className="transaction-modal action-modal" role="dialog" aria-modal="true" aria-labelledby="stock-action-title">
                    <div className="modal-heading"><div><p className="eyebrow">{action.item.productId || action.item.id}</p><h2 id="stock-action-title">{action.type} product</h2></div><button className="delete-button modal-close" type="button" onClick={() => setAction(null)} aria-label="Close">×</button></div>
                    <p className="action-product-name">{action.item.name} <span>· {action.item.quantity} {action.item.unit} available</span></p>
                    <form className="module-form action-form" onSubmit={submitAction}>
                        <label>Quantity ({action.item.unit})<input autoFocus required type="number" min="1" step="1" max={action.type === "Return" ? getBorrowedBalance(action.item) : action.item.quantity} value={actionQuantity} onChange={(event) => setActionQuantity(event.target.value)} /></label>
                        <div className="form-actions"><button className="primary-button" type="submit">Record {action.type.toLowerCase()}</button></div>
                    </form>
                    {actionError && <p className="empty-state" role="alert">{actionError}</p>}
                </section>
            </div>}
        </div>
    );
}

export default Inventory;
