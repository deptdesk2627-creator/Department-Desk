import { useState } from "react";
import { PageHeader } from "../../components/ui";
import { DEFAULT_SETTINGS } from "../../constants/system";
import SettingsAppearanceTab from "./components/SettingsAppearanceTab";
import SettingsDataTab from "./components/SettingsDataTab";
import SettingsOfficeTab from "./components/SettingsOfficeTab";
import "./SystemPages.css";

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
  const tabs = [
    { id: "appearance", label: "Appearance" },
    { id: "office", label: "Office details" },
    ...(canManageData ? [{ id: "data", label: "Data & backup" }] : []),
  ];

  const [activeTab, setActiveTab] = useState("appearance");
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
        subtitle="Configure workspace appearance, department contact details, and browser data backups."
      />

      <section className="card panel system-settings-card">
        <div
          className="system-tabs"
          role="tablist"
          aria-label="Settings sections"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`settings-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`settings-panel-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id);
                setNotice(null);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {notice && (
          <p
            className={`system-notice system-notice--${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            {notice.text}
          </p>
        )}

        {activeTab === "appearance" && (
          <SettingsAppearanceTab
            theme={theme}
            onThemeChange={onThemeChange}
            sidebarDefault={safeSettings.sidebarDefault}
            onSidebarDefaultChange={(sidebarDefault) =>
              updateSettings({ sidebarDefault })
            }
          />
        )}

        {activeTab === "office" && (
          <SettingsOfficeTab
            settings={safeSettings}
            canManageData={canManageData}
            onSave={updateSettings}
            onNotice={setNotice}
          />
        )}

        {activeTab === "data" && canManageData && (
          <SettingsDataTab
            data={data}
            settings={safeSettings}
            onSettingsChange={onSettingsChange}
            onNotice={setNotice}
          />
        )}
      </section>
    </div>
  );
}

export default SettingsPage;
