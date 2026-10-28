import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/ui";
import { getProductId } from "../../../hooks/useInventoryActions";
import { getItemUsageType } from "../../../utils/inventory";

function buildMonthlyUsage(records = [], itemId) {
  const today = new Date();
  const buckets = Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(
      today.getFullYear(),
      today.getMonth() - (11 - index),
      1,
    );
    return {
      label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(monthDate),
      key: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
      value: 0,
    };
  });

  for (const record of records) {
    if (record.productId !== itemId) continue;
    if (!record.dateTime || !["Used", "Borrowed"].includes(record.status)) continue;

    const eventDate = new Date(record.dateTime);
    if (Number.isNaN(eventDate.getTime())) continue;

    const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
    const bucket = buckets.find((entry) => entry.key === monthKey);
    if (!bucket) continue;

    bucket.value += Number(record.quantity) || 0;
  }

  return buckets;
}

function InventoryItemModal({
  item,
  records = [],
  isOpen,
  editable = false,
  onSave,
  onClose,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ quantity: "", unit: "", lowStockAt: "" });
  const [formError, setFormError] = useState("");

  const monthlyUsage = useMemo(() => {
    if (!item) return [];
    return buildMonthlyUsage(records, getProductId(item));
  }, [item, records]);

  useEffect(() => {
    if (!item) return;
    setDraft({
      quantity: String(item.quantity ?? 0),
      unit: String(item.unit || ""),
      lowStockAt: String(item.lowStockAt ?? 0),
    });
    setIsEditing(false);
    setFormError("");
  }, [item, isOpen]);

  if (!item || !isOpen) return null;

  function handleSave(event) {
    event.preventDefault();
    const quantity = Number(draft.quantity);
    const lowStockAt = Number(draft.lowStockAt);
    const unit = draft.unit.trim();

    if (
      draft.quantity === "" ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      draft.lowStockAt === "" ||
      !Number.isInteger(lowStockAt) ||
      lowStockAt < 0 ||
      !unit
    ) {
      setFormError("Enter a unit and valid non-negative whole-number stock values.");
      return;
    }

    onSave?.({ quantity, unit, lowStockAt });
    setFormError("");
    setIsEditing(false);
  }

  function cancelEdit() {
    setDraft({
      quantity: String(item.quantity ?? 0),
      unit: String(item.unit || ""),
      lowStockAt: String(item.lowStockAt ?? 0),
    });
    setFormError("");
    setIsEditing(false);
  }

  const usageType = getItemUsageType(item);
  const itemId = getProductId(item);
  const classification = usageType === "Borrowable" ? "Equipment" : "Item";
  const category = usageType === "Borrowable" ? "Borrowable" : "Usable";
  const recentRemarks = [...records]
    .filter((record) => record.productId === itemId)
    .sort(
      (left, right) => new Date(right.dateTime || 0) - new Date(left.dateTime || 0),
    )
    .slice(0, 5)
    .map((record) => ({
      person: record.person || "Unassigned",
      remark: record.remarks || "No remark provided",
      date: record.dateTime,
      quantity: Number(record.quantity) || 0,
      status: record.status,
    }));

  const maxUsage = Math.max(...monthlyUsage.map((entry) => entry.value), 1);
  const chartWidth = 420;
  const chartHeight = 130;
  const chartPadding = 14;
  const points = monthlyUsage.map((entry, index) => {
    const x =
      chartPadding +
      (index * (chartWidth - chartPadding * 2)) / Math.max(monthlyUsage.length - 1, 1);
    const y =
      chartHeight -
      chartPadding -
      (entry.value / maxUsage) * (chartHeight - chartPadding * 2);
    return `${x},${y}`;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="OFFICE WORKSPACE · SUPPLY & INVENTORY"
      title={item.name}
      subtitle="Detailed item profile and recent usage history."
      titleId="inventory-item-title"
      className="transaction-modal inventory-item-modal"
    >
      <div className="inventory-detail-layout">
        <div className="inventory-detail-summary">
          <div className="inventory-detail-grid">
            <div className="inventory-detail-field">
              <span>Item name</span>
              <strong>{item.name}</strong>
            </div>
            <div className="inventory-detail-field">
              <span>Item ID</span>
              <strong>{itemId}</strong>
            </div>
            {isEditing ? (
              <>
                <label className="inventory-detail-field inventory-detail-edit-field">
                  <span>Stock on hand</span>
                  <input
                    aria-label="Stock on hand"
                    form="inventory-detail-edit-form"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={draft.quantity}
                    onChange={(event) =>
                      setDraft({ ...draft, quantity: event.target.value })
                    }
                  />
                </label>
                <label className="inventory-detail-field inventory-detail-edit-field">
                  <span>Unit</span>
                  <input
                    aria-label="Unit"
                    form="inventory-detail-edit-form"
                    type="text"
                    required
                    value={draft.unit}
                    onChange={(event) =>
                      setDraft({ ...draft, unit: event.target.value })
                    }
                  />
                </label>
                <label className="inventory-detail-field inventory-detail-edit-field">
                  <span>Minimum stock</span>
                  <input
                    aria-label="Minimum stock"
                    form="inventory-detail-edit-form"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={draft.lowStockAt}
                    onChange={(event) =>
                      setDraft({ ...draft, lowStockAt: event.target.value })
                    }
                  />
                </label>
              </>
            ) : (
              <>
                <div className="inventory-detail-field">
                  <span>Stock on hand</span>
                  <strong>
                    {Number(item.quantity) || 0} {item.unit || "units"}
                  </strong>
                </div>
                <div className="inventory-detail-field">
                  <span>Unit</span>
                  <strong>{item.unit || "units"}</strong>
                </div>
                <div className="inventory-detail-field">
                  <span>Minimum stock</span>
                  <strong>
                    {Number(item.lowStockAt) || 0} {item.unit || "units"}
                  </strong>
                </div>
              </>
            )}
            <div className="inventory-detail-field">
              <span>Category</span>
              <strong>{category}</strong>
            </div>
            <div className="inventory-detail-field inventory-detail-field--wide">
              <span>Classification</span>
              <strong>{classification}</strong>
            </div>
          </div>
        </div>

        {editable && (
          <div className="inventory-detail-edit-actions">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="inventory-detail-edit-form"
                  className="primary-button"
                >
                  Save changes
                </button>
              </>
            ) : (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsEditing(true)}
              >
                Edit stock details
              </button>
            )}
          </div>
        )}
        {isEditing && (
          <form
            id="inventory-detail-edit-form"
            className="inventory-detail-edit-form"
            onSubmit={handleSave}
          >
            {formError && (
              <p className="empty-state" role="alert">
                {formError}
              </p>
            )}
          </form>
        )}

        <div className="inventory-detail-usage">
          <div className="inventory-detail-section-header">
            <h3>Usage trend</h3>
            <span>Past 12 months</span>
          </div>
          <svg
            className="inventory-detail-chart"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            role="img"
            aria-label={`Usage trend for ${item.name}`}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartPadding + (chartHeight - chartPadding * 2) * ratio;
              return (
                <line
                  key={ratio}
                  x1={chartPadding}
                  x2={chartWidth - chartPadding}
                  y1={y}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.28)"
                  strokeDasharray="4 4"
                />
              );
            })}
            <polyline
              fill="none"
              stroke="#7c3aed"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points.join(" ")}
            />
            {monthlyUsage.map((entry, index) => {
              const x =
                chartPadding +
                (index * (chartWidth - chartPadding * 2)) /
                  Math.max(monthlyUsage.length - 1, 1);
              const y =
                chartHeight -
                chartPadding -
                (entry.value / maxUsage) * (chartHeight - chartPadding * 2);
              return (
                <g key={`${entry.key}-${index}`}>
                  <circle cx={x} cy={y} r="4" fill="#7c3aed" />
                  <text
                    x={x}
                    y={chartHeight - 2}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                  >
                    {entry.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="inventory-detail-remarks">
          <div className="inventory-detail-section-header">
            <h3>Recent remarks</h3>
            <span>Last 5 entries</span>
          </div>
          {recentRemarks.length ? (
            <ul className="inventory-detail-remarks-list">
              {recentRemarks.map((entry, index) => (
                <li key={`${entry.person}-${entry.date}-${index}`}>
                  <div className="inventory-remark-header">
                    <strong>{entry.person}</strong>
                    <span>{entry.status}</span>
                  </div>
                  <p>{entry.remark}</p>
                  <small>
                    {entry.quantity} {item.unit || "units"} · {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No issued remarks recorded for this item yet.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default InventoryItemModal;
