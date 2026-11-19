import { useMemo, useState } from "react";
import { Modal } from "../../../components/ui";
import { cabinetGroups, UNFILED_LOCATION } from "../constants";

function TransactionForm({
  isOpen = true,
  form,
  setForm,
  formError,
  isSubmitting = false,
  onSubmit,
  onCancel,
  offices = [],
  onAddOffice,
  categories = [],
  statuses = [],
  outgoingStatuses = [],
  incomingStatuses = [],
  signatureOptions = [
    "Unsigned",
    "Signed by Secretary",
    "Signed by Dean",
    "Signed by Both",
  ],
  forwardedDestinations = ["Not sent out", "Returned to Sender"],
}) {
  const [isOfficeListOpen, setIsOfficeListOpen] = useState(false);
  const [isAddingOffice, setIsAddingOffice] = useState(false);
  const [activeOfficeIndex, setActiveOfficeIndex] = useState(0);
  const [officeError, setOfficeError] = useState("");
  const isIncoming = form.direction === "incoming";
  const filteredOffices = useMemo(() => {
    const query = String(form.office || "").trim().toLowerCase();
    return offices.filter((office) =>
      String(office || "").toLowerCase().includes(query),
    );
  }, [form.office, offices]);
  const officeName = String(form.office || "").trim();
  const hasExactOffice = offices.some(
    (office) => String(office).trim().toLowerCase() === officeName.toLowerCase(),
  );
  const selectedOfficeIndex = Math.min(
    activeOfficeIndex,
    filteredOffices.length - 1,
  );
  const activeStatuses = isIncoming
    ? incomingStatuses.length
      ? incomingStatuses
      : statuses
    : outgoingStatuses.length
      ? outgoingStatuses
      : statuses;

  function handleDirectionChange(nextDirection) {
    setForm({
      ...form,
      direction: nextDirection,
      status: nextDirection === "incoming" ? "Received" : "Pending",
    });
  }

  async function handleAddOffice() {
    if (!officeName || !onAddOffice) return;
    setIsAddingOffice(true);
    setOfficeError("");
    try {
      const savedOffice = await onAddOffice(officeName);
      if (!savedOffice) throw new Error("The new office could not be saved.");
      setForm((current) => ({ ...current, office: savedOffice }));
      setIsOfficeListOpen(false);
    } catch (error) {
      setOfficeError(error.message || "Could not save this office.");
    } finally {
      setIsAddingOffice(false);
    }
  }

  function handleOfficeKeyDown(event) {
    if (event.key === "ArrowDown" && filteredOffices.length > 0) {
      event.preventDefault();
      setIsOfficeListOpen(true);
      setActiveOfficeIndex((index) =>
        Math.min(index + 1, filteredOffices.length - 1),
      );
    } else if (event.key === "ArrowUp" && filteredOffices.length > 0) {
      event.preventDefault();
      setIsOfficeListOpen(true);
      setActiveOfficeIndex((index) => Math.max(index - 1, 0));
    } else if (
      event.key === "Enter" &&
      isOfficeListOpen &&
      selectedOfficeIndex >= 0
    ) {
      event.preventDefault();
      setForm((current) => ({
        ...current,
        office: filteredOffices[selectedOfficeIndex],
      }));
      setIsOfficeListOpen(false);
    } else if (event.key === "Escape") {
      setIsOfficeListOpen(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      eyebrow="OFFICE WORKSPACE · REQUESTS"
      title={isIncoming ? "Log an incoming document" : "Log a new request"}
      subtitle={
        isIncoming
          ? "Record a document or request received from another office, track if our office signed it, and log where it is sent out."
          : "Record an outgoing document or service request and assign its destination office."
      }
      titleId="new-transaction-title"
      className="transaction-modal form-modal"
    >
      <div
        className="transaction-direction-switch"
        role="group"
        aria-label="Request direction"
      >
        <button
          type="button"
          className={`transaction-direction-btn ${!isIncoming ? "is-active" : ""}`}
          onClick={() => handleDirectionChange("outgoing")}
        >
          ↗ Outgoing request
        </button>
        <button
          type="button"
          className={`transaction-direction-btn ${isIncoming ? "is-active" : ""}`}
          onClick={() => handleDirectionChange("incoming")}
        >
          ↙ Incoming from other office
        </button>
      </div>

      <form className="module-form transaction-form" onSubmit={onSubmit}>
        <label className="transaction-form-name">
          {isIncoming ? "Document / request name" : "Form name"}
          <input
            autoFocus
            required
            value={form.document}
            onChange={(event) =>
              setForm({ ...form, document: event.target.value })
            }
            placeholder={
              isIncoming
                ? "e.g. Memorandum of Agreement, Budget Endorsement"
                : "Name of the form or request"
            }
          />
        </label>
        <label>
          {isIncoming ? "Sender / Contact person" : "Requested by"}
          <input
            required
            value={form.student}
            onChange={(event) => {
              setForm({ ...form, student: event.target.value });
            }}
            placeholder={
              isIncoming
                ? "Person who sent or delivered it"
                : "Student or staff name"
            }
          />
        </label>
        <label>
          {isIncoming ? "Date & time received" : "Date and time"}
          <input
            required
            type="datetime-local"
            value={form.dateTime}
            onChange={(event) =>
              setForm({ ...form, dateTime: event.target.value })
            }
          />
        </label>
        <div className="transaction-office-picker">
          <label htmlFor="transaction-office-search">
            {isIncoming ? "From office (Origin)" : "Office"}
          </label>
          <div className="transaction-office-picker__control">
            <input
              id="transaction-office-search"
              required
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isOfficeListOpen}
              aria-controls="transaction-office-options"
              aria-activedescendant={
                isOfficeListOpen && selectedOfficeIndex >= 0
                  ? `transaction-office-option-${selectedOfficeIndex}`
                  : undefined
              }
              placeholder="Type to search offices"
              value={form.office}
              onFocus={() => {
                setIsOfficeListOpen(true);
                setActiveOfficeIndex(0);
              }}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  office: event.target.value,
                }));
                setOfficeError("");
                setIsOfficeListOpen(true);
                setActiveOfficeIndex(0);
              }}
              onKeyDown={handleOfficeKeyDown}
              onBlur={(event) => {
                if (
                  !event.currentTarget.parentElement.contains(
                    event.relatedTarget,
                  )
                ) {
                  setIsOfficeListOpen(false);
                }
              }}
            />
            {isOfficeListOpen && (
              <div className="transaction-office-picker__menu">
                {filteredOffices.length > 0 ? (
                  <div
                    className="transaction-office-picker__options"
                    id="transaction-office-options"
                    role="listbox"
                    aria-label="Existing offices"
                  >
                    {filteredOffices.map((office, index) => (
                      <button
                        key={office}
                        id={`transaction-office-option-${index}`}
                        type="button"
                        role="option"
                        aria-selected={
                          index === selectedOfficeIndex
                        }
                        className={
                          index === selectedOfficeIndex ? "is-active" : undefined
                        }
                        onMouseEnter={() => setActiveOfficeIndex(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setForm((current) => ({ ...current, office }));
                          setOfficeError("");
                          setIsOfficeListOpen(false);
                        }}
                      >
                        {office}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="transaction-office-picker__empty">
                    No matching offices found.
                  </p>
                )}
                {officeName && !hasExactOffice && onAddOffice && (
                  <button
                    className="transaction-office-picker__add"
                    type="button"
                    disabled={isAddingOffice}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={handleAddOffice}
                  >
                    {isAddingOffice
                      ? "Adding office..."
                      : `Add a new office: ${officeName}`}
                  </button>
                )}
              </div>
            )}
          </div>
          {officeError && (
            <p className="transaction-office-picker__error" role="alert">
              {officeError}
            </p>
          )}
        </div>
        <label>
          Category
          <select
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value })}
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value })
            }
          >
            {activeStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label>
          Cabinet / Drawer location
          <select
            value={form.fileLocation || UNFILED_LOCATION}
            onChange={(event) =>
              setForm({ ...form, fileLocation: event.target.value })
            }
          >
            <option value={UNFILED_LOCATION}>{UNFILED_LOCATION}</option>
            {cabinetGroups.map((group) => (
              <optgroup
                key={group.id}
                label={`${group.title} (${group.owner})`}
              >
                {group.drawers.map((drawer) => (
                  <option key={drawer.id} value={drawer.id}>
                    {drawer.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {isIncoming && (
          <>
            <label>
              Signed by our office
              <select
                value={form.signedByOffice || "Unsigned"}
                onChange={(event) =>
                  setForm({ ...form, signedByOffice: event.target.value })
                }
              >
                {signatureOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sent out / Forwarded to
              <select
                value={form.forwardedTo || "Not sent out"}
                onChange={(event) =>
                  setForm({ ...form, forwardedTo: event.target.value })
                }
              >
                {forwardedDestinations.map((destination) => (
                  <option key={destination} value={destination}>
                    {destination}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <label className="transaction-description">
          {isIncoming ? "Routing & signature notes" : "Request notes"}
          <textarea
            rows="2"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder={
              isIncoming
                ? "Add remarks on signatures, endorsements, or release instructions (optional)"
                : "Add details or purpose (optional)"
            }
          />
        </label>
        <div className="transaction-form-actions">
          {onCancel && (
            <button
              className="secondary-button"
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting || isAddingOffice}
          >
            {isSubmitting
              ? "Saving transaction..."
              : isIncoming
                ? "＋ Log incoming"
                : "＋ Add request"}
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

export default TransactionForm;
