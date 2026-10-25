import { Modal } from "../../../components/ui";

function InventoryForm({
  isOpen = true,
  form,
  setForm,
  formError,
  onSubmit,
  onCancel,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      eyebrow="OFFICE WORKSPACE · SUPPLY & INVENTORY"
      title="Add a new supply item"
      subtitle="Product ID is generated automatically when you add the item."
      titleId="new-supply-title"
      className="transaction-modal form-modal"
    >
      <form className="module-form inventory-form" onSubmit={onSubmit}>
        <label className="inventory-form-name">
          Product name
          <input
            autoFocus
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
        <div className="inventory-form-actions">
          {onCancel && (
            <button
              className="secondary-button"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
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
    </Modal>
  );
}

export default InventoryForm;
