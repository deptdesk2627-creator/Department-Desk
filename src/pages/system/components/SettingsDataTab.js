import { useRef, useState } from "react";
import {
  CLEARED_AT_KEY,
  CLEARED_ITEMS_KEY,
  DATA_KEYS,
  DEFAULT_SETTINGS,
  isPlainObject,
} from "../../../constants/system";
import { supabase } from "../../../supabase/supabaseClient";
import { csvValue } from "../../transactions/utils/transactionHelpers";

function triggerDownload(filename, content, mimeType) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function SettingsDataTab({ data, settings, onSettingsChange, onNotice }) {
  const [pendingImport, setPendingImport] = useState(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [localNotice, setLocalNotice] = useState(null);
  const fileInputRef = useRef(null);

  function showNotice(nextNotice) {
    setLocalNotice(nextNotice);
    onNotice?.(nextNotice);
  }

  const counts = [
    ["Requests & docs", data?.requests?.length || 0],
    ["Tasks", data?.tasks?.length || 0],
    ["Supply items", data?.inventory?.length || 0],
    ["Supply logs", data?.inventoryRecords?.length || 0],
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
    const filename = `deptdesk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    triggerDownload(
      filename,
      JSON.stringify(backup, null, 2),
      "application/json",
    );
    onNotice?.({ type: "success", text: "Backup downloaded." });
  }

  function downloadCsv(baseName, headers, rows) {
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `${baseName}-${dateStamp}.csv`;
    const csvLines = [headers, ...rows].map((row) =>
      row.map(csvValue).join(","),
    );
    triggerDownload(filename, csvLines.join("\r\n"), "text/csv;charset=utf-8");
    onNotice?.({ type: "success", text: `Downloaded ${filename}.` });
  }

  const csvReports = [
    {
      label: "Export Requests CSV",
      onClick: () =>
        downloadCsv(
          "deptdesk-requests",
          [
            "ID",
            "Direction",
            "Document",
            "Requester / Sender",
            "Office",
            "Category",
            "Cabinet / Drawer",
            "Status",
            "Date",
          ],
          (data?.requests || []).map((req) => [
            req?.id,
            req?.direction || "outgoing",
            req?.document || req?.description,
            req?.student,
            req?.office || req?.location,
            req?.category || req?.type,
            req?.fileLocation,
            req?.status,
            req?.dateTime,
          ]),
        ),
    },
    {
      label: "Export Tasks CSV",
      onClick: () =>
        downloadCsv(
          "deptdesk-tasks",
          ["ID", "Title", "Priority", "Status", "Due Date", "Completed"],
          (data?.tasks || []).map((task) => [
            task?.id,
            task?.title,
            task?.priority,
            task?.status,
            task?.due,
            task?.done ? "Yes" : "No",
          ]),
        ),
    },
    {
      label: "Export Inventory CSV",
      onClick: () =>
        downloadCsv(
          "deptdesk-inventory",
          [
            "ID",
            "Item Name",
            "Quantity",
            "Unit",
            "Low Stock At",
            "Category",
            "Usage Type",
          ],
          (data?.inventory || []).map((item) => [
            item?.item_id ?? item?.productId ?? item?.id,
            item?.name,
            item?.quantity,
            item?.unit,
            item?.lowStockAt,
            item?.category,
            item?.usageType,
          ]),
        ),
    },
  ];

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const keys = ["requests", "tasks", "inventory", "inventoryRecords"];
      if (
        parsed?.app !== "DeptDesk" ||
        !keys.every((k) => Array.isArray(parsed[k]))
      ) {
        throw new Error("Invalid backup");
      }
      setIsConfirmingClear(false);
      setPendingImport({ fileName: file.name, backup: parsed });
      onNotice?.(null);
    } catch {
      setPendingImport(null);
      onNotice?.({
        type: "error",
        text: "That file is not a valid DeptDesk backup.",
      });
    }
  }

  function confirmImport() {
    const { backup } = pendingImport;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(CLEARED_AT_KEY);
        window.localStorage.removeItem(CLEARED_ITEMS_KEY);
      }
    } catch {
      // Ignore storage errors
    }
    data.setRequests(backup.requests);
    data.setTasks(backup.tasks);
    data.setInventory(backup.inventory);
    data.setInventoryRecords(backup.inventoryRecords);
    if (isPlainObject(backup.settings)) {
      onSettingsChange?.({ ...DEFAULT_SETTINGS, ...backup.settings });
    }
    setPendingImport(null);
    showNotice({ type: "success", text: "Backup restored." });
  }

  async function confirmClear() {
    setIsClearing(true);
    const today = new Date().toISOString().slice(0, 10);
    const clearedAt = new Date().toISOString();
    const existingItemIds = (data?.inventory || [])
      .map((item) => Number(item?.item_id ?? item?.id))
      .filter(Number.isFinite);

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CLEARED_AT_KEY, clearedAt);
        window.localStorage.setItem(
          CLEARED_ITEMS_KEY,
          JSON.stringify(existingItemIds),
        );
      }
    } catch {
      // Ignore storage errors
    }

    if (typeof supabase?.from === "function") {
      try {
        const itemsRes = await supabase
          .from("items_masterlist")
          .select("item_id")
          .is("archived_at", null);
        if (Array.isArray(itemsRes?.data)) {
          itemsRes.data.forEach((row) => {
            const id = Number(row?.item_id);
            if (Number.isFinite(id) && !existingItemIds.includes(id)) {
              existingItemIds.push(id);
            }
          });
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              CLEARED_ITEMS_KEY,
              JSON.stringify(existingItemIds),
            );
          }
        }
      } catch {
        // Ignore query error
      }

      await Promise.allSettled([
        supabase.from("transaction_history").delete().gte("record_id", 0),
        supabase.from("transactions_ongoing").delete().gte("request_id", 0),
        supabase.from("transactions_incoming").delete().gte("request_id", 0),
        supabase.from("tasks").delete().gte("task_id", 0),
        supabase
          .from("inventory_transactions")
          .delete()
          .gte("transaction_id", 0),
        supabase
          .from("items_masterlist")
          .update({ archived_at: today })
          .is("archived_at", null),
      ]);
    }

    data.setRequests([]);
    data.setTasks([]);
    data.setInventory([]);
    data.setInventoryRecords([]);

    try {
      if (typeof window !== "undefined") {
        Object.values(DATA_KEYS).forEach((key) => {
          window.localStorage.setItem(key, "[]");
        });
      }
    } catch {
      // Ignore storage errors
    }

    setIsClearing(false);
    setIsConfirmingClear(false);
    showNotice({ type: "success", text: "All office data was cleared." });
  }

  return (
    <section className="card panel system-data-card">
      <div className="panel-heading">
        <div>
          <h2>Data &amp; backup</h2>
          <p>
            DeptDesk stores all office records in this browser. Download a
            backup regularly before clearing browser data or switching devices.
          </p>
        </div>
      </div>

      <div className="system-section-body">
        <ul className="system-data-counts">
          {counts.map(([label, count]) => (
            <li key={label}>
              <strong>{count}</strong>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <div className="system-data-actions-grid">
          <div className="system-data-row">
            <div>
              <strong>Download backup</strong>
              <span>Save all requests, tasks, and inventory logs as JSON.</span>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={exportBackup}
            >
              Download
            </button>
          </div>

          <div className="system-data-row">
            <div>
              <strong>Restore from backup</strong>
              <span>Replace current data with a saved backup file.</span>
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

          <div className="system-data-row system-data-row--danger">
            <div>
              <strong>Clear all office data</strong>
              <span>Permanently delete every record stored in this browser.</span>
            </div>
            <button
              type="button"
              className="system-danger-button"
              onClick={() => {
                setPendingImport(null);
                setLocalNotice(null);
                setIsConfirmingClear(true);
              }}
            >
              Clear data
            </button>
          </div>
        </div>

        {localNotice && (
          <p
            className={`system-notice system-notice--${localNotice.type}`}
            style={{ marginTop: "14px" }}
            role={localNotice.type === "error" ? "alert" : "status"}
          >
            {localNotice.text}
          </p>
        )}

        {isConfirmingClear && (
          <div className="system-confirm system-confirm--danger" role="alert">
            <p>
              This cannot be undone. Download a backup first if you might need
              this data again.
            </p>
            <div className="system-actions">
              <span className="system-actions__spacer" />
              <button
                type="button"
                className="secondary-button"
                disabled={isClearing}
                onClick={() => setIsConfirmingClear(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="system-danger-button"
                disabled={isClearing}
                onClick={confirmClear}
              >
                {isClearing ? "Clearing..." : "Yes, clear everything"}
              </button>
            </div>
          </div>
        )}

        <div className="system-csv-bar">
          <div>
            <strong>Export CSV reports (Excel / Sheets)</strong>
            <span>
              Download spreadsheet-ready tables for requests, tasks, or supplies.
            </span>
          </div>
          <div className="system-csv-bar__actions">
            {csvReports.map((report) => (
              <button
                key={report.label}
                type="button"
                className="secondary-button"
                onClick={report.onClick}
              >
                {report.label}
              </button>
            ))}
          </div>
        </div>

        {pendingImport && (
          <div className="system-confirm" role="alert">
            <p>
              Restore <strong>{pendingImport.fileName}</strong>? This replaces
              your current data with {pendingImport.backup.requests.length}{" "}
              requests, {pendingImport.backup.tasks.length} tasks, and{" "}
              {pendingImport.backup.inventory.length} inventory items.
            </p>
            <div className="system-actions">
              <span className="system-actions__spacer" />
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPendingImport(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={confirmImport}
              >
                Restore backup
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default SettingsDataTab;
