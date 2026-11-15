const THEME_OPTIONS = [
  { value: "light", label: "Light", hint: "Bright, warm canvas" },
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

function ChoiceGroup({ label, name, value, options, onChange }) {
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
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <strong>{option.label}</strong>
            <span>{option.hint}</span>
          </label>
        ))}
      </div>
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
  showAdminViews = true,
}) {
  return (
    <section className="card panel">
      <div className="panel-heading">
        <div>
          <h2>Appearance &amp; layout</h2>
          <p>
            Choose your color theme, table density, and default workspace views.
          </p>
        </div>
      </div>

      <div className="system-section-body">
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
        />
        {showAdminViews && (
          <>
            <ChoiceGroup
              label="Default Request Tracker view"
              name="settings-request-view"
              value={defaultRequestView}
              onChange={onDefaultRequestViewChange}
              options={REQUEST_VIEW_OPTIONS}
            />
            <ChoiceGroup
              label="Default Task Management view"
              name="settings-task-view"
              value={defaultTaskView}
              onChange={onDefaultTaskViewChange}
              options={TASK_VIEW_OPTIONS}
            />
          </>
        )}
      </div>
    </section>
  );
}

export default SettingsAppearanceTab;
