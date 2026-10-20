import { Modal } from "../../../components/ui";

const PERSON_LABEL = {
  Borrow: "Borrowed by",
  Return: "Returned by",
  Use: "Used by",
};

function StockActionModal({
  action,
  personName = "",
  setPersonName,
  quantity,
  setQuantity,
  error,
  getBorrowedBalance,
  onSubmit,
  onClose,
}) {
  if (!action) return null;

  return (
    <Modal
      isOpen={Boolean(action)}
      onClose={onClose}
      eyebrow={action.item.productId || action.item.id}
      title={`${action.type} product`}
      titleId="stock-action-title"
    >
      <p className="action-product-name">
        {action.item.name}{" "}
        <span>
          · {action.item.quantity} {action.item.unit} available
        </span>
      </p>
      <form className="module-form action-form" onSubmit={onSubmit}>
        <label>
          {PERSON_LABEL[action.type] || "Name"}
          <input
            autoFocus
            required
            type="text"
            placeholder="Enter name (e.g. Prof. Juan Dela Cruz)"
            value={personName}
            onChange={(event) => setPersonName?.(event.target.value)}
          />
        </label>
        <label>
          Quantity ({action.item.unit})
          <input
            required
            type="number"
            min="1"
            step="1"
            max={
              action.type === "Return"
                ? getBorrowedBalance(action.item)
                : action.item.quantity
            }
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <div className="form-actions">
          <button className="primary-button" type="submit">
            Record {action.type.toLowerCase()}
          </button>
        </div>
      </form>
      {error && (
        <p className="empty-state" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}

export default StockActionModal;
