import { useMemo, useState } from "react";
import "./StockActionModal.css";
import { Modal } from "../../../components/ui";

const PERSON_LABEL = {
  Borrow: "Borrowed by",
  Return: "Borrowed by (Borrower account)",
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
  Return: "e.g. 15 of 30 returned in good condition",
};

function StockActionModal({
  action,
  personName = "",
  setPersonName,
  returnedBy = "",
  setReturnedBy,
  activeBorrowers = [],
  personOptions = [],
  quantity,
  setQuantity,
  remarks = "",
  setRemarks,
  error,
  getBorrowedBalance,
  lockPersonToOptions = false,
  isSubmitting = false,
  onSubmit,
  onClose,
}) {
  const [isPersonListOpen, setIsPersonListOpen] = useState(false);
  const [activePersonIndex, setActivePersonIndex] = useState(0);
  const isBorrowerSearch =
    action?.type === "Borrow" &&
    !lockPersonToOptions &&
    personOptions.length > 0;
  const filteredPersonOptions = useMemo(() => {
    const query = String(personName || "").trim().toLowerCase();
    return personOptions.filter((person) =>
      String(person.username || "").toLowerCase().includes(query),
    );
  }, [personName, personOptions]);

  if (!action) return null;

  const isReturn = action.type === "Return";
  const matchedBorrower = isReturn
    ? activeBorrowers.find(
        (b) =>
          b.name.toLowerCase() === String(personName || "").trim().toLowerCase(),
      )
    : null;
  const maxReturnQty = isReturn
    ? matchedBorrower
      ? matchedBorrower.balance
      : getBorrowedBalance(action.item)
    : action.item.quantity;
  const selectedPersonIndex = Math.min(
    activePersonIndex,
    filteredPersonOptions.length - 1,
  );

  function handlePersonKeyDown(event) {
    if (event.key === "ArrowDown" && filteredPersonOptions.length > 0) {
      event.preventDefault();
      setIsPersonListOpen(true);
      setActivePersonIndex((index) =>
        Math.min(index + 1, filteredPersonOptions.length - 1),
      );
    } else if (event.key === "ArrowUp" && filteredPersonOptions.length > 0) {
      event.preventDefault();
      setIsPersonListOpen(true);
      setActivePersonIndex((index) => Math.max(index - 1, 0));
    } else if (
      event.key === "Enter" &&
      isPersonListOpen &&
      selectedPersonIndex >= 0
    ) {
      event.preventDefault();
      setPersonName?.(filteredPersonOptions[selectedPersonIndex].username);
      setIsPersonListOpen(false);
    } else if (event.key === "Escape") {
      setIsPersonListOpen(false);
    }
  }

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
            ? `${maxReturnQty} ${action.item.unit} currently borrowed`
            : `${action.item.quantity} ${action.item.unit} available`}
        </span>
      </p>

      {isReturn && activeBorrowers.length > 0 && (
        <div
          className="action-borrower-picks"
          aria-label="Active borrowers for this item"
        >
          <span className="action-borrower-picks__label">
            Active borrower accounts:
          </span>
          <div className="action-borrower-picks__list">
            {activeBorrowers.map((entry) => {
              const isSelected =
                String(personName || "").trim().toLowerCase() ===
                entry.name.toLowerCase();
              return (
                <button
                  key={entry.name}
                  type="button"
                  className={`staff-chip ${isSelected ? "staff-chip--active" : ""}`}
                  onClick={() => setPersonName?.(entry.name)}
                >
                  {entry.name} ({entry.balance} {action.item.unit} out)
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form className="module-form action-form" onSubmit={onSubmit}>
        {isBorrowerSearch ? (
          <div className="action-form__person-picker">
            <label htmlFor="inventory-borrower-search">
              {PERSON_LABEL[action.type] || "Name"}
            </label>
            <div className="action-form__person-control">
              <input
                autoFocus
                id="inventory-borrower-search"
                required
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isPersonListOpen}
                aria-controls="inventory-borrower-options"
                aria-activedescendant={
                  isPersonListOpen && selectedPersonIndex >= 0
                    ? `inventory-borrower-option-${selectedPersonIndex}`
                    : undefined
                }
                placeholder="Type to search usernames"
                value={personName}
                onFocus={() => {
                  setIsPersonListOpen(true);
                  setActivePersonIndex(0);
                }}
                onChange={(event) => {
                  setPersonName?.(event.target.value);
                  setIsPersonListOpen(true);
                  setActivePersonIndex(0);
                }}
                onKeyDown={handlePersonKeyDown}
                onBlur={(event) => {
                  if (
                    !event.currentTarget.parentElement.contains(
                      event.relatedTarget,
                    )
                  ) {
                    setIsPersonListOpen(false);
                  }
                }}
              />
              {isPersonListOpen && (
                <div
                  className="action-form__person-options"
                  id="inventory-borrower-options"
                  role="listbox"
                  aria-label="Database usernames"
                >
                  {filteredPersonOptions.length > 0 ? (
                    filteredPersonOptions.map((person, index) => (
                      <button
                        key={person.user_id}
                        id={`inventory-borrower-option-${index}`}
                        type="button"
                        role="option"
                        aria-selected={index === selectedPersonIndex}
                        className={
                          index === selectedPersonIndex
                            ? "is-active"
                            : undefined
                        }
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActivePersonIndex(index)}
                        onClick={() => {
                          setPersonName?.(person.username);
                          setIsPersonListOpen(false);
                        }}
                      >
                        {person.username}
                      </button>
                    ))
                  ) : (
                    <span className="action-form__person-empty">
                      No matching usernames
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <label>
            {PERSON_LABEL[action.type] || "Name"}
            <input
              autoFocus
              required
              type="text"
              placeholder="Enter name (e.g. Prof. Juan Dela Cruz)"
              list={
                personOptions.length ? "inventory-transaction-users" : undefined
              }
              value={personName}
              readOnly={lockPersonToOptions}
              onChange={(event) => setPersonName?.(event.target.value)}
            />
            {personOptions.length > 0 && (
              <datalist id="inventory-transaction-users">
                {personOptions.map((person) => (
                  <option key={person.user_id} value={person.username} />
                ))}
              </datalist>
            )}
          </label>
        )}
        <label>
          Quantity ({action.item.unit})
          <input
            required
            type="number"
            min="1"
            step="1"
            max={maxReturnQty}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        {isReturn && (
          <label className="action-form__remarks">
            Returned by (Representative / SA — optional)
            <input
              type="text"
              placeholder="e.g. SA Jeremy (leave blank if returned personally)"
              value={returnedBy}
              onChange={(event) => setReturnedBy?.(event.target.value)}
            />
          </label>
        )}
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
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving transaction..."
              : `Record ${action.type.toLowerCase()} & view receipt`}
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
