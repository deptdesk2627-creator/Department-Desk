import { Modal } from "../../../components/ui";

function TransactionForm({
  isOpen = true,
  form,
  setForm,
  formError,
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
        <label>
          {isIncoming ? "From office (Origin)" : "Office"}
          <select
            required
            value={form.office}
            onChange={(event) =>
              setForm({ ...form, office: event.target.value })
            }
          >
            {offices.map((office) => (
              <option key={office} value={office}>
                {office}
              </option>
            ))}
          </select>
        </label>
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
            >
              Cancel
            </button>
          )}
          <button className="primary-button" type="submit">
            {isIncoming ? "＋ Log incoming" : "＋ Add request"}
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
