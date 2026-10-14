function InventoryForm({ form, setForm, formError, onSubmit }) {
  return (
    <section
      className="card panel module-form-panel"
      aria-labelledby="new-supply-title"
    >
      <div className="panel-heading">
        <div>
          <h2 id="new-supply-title">Add a product</h2>
          <p>Product ID is generated automatically when you add the item.</p>
        </div>
      </div>
      <form className="module-form inventory-form" onSubmit={onSubmit}>
        <label>
          Product name
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="e.g. Printer paper"
          />
        </label>
        <label>
          Starting quantity
          <input
            required
            min="0"
            step="1"
            type="number"
            value={form.quantity}
            onChange={(event) =>
              setForm({ ...form, quantity: event.target.value })
            }
          />
        </label>
        <label>
          Unit
          <input
            required
            value={form.unit}
            onChange={(event) => setForm({ ...form, unit: event.target.value })}
            placeholder="pcs, boxes, reams..."
          />
        </label>
        <label>
          Low-stock level
          <input
            required
            min="0"
            step="1"
            type="number"
            value={form.lowStockAt}
            onChange={(event) =>
              setForm({ ...form, lowStockAt: event.target.value })
            }
          />
        </label>
        <label>
          Cost per unit (₱)
          <input
            min="0"
            step="0.01"
            type="number"
            value={form.unitCost}
            onChange={(event) =>
              setForm({ ...form, unitCost: event.target.value })
            }
            placeholder="Optional"
          />
        </label>
        <div className="form-actions">
          <button className="primary-button" type="submit">
            ＋ Add product
          </button>
        </div>
      </form>
      {formError && (
        <p className="empty-state" role="alert">
          {formError}
        </p>
      )}
    </section>
  );
}

export default InventoryForm;
