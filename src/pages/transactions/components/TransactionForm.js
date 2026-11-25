import { useMemo } from "react";
import { Modal } from "../../../components/ui";
import { cabinetGroups, UNFILED_LOCATION } from "../constants";

function cleanOfficeOptions(list = []) {
  const seen = new Set();
  const cleaned = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const label = String(raw || "").trim();
    const key = label.toLowerCase();
    if (!label || key === "other" || key === "others" || seen.has(key)) {
      continue;
    }
    seen.add(key);
    cleaned.push(label);
  }
  return cleaned;
}

function TransactionForm({
  isOpen = true,
  form,
  setForm,
  formError,
  isSubmitting = false,
  onSubmit,
  onCancel,
  offices = [],
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
  const isIncoming = form.direction === "incoming";
  const officeChoices = useMemo(() => cleanOfficeOptions(offices), [offices]);
  const forwardedChoices = useMemo(
    () => cleanOfficeOptions(forwardedDestinations),
    [forwardedDestinations],
  );
  const isOtherOffice =
    Boolean(form.isCustomOffice) ||
    ["other", "others"].includes(String(form.office || "").trim().toLowerCase());
  const isOtherForwarded =
    Boolean(form.isCustomForwardedTo) ||
    ["other", "others"].includes(
      String(form.forwardedTo || "").trim().toLowerCase(),
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

  function handleToggleOtherOffice() {
    const nextCustom = !isOtherOffice;
    setForm({
      ...form,
      isCustomOffice: nextCustom,
      office: nextCustom ? form.office : officeChoices[0] || "Registrar",
      customOffice: nextCustom ? form.customOffice || "" : "",
    });
  }

  function handleToggleOtherForwarded() {
    const nextCustom = !isOtherForwarded;
    setForm({
      ...form,
      isCustomForwardedTo: nextCustom,
      forwardedTo: nextCustom
        ? form.forwardedTo
        : forwardedChoices[0] || "Not sent out",
      customForwardedTo: nextCustom ? form.customForwardedTo || "" : "",
    });
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
        <div className="transaction-office-field">
          <div className="transaction-office-field__header">
            <label
              htmlFor={
                isOtherOffice
                  ? "transaction-custom-office"
                  : "transaction-office-select"
              }
            >
              {isIncoming ? "From office (Origin)" : "Office (Where to go)"}
              {isOtherOffice ? " (Others)" : ""}
            </label>
            <button
              type="button"
              className={`transaction-office-mode-btn ${isOtherOffice ? "is-active" : ""}`}
              aria-pressed={isOtherOffice}
              aria-label={
                isIncoming
                  ? isOtherOffice
                    ? "Others origin office ✓"
                    : "+ Others origin office"
                  : isOtherOffice
                    ? "Others ✓"
                    : "+ Others"
              }
              onClick={handleToggleOtherOffice}
              disabled={isSubmitting}
            >
              {isOtherOffice ? "Others ✓" : "+ Others"}
            </button>
          </div>
          {isOtherOffice ? (
            <input
              autoFocus
              id="transaction-custom-office"
              required
              type="text"
              value={form.customOffice || ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  isCustomOffice: true,
                  customOffice: event.target.value,
                })
              }
              placeholder={
                isIncoming
                  ? "Enter origin office (e.g. CHED Regional Office)"
                  : "Enter destination office (e.g. Research & Extension)"
              }
            />
          ) : (
            <select
              id="transaction-office-select"
              value={form.office}
              onChange={(event) =>
                setForm({
                  ...form,
                  isCustomOffice: false,
                  office: event.target.value,
                  customOffice: "",
                })
              }
            >
              {officeChoices.map((office) => (
                <option key={office} value={office}>
                  {office}
                </option>
              ))}
            </select>
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
            <div className="transaction-office-field">
              <div className="transaction-office-field__header">
                <label
                  htmlFor={
                    isOtherForwarded
                      ? "transaction-custom-forwarded"
                      : "transaction-forwarded-select"
                  }
                >
                  Sent out / Forwarded to
                  {isOtherForwarded ? " (Others)" : ""}
                </label>
                <button
                  type="button"
                  className={`transaction-office-mode-btn ${isOtherForwarded ? "is-active" : ""}`}
                  aria-pressed={isOtherForwarded}
                  aria-label={
                    isOtherForwarded
                      ? "Others forwarded office ✓"
                      : "+ Others forwarded office"
                  }
                  onClick={handleToggleOtherForwarded}
                  disabled={isSubmitting}
                >
                  {isOtherForwarded ? "Others ✓" : "+ Others"}
                </button>
              </div>
              {isOtherForwarded ? (
                <input
                  autoFocus
                  id="transaction-custom-forwarded"
                  required
                  type="text"
                  value={form.customForwardedTo || ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      isCustomForwardedTo: true,
                      customForwardedTo: event.target.value,
                    })
                  }
                  placeholder="Enter destination office (e.g. Legal Office)"
                />
              ) : (
                <select
                  id="transaction-forwarded-select"
                  value={form.forwardedTo || "Not sent out"}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      isCustomForwardedTo: false,
                      forwardedTo: event.target.value,
                      customForwardedTo: "",
                    })
                  }
                >
                  {forwardedChoices.map((destination) => (
                    <option key={destination} value={destination}>
                      {destination}
                    </option>
                  ))}
                </select>
              )}
            </div>
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
            disabled={isSubmitting}
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
