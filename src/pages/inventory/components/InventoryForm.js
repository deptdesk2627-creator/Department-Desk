import { Modal } from "../../../components/ui";
import { PRODUCT_USAGE_TYPES } from "../../../utils/inventory";

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
      subtitle="Product ID is generated automatically. Choose whether the item is usable only or borrowable and returnable."
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
            placeholder="e.g. Bond paper or Keyboard"
          />
        </label>
        <label>
          Product rule
          <select
            value={form.usageType || "Usable"}
            onChange={(event) =>
              setForm({ ...form, usageType: event.target.value })
            }
          >
            {PRODUCT_USAGE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
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
