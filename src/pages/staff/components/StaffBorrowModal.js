import Modal from "../../../components/ui/Modal";

const REMARKS_LABEL = {
  Borrow: "Purpose (optional)",
  Use: "Purpose (optional)",
  Return: "Condition on return (optional)",
};

function StaffBorrowModal({
  action,
  quantity,
  setQuantity,
  remarks,
  setRemarks,
  error,
  maxQuantity,
  onSubmit,
  onClose,
}) {
  if (!action) return null;

  return (
    <Modal
      isOpen={Boolean(action)}
      onClose={onClose}
      eyebrow={action.item.productId || action.item.id}
      title={`${action.type} item`}
      titleId="staff-action-title"
    >
      <p className="action-product-name">
        {action.item.name}{" "}
        <span>
          ·{" "}
          {action.type === "Return"
            ? `${maxQuantity} borrowed by you`
            : `${action.item.quantity} ${action.item.unit} available`}
        </span>
      </p>
      <form className="module-form action-form" onSubmit={onSubmit}>
        <label>
          Quantity ({action.item.unit})
          <input
            autoFocus
            required
            type="number"
            min="1"
            step="1"
            max={maxQuantity}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <label>
          {REMARKS_LABEL[action.type]}
          <input
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder={
              action.type === "Return"
                ? "e.g. Good condition"
                : "e.g. Midterm exam printing"
            }
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

export default StaffBorrowModal;
