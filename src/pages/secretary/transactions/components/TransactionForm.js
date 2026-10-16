function TransactionForm({
  form,
  setForm,
  formError,
  onSubmit,
  offices,
  categories,
  statuses,
}) {
  return (
    <section
      className="card panel module-form-panel"
      aria-labelledby="new-transaction-title"
    >
      <div className="panel-heading">
        <div>
          <h2 id="new-transaction-title">Add a request</h2>
          <p>Log a document or request and its destination office.</p>
        </div>
      </div>
      <form className="module-form transaction-form" onSubmit={onSubmit}>
        <label>
          Date and time
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
          Requested by
          <input
            required
            value={form.student}
            onChange={(event) => {
              setForm({ ...form, student: event.target.value });
            }}
            placeholder="Student or staff name"
          />
        </label>
        <label>
          Office
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
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="transaction-form-name">
          Form name
          <input
            required
            value={form.document}
            onChange={(event) =>
              setForm({ ...form, document: event.target.value })
            }
            placeholder="Name of the form or request"
          />
        </label>
        <label className="transaction-description">
          Request notes
          <textarea
            rows="2"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="Add details or purpose (optional)"
          />
        </label>
        <div className="transaction-form-actions">
          <button className="primary-button" type="submit">
            ＋ Add request
          </button>
        </div>
      </form>
      {formError && (
        <p className="empty-state" role="alert">
          {formError}
        </p>
      )}
    </section>
  );
}

export default TransactionForm;
