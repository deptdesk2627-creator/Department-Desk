function StockActionModal({
  action,
  quantity,
  setQuantity,
  error,
  getBorrowedBalance,
  onSubmit,
  onClose,
}) {
  if (!action) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="transaction-modal action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-action-title"
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{action.item.productId || action.item.id}</p>
            <h2 id="stock-action-title">{action.type} product</h2>
          </div>
          <button
            className="delete-button modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="action-product-name">
          {action.item.name}{" "}
          <span>· {action.item.quantity} {action.item.unit} available</span>
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
      </section>
    </div>
  );
}

export default StockActionModal;
