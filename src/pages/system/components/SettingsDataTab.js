import { useRef, useState } from "react";
import { DEFAULT_SETTINGS, isPlainObject } from "../../../constants/system";

function SettingsDataTab({ data, settings, onSettingsChange, onNotice }) {
  const [pendingImport, setPendingImport] = useState(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const fileInputRef = useRef(null);

  const counts = [
    ["requests & documents", data?.requests?.length || 0],
    ["tasks", data?.tasks?.length || 0],
    ["inventory items", data?.inventory?.length || 0],
    ["inventory records", data?.inventoryRecords?.length || 0],
  ];

  function exportBackup() {
    const backup = {
      app: "DeptDesk",
      version: 1,
      exportedAt: new Date().toISOString(),
      requests: data.requests,
      tasks: data.tasks,
      inventory: data.inventory,
      inventoryRecords: data.inventoryRecords,
      settings,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
    );
    const link = Object.assign(document.createElement("a"), {
      href: url,
      download: `deptdesk-backup-${new Date().toISOString().slice(0, 10)}.json`,
    });
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    onNotice({ type: "success", text: "Backup downloaded." });
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const keys = ["requests", "tasks", "inventory", "inventoryRecords"];
      if (parsed?.app !== "DeptDesk" || !keys.every((k) => Array.isArray(parsed[k]))) {
        throw new Error("Invalid backup");
      }
      setIsConfirmingClear(false);
      setPendingImport({ fileName: file.name, backup: parsed });
      onNotice(null);
    } catch {
      setPendingImport(null);
      onNotice({ type: "error", text: "That file is not a valid DeptDesk backup." });
    }
  }

  function confirmImport() {
    const { backup } = pendingImport;
    data.setRequests(backup.requests);
    data.setTasks(backup.tasks);
    data.setInventory(backup.inventory);
    data.setInventoryRecords(backup.inventoryRecords);
    if (isPlainObject(backup.settings)) {
      onSettingsChange?.({ ...DEFAULT_SETTINGS, ...backup.settings });
    }
    setPendingImport(null);
    onNotice({ type: "success", text: "Backup restored." });
  }

  function confirmClear() {
    data.setRequests([]);
    data.setTasks([]);
    data.setInventory([]);
    data.setInventoryRecords([]);
    setIsConfirmingClear(false);
    onNotice({ type: "success", text: "All office data was cleared." });
  }

  return (
    <div role="tabpanel" id="settings-panel-data" aria-labelledby="settings-tab-data">
      <p className="system-hint">
        DeptDesk currently stores all office data in this browser only. Download
        a backup regularly, and before clearing browser data or switching computers.
      </p>
      <ul className="system-data-counts">
        {counts.map(([label, count]) => (
          <li key={label}>
            <strong>{count}</strong> {label}
          </li>
        ))}
      </ul>

      <div className="system-data-row">
        <div>
          <strong>Download backup</strong>
          <span>Save every request, task, and inventory record as a JSON file.</span>
        </div>
        <button type="button" className="primary-button" onClick={exportBackup}>
          Download
        </button>
      </div>

      <div className="system-data-row">
        <div>
          <strong>Restore from backup</strong>
          <span>Replace the current data with a DeptDesk backup file.</span>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleImportFile}
        />
      </div>

      {pendingImport && (
        <div className="system-confirm" role="alert">
          <p>
            Restore <strong>{pendingImport.fileName}</strong>? This replaces your
            current data with {pendingImport.backup.requests.length} requests,{" "}
            {pendingImport.backup.tasks.length} tasks, and{" "}
            {pendingImport.backup.inventory.length} inventory items.
          </p>
          <div className="system-actions">
            <span className="system-actions__spacer" />
            <button type="button" className="secondary-button" onClick={() => setPendingImport(null)}>
              Cancel
            </button>
            <button type="button" className="primary-button" onClick={confirmImport}>
              Restore backup
            </button>
          </div>
        </div>
      )}

      <div className="system-data-row system-data-row--danger">
        <div>
          <strong>Clear all office data</strong>
          <span>Permanently delete every request, task, and inventory record in this browser.</span>
        </div>
        <button
          type="button"
          className="system-danger-button"
          onClick={() => {
            setPendingImport(null);
            setIsConfirmingClear(true);
          }}
        >
          Clear data
        </button>
      </div>

      {isConfirmingClear && (
        <div className="system-confirm system-confirm--danger" role="alert">
          <p>This cannot be undone. Download a backup first if you might need this data again.</p>
          <div className="system-actions">
            <span className="system-actions__spacer" />
            <button type="button" className="secondary-button" onClick={() => setIsConfirmingClear(false)}>
              Cancel
            </button>
            <button type="button" className="system-danger-button" onClick={confirmClear}>
              Yes, clear everything
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsDataTab;

