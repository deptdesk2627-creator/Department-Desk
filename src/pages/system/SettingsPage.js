import { useState } from "react";
import { PageHeader } from "../../components/ui";
import { DEFAULT_SETTINGS } from "../../constants/system";
import SettingsAppearanceTab from "./components/SettingsAppearanceTab";
import SettingsDataTab from "./components/SettingsDataTab";
import SettingsOfficeTab from "./components/SettingsOfficeTab";
import { SystemIcon } from "./components/SystemIcons";
import "./SystemShared.css";
import "./SettingsPage.css";

const NOTIFICATION_OPTIONS = [
  {
    key: "notifyRequests",
    label: "Requests needing action",
    badge: "Recommended",
    icon: "bell",
    description:
      "Alert when outgoing or incoming requests require attention or signature.",
  },
  {
    key: "notifyLowStock",
    label: "Low-stock supplies",
    icon: "database",
    description:
      "Alert when any supply item reaches or drops below its low-stock threshold.",
  },
  {
    key: "notifyOverdueTasks",
    label: "Overdue tasks",
    icon: "clock",
    description: "Alert when open tasks pass their scheduled due date.",
  },
];

function SettingsPage({
  role,
  settings,
  onSettingsChange,
  theme,
  onThemeChange,
  data,
  onNavigate,
  isSidebarOpen,
  onSidebarOpenChange,
}) {
  const canManageData = Boolean(
    role?.can?.editDocuments && role?.can?.manageInventory,
  );
  const showAdminPrefs = role?.id !== "staff";
  const [notice, setNotice] = useState(null);
  const safeSettings = { ...DEFAULT_SETTINGS, ...settings };
  const activeSidebarChoice =
    typeof isSidebarOpen === "boolean"
      ? isSidebarOpen
        ? "expanded"
        : "collapsed"
      : safeSettings.sidebarDefault;

  function updateSettings(patch, feedbackText) {
    onSettingsChange?.({ ...safeSettings, ...patch });
    if (feedbackText) {
      setNotice({ type: "success", text: feedbackText });
    }
  }

  return (
    <div className="dashboard module-page system-page">
      <PageHeader
        eyebrow="SYSTEM · SETTINGS"
        title="Settings"
        subtitle="Configure workspace appearance, notifications, department contact details, and data exports."
      />

      {notice && (
        <p
          className={`system-notice system-notice--${notice.type}`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      )}

      <div className="system-settings-stack">
        <SettingsAppearanceTab
          theme={theme}
          onThemeChange={(nextTheme) => {
            onThemeChange?.(nextTheme);
            setNotice({
              type: "success",
              text: `Theme switched to ${nextTheme === "dark" ? "Dark" : "Light"} mode.`,
            });
          }}
          sidebarDefault={activeSidebarChoice}
          onSidebarDefaultChange={(sidebarDefault) => {
            const shouldOpen = sidebarDefault !== "collapsed";
            onSidebarOpenChange?.(shouldOpen);
            updateSettings(
              { sidebarDefault },
              shouldOpen
                ? "Sidebar expanded — showing icons and labels."
                : "Sidebar collapsed — showing icons only.",
            );
          }}
          tableDensity={safeSettings.tableDensity}
          onTableDensityChange={(tableDensity) =>
            updateSettings(
              { tableDensity },
              tableDensity === "compact"
                ? "Table row density set to Compact — fitting more rows on screen."
                : "Table row density set to Comfortable — standard row padding.",
            )
          }
          defaultRequestView={safeSettings.defaultRequestView}
          onDefaultRequestViewChange={(defaultRequestView) => {
            const viewNames = {
              table: "Table View",
              board: "Kanban View",
              cabinets: "Cabinet Locator",
            };
            updateSettings(
              { defaultRequestView },
              `Default Request Tracker view set to ${viewNames[defaultRequestView] || "Table View"}.`,
            );
          }}
          defaultTaskView={safeSettings.defaultTaskView}
          onDefaultTaskViewChange={(defaultTaskView) => {
            const viewNames = {
              table: "Table View",
              status: "By Status",
            };
            updateSettings(
              { defaultTaskView },
              `Default Task Management view set to ${viewNames[defaultTaskView] || "Table View"}.`,
            );
          }}
          onNavigate={onNavigate}
          showAdminViews={showAdminPrefs}
        />

        <SettingsOfficeTab
          settings={safeSettings}
          canManageData={canManageData}
          onSave={updateSettings}
          onNotice={setNotice}
        />

        {showAdminPrefs && (
          <section className="card system-card">
            <div className="system-card-head">
              <div className="system-card-head__title">
                <span className="system-card-icon">
                  <SystemIcon name="bell" />
                </span>
                <div>
                  <h2>Notification preferences</h2>
                  <p>
                    Choose which alerts appear in the top-bar notification bell.
                  </p>
                </div>
              </div>
              <span className="system-status-badge system-status-badge--neutral">
                Top-bar alerts
              </span>
            </div>

            <div className="system-switch-list">
              {NOTIFICATION_OPTIONS.map((item) => {
                const checked = safeSettings[item.key] !== false;
                return (
                  <label key={item.key} className="system-switch-row">
                    <span className="system-switch-row__left">
                      <span className="system-switch-row__icon">
                        <SystemIcon name={item.icon} size={17} />
                      </span>
                      <span className="system-switch-row__text">
                        <span className="system-switch-row__title">
                          {item.label}
                          {item.badge && (
                            <span className="system-inline-pill">
                              {item.badge}
                            </span>
                          )}
                        </span>
                        <span className="system-switch-row__desc">
                          {item.description}
                        </span>
                      </span>
                    </span>
                    <span className="system-switch">
                      <input
                        type="checkbox"
                        role="switch"
                        checked={checked}
                        onChange={(event) =>
                          updateSettings({ [item.key]: event.target.checked })
                        }
                      />
                      <span className="system-switch__track" aria-hidden="true" />
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {canManageData && (
          <SettingsDataTab
            data={data}
            settings={safeSettings}
            onSettingsChange={onSettingsChange}
            onNotice={setNotice}
          />
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
