import { useState } from "react";
import { PageHeader } from "../../components/ui";
import { DEFAULT_SETTINGS } from "../../constants/system";
import SettingsAppearanceTab from "./components/SettingsAppearanceTab";
import SettingsDataTab from "./components/SettingsDataTab";
import SettingsOfficeTab from "./components/SettingsOfficeTab";
import "./SettingsPage.css";

const NOTIFICATION_OPTIONS = [
  {
    key: "notifyRequests",
    label: "Requests needing action",
    description:
      "Alert when outgoing or incoming requests require attention or signature.",
  },
  {
    key: "notifyLowStock",
    label: "Low-stock supplies",
    description:
      "Alert when any supply item reaches or drops below its low-stock threshold.",
  },
  {
    key: "notifyOverdueTasks",
    label: "Overdue tasks",
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
}) {
  const canManageData = Boolean(
    role?.can?.editDocuments && role?.can?.manageInventory,
  );
  const showAdminPrefs = role?.id !== "staff";
  const [notice, setNotice] = useState(null);
  const safeSettings = { ...DEFAULT_SETTINGS, ...settings };

  function updateSettings(patch) {
    onSettingsChange?.({ ...safeSettings, ...patch });
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

      <div className="system-settings-grid">
        <SettingsAppearanceTab
          theme={theme}
          onThemeChange={onThemeChange}
          sidebarDefault={safeSettings.sidebarDefault}
          onSidebarDefaultChange={(sidebarDefault) =>
            updateSettings({ sidebarDefault })
          }
          tableDensity={safeSettings.tableDensity}
          onTableDensityChange={(tableDensity) =>
            updateSettings({ tableDensity })
          }
          defaultRequestView={safeSettings.defaultRequestView}
          onDefaultRequestViewChange={(defaultRequestView) =>
            updateSettings({ defaultRequestView })
          }
          defaultTaskView={safeSettings.defaultTaskView}
          onDefaultTaskViewChange={(defaultTaskView) =>
            updateSettings({ defaultTaskView })
          }
          showAdminViews={showAdminPrefs}
        />

        <div className="system-settings-column">
          <SettingsOfficeTab
            settings={safeSettings}
            canManageData={canManageData}
            onSave={updateSettings}
            onNotice={setNotice}
          />

          {showAdminPrefs && (
            <section className="card panel system-notifications-card">
              <div className="panel-heading">
                <div>
                  <h2>Notification preferences</h2>
                  <p>
                    Choose which alerts appear in the top-bar notification bell.
                  </p>
                </div>
              </div>

              <div className="system-section-body system-toggle-list">
                {NOTIFICATION_OPTIONS.map((item) => {
                  const checked = safeSettings[item.key] !== false;
                  return (
                    <label key={item.key} className="system-toggle-row">
                      <div>
                        <strong>{item.label}</strong>
                        <span>{item.description}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          updateSettings({ [item.key]: event.target.checked })
                        }
                      />
                    </label>
                  );
                })}
              </div>
            </section>
          )}
        </div>

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
