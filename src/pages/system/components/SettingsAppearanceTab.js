import { SystemIcon } from "./SystemIcons";

const THEME_OPTIONS = [
  { value: "light", label: "Light", hint: "Clean, soft neutral canvas" },
  { value: "dark", label: "Dark", hint: "Easier on the eyes at night" },
];

const SIDEBAR_OPTIONS = [
  { value: "expanded", label: "Expanded", hint: "Show icons and labels" },
  { value: "collapsed", label: "Collapsed", hint: "Icons only, more room" },
];

const DENSITY_OPTIONS = [
  { value: "comfortable", label: "Comfortable", hint: "Standard row padding" },
  { value: "compact", label: "Compact", hint: "Fit more rows on screen" },
];

const REQUEST_VIEW_OPTIONS = [
  { value: "table", label: "Table View", hint: "Full details & inline status" },
  { value: "board", label: "Kanban View", hint: "Grouped by workflow stage" },
  { value: "cabinets", label: "Cabinet Locator", hint: "Physical filing drawers" },
];

const TASK_VIEW_OPTIONS = [
  { value: "table", label: "Table View", hint: "Sortable list with bulk select" },
  { value: "status", label: "By Status", hint: "Grouped columns by progress" },
];

function ChoiceGroup({ label, name, value, options, onChange, footer }) {
  return (
    <fieldset className="system-choice-group">
      <legend className="system-section-label">{label}</legend>
      <div
        className={`system-choice-group__options${
          options.length === 3 ? " system-choice-group__options--three" : ""
        }`}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className="system-choice"
            data-checked={value === option.value ? "true" : "false"}
            onClick={(event) => {
              if (event.target.tagName !== "INPUT") {
                onChange?.(option.value);
              }
            }}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange?.(option.value)}
            />
            <span className="system-choice__top">
              <strong>{option.label}</strong>
              {value === option.value && (
                <span className="system-choice__check" aria-hidden="true">
                  <SystemIcon name="check" size={13} />
                </span>
              )}
            </span>
            <span>{option.hint}</span>
          </label>
        ))}
      </div>
      {footer}
    </fieldset>
  );
}

function SettingsAppearanceTab({
  theme,
  onThemeChange,
  sidebarDefault,
  onSidebarDefaultChange,
  tableDensity = "comfortable",
  onTableDensityChange,
  defaultRequestView = "table",
  onDefaultRequestViewChange,
  defaultTaskView = "table",
  onDefaultTaskViewChange,
  onNavigate,
  showAdminViews = true,
}) {
  const activeRequestOption =
    REQUEST_VIEW_OPTIONS.find((item) => item.value === defaultRequestView) ||
    REQUEST_VIEW_OPTIONS[0];
  const activeTaskOption =
    TASK_VIEW_OPTIONS.find((item) => item.value === defaultTaskView) ||
    TASK_VIEW_OPTIONS[0];

  return (
    <section className="card system-card">
      <div className="system-card-head">
        <div className="system-card-head__title">
          <span className="system-card-icon">
            <SystemIcon name="sliders" />
          </span>
          <div>
            <h2>Appearance &amp; layout</h2>
            <p>
              Choose your color theme, table density, and default workspace
              views.
            </p>
          </div>
        </div>
        <span className="system-status-badge system-status-badge--accent">
          <SystemIcon name={theme === "dark" ? "moon" : "sun"} size={13} />
          {theme === "dark" ? "Dark mode" : "Light mode"}
        </span>
      </div>

      <div>
        <ChoiceGroup
          label="Theme"
          name="settings-theme"
          value={theme}
          onChange={onThemeChange}
          options={THEME_OPTIONS}
        />
        <ChoiceGroup
          label="Sidebar on startup (desktop)"
          name="settings-sidebar"
          value={sidebarDefault}
          onChange={onSidebarDefaultChange}
          options={SIDEBAR_OPTIONS}
        />
        <ChoiceGroup
          label="Table row density"
          name="settings-density"
          value={tableDensity}
          onChange={onTableDensityChange}
          options={DENSITY_OPTIONS}
          footer={
            <div
              className="system-density-preview"
              aria-label="Table row density preview"
            >
              <table className="request-table system-density-preview__table">
                <thead>
                  <tr>
                    <th>Sample ID</th>
                    <th>Document</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <span className="inventory-product-id-pill">REQ-01</span>
                    </td>
                    <td>Curriculum Revision Endorsement</td>
                    <td>
                      <span className="status-pill status-done">Approved</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="inventory-product-id-pill">REQ-02</span>
                    </td>
                    <td>Faculty Load Assignment</td>
                    <td>
                      <span className="status-pill status-waiting">
                        Under Review
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          }
        />
        {showAdminViews && (
          <>
            <ChoiceGroup
              label="Default Request Tracker view"
              name="settings-request-view"
              value={defaultRequestView}
              onChange={onDefaultRequestViewChange}
              options={REQUEST_VIEW_OPTIONS}
              footer={
                onNavigate && (
                  <div className="system-choice-action-bar">
                    <span>
                      Active default:{" "}
                      <strong>{activeRequestOption.label}</strong>
                    </span>
                    <button
                      type="button"
                      className="secondary-button system-choice-action-btn"
                      onClick={() => onNavigate("transactions")}
                    >
                      Open Request Tracker in {activeRequestOption.label} →
                    </button>
                  </div>
                )
              }
            />
            <ChoiceGroup
              label="Default Task Management view"
              name="settings-task-view"
              value={defaultTaskView}
              onChange={onDefaultTaskViewChange}
              options={TASK_VIEW_OPTIONS}
              footer={
                onNavigate && (
                  <div className="system-choice-action-bar">
                    <span>
                      Active default: <strong>{activeTaskOption.label}</strong>
                    </span>
                    <button
                      type="button"
                      className="secondary-button system-choice-action-btn"
                      onClick={() => onNavigate("tasks")}
                    >
                      Open Task Management in {activeTaskOption.label} →
                    </button>
                  </div>
                )
              }
            />
          </>
        )}
      </div>
    </section>
  );
}

export default SettingsAppearanceTab;
