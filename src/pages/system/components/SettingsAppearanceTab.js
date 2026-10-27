const THEME_OPTIONS = [
  { value: "light", label: "Light", hint: "Bright, warm canvas" },
  { value: "dark", label: "Dark", hint: "Easier on the eyes at night" },
];

const SIDEBAR_OPTIONS = [
  { value: "expanded", label: "Expanded", hint: "Show icons and labels" },
  { value: "collapsed", label: "Collapsed", hint: "Icons only, more room" },
];

function ChoiceGroup({ label, name, value, options, onChange }) {
  return (
    <fieldset className="system-choice-group">
      <legend className="system-section-label">{label}</legend>
      <div className="system-choice-group__options">
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
}) {
  return (
    <section className="card panel">
      <div className="panel-heading">
        <div>
          <h2>Appearance &amp; layout</h2>
          <p>Choose your color theme and default sidebar state on desktop.</p>
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
      </div>
    </section>
  );
}

export default SettingsAppearanceTab;
