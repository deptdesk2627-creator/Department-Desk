import { Modal } from "../../../components/ui";

const REMARKS_LABEL = {
  Borrow: "Remark / Reason for borrowing",
  Use: "Remark / Purpose of use",
  Return: "Condition / Remark on return (optional)",
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

  const isReturn = action.type === "Return";

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
          {isReturn
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
        <label className="action-form__remarks">
          {REMARKS_LABEL[action.type]}
          <input
            required={!isReturn}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder={
              isReturn
                ? "e.g. Good condition"
                : "e.g. Midterm exam printing / classroom presentation"
            }
          />
        </label>
        <div className="form-actions action-form__actions">
          <button
            className="secondary-button"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="primary-button" type="submit">
            Record {action.type.toLowerCase()} &amp; view receipt
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
