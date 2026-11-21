import { useRef, useState } from "react";
import { ConfirmModal } from "../../../components/ui";
import {
  CLEARED_AT_KEY,
  CLEARED_ITEMS_KEY,
  DATA_KEYS,
  DEFAULT_SETTINGS,
  isPlainObject,
} from "../../../constants/system";
import { supabase } from "../../../supabase/supabaseClient";
import { cabinetGroups, UNFILED_LOCATION } from "../../transactions/constants";
import { csvValue } from "../../transactions/utils/transactionHelpers";
import { SystemIcon } from "./SystemIcons";

function resolveLocationLabel(row) {
  const normalize = (val) => String(val || "").trim().toLowerCase();
  const cabinet = normalize(row.cabinet);
  const group = cabinetGroups.find(
    (candidate) =>
      normalize(candidate.title) === cabinet ||
      (candidate.id === "cabinet-3-staff" &&
        cabinet === "cict cabinet 3 (college staff)") ||
      (candidate.id === "cabinet-4-sec" &&
        cabinet === "cict cabinet 4 (college sec)") ||
      (candidate.id === "cabinet-dean" && cabinet === "college dean cabinet"),
  );
  if (!group) return UNFILED_LOCATION;
  if (group.id === "cabinet-dean") {
    const drawerLabel = normalize(row.drawer || row.section);
    return (
      group.drawers.find(
        (drawer) =>
          normalize(drawer.id.slice("College Dean - ".length)) === drawerLabel,
      )?.id || UNFILED_LOCATION
    );
  }
  const drawerNumber = normalize(row.drawer).match(/^cab[34]\s+d([1-4])$/)?.[1];
  const drawerIndex = Number(drawerNumber) - 1;
  return group.drawers[drawerIndex]?.id || UNFILED_LOCATION;
}

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
  const [isRestoring, setIsRestoring] = useState(false);
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
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Backup file exceeds maximum allowed size (5 MB).");
      }
      const parsed = JSON.parse(await file.text());
      const keys = ["requests", "tasks", "inventory", "inventoryRecords"];
      if (
        parsed?.app !== "DeptDesk" ||
        !keys.every(
          (k) => Array.isArray(parsed[k]) && parsed[k].every(isPlainObject),
        )
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

  async function confirmImport() {
    const { backup } = pendingImport;
    setIsRestoring(true);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(CLEARED_AT_KEY);
        window.localStorage.removeItem(CLEARED_ITEMS_KEY);
      }
    } catch {
      // Ignore storage errors
    }

    let syncedToSupabase = false;
    if (
      typeof supabase?.auth?.getUser === "function" &&
      typeof supabase?.from === "function"
    ) {
      try {
        const authResult = await supabase.auth.getUser();
        const authUserId = authResult?.data?.user?.id;
        if (authUserId) {
          const userResult = await supabase
            .from("users")
            .select("user_id")
            .eq("auth_user_id", authUserId)
            .maybeSingle();
          const currentUserId = userResult?.data?.user_id;

          if (currentUserId) {
            const nowIso = new Date().toISOString();
            const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

            // Restore inventory items (unarchive or insert new)
            const existingItemsRes = await supabase
              .from("items_masterlist")
              .select("item_id, item_name");
            const existingByName = new Map(
              (Array.isArray(existingItemsRes?.data)
                ? existingItemsRes.data
                : []
              ).map((row) => [
                String(row.item_name || "").trim().toLowerCase(),
                row.item_id,
              ]),
            );

            for (const item of backup.inventory) {
              const name = String(item.name || item.item_name || "").trim();
              if (!name) continue;
              const existingId = existingByName.get(name.toLowerCase());
              const stock = Math.max(0, Number(item.quantity ?? item.stock_onhand ?? 0) || 0);
              const minStock = Math.max(0, Number(item.lowStockAt ?? item.min_stock ?? 0) || 0);
              const usageType = item.usageType || item.category || "Usable";
              if (existingId) {
                await supabase
                  .from("items_masterlist")
                  .update({
                    stock_onhand: stock,
                    unit: String(item.unit || "units"),
                    min_stock: minStock,
                    archived_at: null,
                  })
                  .eq("item_id", existingId);
              } else {
                await supabase.from("items_masterlist").insert({
                  item_name: name,
                  stock_onhand: stock,
                  unit: String(item.unit || "units"),
                  min_stock: minStock,
                  category: usageType,
                  classification:
                    item.classification ||
                    (usageType === "Borrowable" ? "Equipment" : "Item"),
                  archived_at: null,
                  created_at: todayStr,
                });
              }
            }

            // Replace existing tasks for the current user
            await supabase
              .from("tasks")
              .delete()
              .eq("tasks_user_id", currentUserId);

            if (backup.tasks.length > 0) {
              const taskRows = backup.tasks
                .filter((task) => String(task?.title || "").trim())
                .map((task) => {
                  const status =
                    task.status || (task.done ? "Done" : "Not started");
                  return {
                    task_name: String(task.title).trim(),
                    priority_level: task.priority || "Medium",
                    status,
                    due_date: task.due || todayStr,
                    tasks_user_id: currentUserId,
                    description: task.description || null,
                    completed_at: status === "Done" ? nowIso : null,
                    created_at: nowIso,
                    updated_at: nowIso,
                  };
                });
              if (taskRows.length > 0) {
                await supabase.from("tasks").insert(taskRows);
              }
            }

            // Replace existing outgoing and incoming requests
            await Promise.all([
              supabase.from("transaction_history").delete().gte("request_id", 0),
              supabase.from("transactions_ongoing").delete().gte("request_id", 0),
              supabase.from("transactions_incoming").delete().gte("request_id", 0),
            ]);

            if (backup.requests.length > 0) {
              const [officesRes, locationsRes] = await Promise.all([
                supabase.from("offices").select("office_id, name"),
                supabase
                  .from("file_location")
                  .select("location_id, drawer, cabinet, section"),
              ]);
              const officesByName = new Map(
                (Array.isArray(officesRes?.data) ? officesRes.data : []).map(
                  (o) => [String(o.name || "").trim().toLowerCase(), Number(o.office_id)],
                ),
              );
              const locationsByLabel = new Map(
                (Array.isArray(locationsRes?.data) ? locationsRes.data : []).map(
                  (loc) => [resolveLocationLabel(loc).toLowerCase(), Number(loc.location_id)],
                ),
              );
              const internalOfficeId =
                officesByName.get("secretary's office") ||
                Array.from(officesByName.values())[0];

              if (internalOfficeId) {
                for (const req of backup.requests) {
                  const docName = String(req.document || req.description || "").trim();
                  const studentName = String(req.student || "").trim();
                  if (!docName || !studentName) continue;
                  const officeLabel = String(req.office || req.location || "").trim();
                  let targetOfficeId = officesByName.get(officeLabel.toLowerCase());
                  if (!targetOfficeId && officeLabel) {
                    const insertedOffice = await supabase
                      .from("offices")
                      .insert({ name: officeLabel })
                      .select("office_id, name")
                      .single();
                    if (insertedOffice?.data?.office_id) {
                      targetOfficeId = Number(insertedOffice.data.office_id);
                      officesByName.set(officeLabel.toLowerCase(), targetOfficeId);
                    }
                  }
                  const resolvedOfficeId = targetOfficeId || internalOfficeId;
                  const isIncoming = req.direction === "incoming";
                  const fileLocLabel = String(req.fileLocation || "").trim();
                  const resolvedLocationId =
                    fileLocLabel && fileLocLabel !== UNFILED_LOCATION
                      ? locationsByLabel.get(fileLocLabel.toLowerCase()) || null
                      : null;

                  let resolvedForwardedId = null;
                  const forwardedLabel = String(req.forwardedTo || "").trim();
                  if (
                    isIncoming &&
                    forwardedLabel &&
                    forwardedLabel !== "Not sent out"
                  ) {
                    if (forwardedLabel === "Returned to Sender") {
                      resolvedForwardedId = resolvedOfficeId;
                    } else {
                      resolvedForwardedId =
                        officesByName.get(forwardedLabel.toLowerCase()) || null;
                      if (!resolvedForwardedId) {
                        const insertedFwdOffice = await supabase
                          .from("offices")
                          .insert({ name: forwardedLabel })
                          .select("office_id, name")
                          .single();
                        if (insertedFwdOffice?.data?.office_id) {
                          resolvedForwardedId = Number(
                            insertedFwdOffice.data.office_id,
                          );
                          officesByName.set(
                            forwardedLabel.toLowerCase(),
                            resolvedForwardedId,
                          );
                        }
                      }
                    }
                  }

                  const parsedDate = new Date(req.dateTime || nowIso).getTime();
                  const unixDate = Number.isFinite(parsedDate)
                    ? Math.floor(parsedDate / 1000)
                    : Math.floor(Date.now() / 1000);
                  const baseRow = {
                    request_name: docName,
                    requested_by: studentName,
                    request_date: unixDate,
                    origin_office: isIncoming ? resolvedOfficeId : internalOfficeId,
                    current_office: isIncoming ? internalOfficeId : resolvedOfficeId,
                    category: req.category || req.type || "Document",
                    status: req.status || (isIncoming ? "Received" : "Pending"),
                    notes: req.notes || req.description || null,
                    released_date: null,
                    req_user_id: currentUserId,
                    file_location: resolvedLocationId,
                    created_at: nowIso,
                    updated_at: nowIso,
                  };
                  if (isIncoming) {
                    await supabase.from("transactions_incoming").insert({
                      ...baseRow,
                      signature_status: req.signedByOffice || "Unsigned",
                      forwarded_to: resolvedForwardedId,
                    });
                  } else {
                    await supabase.from("transactions_ongoing").insert(baseRow);
                  }
                }
              }
            }

            syncedToSupabase = true;
          }
        }
      } catch (restoreError) {
        console.error("Could not sync restored backup to Supabase.", restoreError);
      }
    }

    data.setRequests(backup.requests);
    data.setTasks(backup.tasks);
    data.setInventory(backup.inventory);
    data.setInventoryRecords(backup.inventoryRecords);
    if (isPlainObject(backup.settings)) {
      onSettingsChange?.({ ...DEFAULT_SETTINGS, ...backup.settings });
    }
    setPendingImport(null);
    setIsRestoring(false);
    showNotice({
      type: "success",
      text: syncedToSupabase
        ? "Backup restored and synced to Supabase."
        : "Backup restored.",
    });
  }

  async function confirmClear() {
    setIsClearing(true);
    const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

    let clearFailed = false;
    if (typeof supabase?.from === "function") {
      const results = await Promise.allSettled([
        supabase.from("transaction_history").delete().gte("request_id", 0),
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
      clearFailed = results.some(
        (res) => res.status === "rejected" || res.value?.error,
      );
    }

    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(CLEARED_AT_KEY);
        window.localStorage.removeItem(CLEARED_ITEMS_KEY);
        Object.values(DATA_KEYS).forEach((key) => {
          window.localStorage.setItem(key, "[]");
        });
      }
    } catch {
      // Ignore storage errors
    }

    data.setRequests([]);
    data.setTasks([]);
    data.setInventory([]);
    data.setInventoryRecords([]);

    setIsClearing(false);
    setIsConfirmingClear(false);
    showNotice(
      clearFailed
        ? {
            type: "error",
            text: "Local workspace was cleared, but some database records could not be deleted. Check your permissions and try again.",
          }
        : { type: "success", text: "All office data was cleared." },
    );
  }

  return (
    <>
      <section className="card system-card">
        <div className="system-card-head">
          <div className="system-card-head__title">
            <span className="system-card-icon">
              <SystemIcon name="database" />
            </span>
            <div>
              <h2>Data &amp; backup</h2>
              <p>
                Download a full JSON backup or export spreadsheet-ready CSV
                reports for your office records.
              </p>
            </div>
          </div>
          <span className="system-status-badge system-status-badge--neutral">
            JSON &amp; CSV
          </span>
        </div>

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
            <div className="system-data-row__head">
              <span className="system-switch-row__icon">
                <SystemIcon name="download" size={17} />
              </span>
              <div>
                <strong>Download backup</strong>
                <span>
                  Save all requests, tasks, and inventory logs as JSON.
                </span>
              </div>
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
            <div className="system-data-row__head">
              <span className="system-switch-row__icon">
                <SystemIcon name="upload" size={17} />
              </span>
              <div>
                <strong>Restore from backup</strong>
                <span>Replace current data with a saved backup file.</span>
              </div>
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
        </div>

        <div className="system-csv-bar">
          <div>
            <strong>Export CSV reports (Excel / Sheets)</strong>
            <span>
              Download spreadsheet-ready tables for requests, tasks, or
              supplies.
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

        {localNotice && (
          <p
            className={`system-notice system-notice--${localNotice.type}`}
            style={{ marginTop: "14px" }}
            role={localNotice.type === "error" ? "alert" : "status"}
          >
            {localNotice.text}
          </p>
        )}

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
                disabled={isRestoring}
                onClick={() => setPendingImport(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={isRestoring}
                onClick={confirmImport}
              >
                {isRestoring ? "Restoring..." : "Restore backup"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card system-danger-card">
        <div className="system-danger-card__head">
          <span className="system-danger-card__title">
            <SystemIcon name="alertTriangle" size={17} />
            Danger Zone
          </span>
          <span className="system-danger-card__tag">Irreversible Actions</span>
        </div>
        <div className="system-danger-card__body">
          <div className="system-danger-row">
            <div className="system-danger-row__text">
              <strong>Clear all office data</strong>
              <span>
                Permanently delete every request, task, and supply record stored
                in this workspace. Download a backup first if needed.
              </span>
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
      </section>

      <ConfirmModal
        isOpen={isConfirmingClear}
        onClose={() => setIsConfirmingClear(false)}
        onConfirm={confirmClear}
        eyebrow="DANGER ZONE · IRREVERSIBLE ACTION"
        title="Clear all office data?"
        titleId="confirm-clear-data-title"
        message="This will permanently delete every request, task, and supply record stored in this workspace. This cannot be undone. Download a backup first if you might need this data again."
        confirmLabel={isClearing ? "Clearing..." : "Yes, clear everything"}
        cancelLabel="Cancel"
        danger
        disabled={isClearing}
      />
    </>
  );
}

export default SettingsDataTab;
