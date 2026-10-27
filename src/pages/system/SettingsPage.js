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
        />

        <SettingsOfficeTab
          settings={safeSettings}
          canManageData={canManageData}
          onSave={updateSettings}
          onNotice={setNotice}
        />

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
