import { Modal } from "../../../components/ui";

const PERSON_LABEL = {
  Borrow: "Borrowed by",
  Return: "Returned by",
  Use: "Used by",
};

const REMARKS_LABEL = {
  Borrow: "Remark / Reason for borrowing",
  Use: "Remark / Purpose of use",
  Return: "Condition / Remark on return (optional)",
};

const REMARKS_PLACEHOLDER = {
  Borrow: "e.g. Needed for Room 302 lecture / faculty meeting",
  Use: "e.g. Printing department memo and exam sheets",
  Return: "e.g. Returned in good working condition",
};

function StockActionModal({
  action,
  personName = "",
  setPersonName,
  quantity,
  setQuantity,
  remarks = "",
  setRemarks,
  error,
  getBorrowedBalance,
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
      title={`${action.type} product`}
      titleId="stock-action-title"
    >
      <p className="action-product-name">
        {action.item.name}{" "}
        <span>
          ·{" "}
          {isReturn
            ? `${getBorrowedBalance(action.item)} ${action.item.unit} currently borrowed`
            : `${action.item.quantity} ${action.item.unit} available`}
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
              isReturn
                ? getBorrowedBalance(action.item)
                : action.item.quantity
            }
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <label className="action-form__remarks">
          {REMARKS_LABEL[action.type] || "Remarks"}
          <input
            required={!isReturn}
            type="text"
            placeholder={
              REMARKS_PLACEHOLDER[action.type] || "Enter purpose or remarks"
            }
            value={remarks}
            onChange={(event) => setRemarks?.(event.target.value)}
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

export default StockActionModal;
