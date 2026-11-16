// Profile, settings, and help panel defaults. Everything here is stored in
// the browser (localStorage) until a backend is added.

export const SYSTEM_PAGES = ["profile", "settings", "help"];

export const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available at desk" },
  { value: "meeting", label: "In a meeting / class" },
  { value: "away", label: "Out of office" },
  { value: "leave", label: "On leave" },
];

export const PERMISSION_LABELS = {
  editDocuments: "Edit transaction and document records",
  createRequests: "Log requests and incoming documents",
  createTasks: "Create tasks",
  editTasks: "Update and complete tasks",
  manageInventory: "Add items and manage stock levels",
  recordInventory: "Borrow, use, and return supplies",
};

export const DEFAULT_SETTINGS = Object.freeze({
  sidebarDefault: "expanded",
  tableDensity: "comfortable",
  defaultRequestView: "table",
  defaultTaskView: "table",
  notifyRequests: true,
  notifyLowStock: true,
  notifyOverdueTasks: true,
  department: "",
  officeLocation: "",
  officeHours: "Mon–Fri, 8:00 AM – 5:00 PM",
  contactEmail: "secretary@deptdesk.edu",
  contactPhone: "",
});

// localStorage keys that hold office data, used by export / import / clear.
export const DATA_KEYS = {
  requests: "officeflow.requests.v2",
  tasks: "officeflow.tasks.v2",
  inventory: "officeflow.inventory.v5",
  inventoryRecords: "officeflow.inventory-records.v5",
};

export const CLEARED_AT_KEY = "officeflow.cleared-at";
export const CLEARED_ITEMS_KEY = "officeflow.cleared-item-ids";

export function isRecordCleared(createdAt) {
  if (!createdAt || typeof window === "undefined") return false;
  try {
    const clearedAt = window.localStorage.getItem(CLEARED_AT_KEY);
    if (!clearedAt) return false;
    const clearedTime = new Date(clearedAt).getTime();
    const recordTime = new Date(createdAt).getTime();
    if (!Number.isFinite(clearedTime) || !Number.isFinite(recordTime)) {
      return false;
    }
    return recordTime <= clearedTime;
  } catch {
    return false;
  }
}

export function isItemCleared(itemId) {
  if (itemId === undefined || itemId === null || typeof window === "undefined") {
    return false;
  }
  try {
    const raw = window.localStorage.getItem(CLEARED_ITEMS_KEY);
    if (!raw) return false;
    const ids = JSON.parse(raw);
    return Array.isArray(ids) && ids.includes(Number(itemId));
  } catch {
    return false;
  }
}

export function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getInitials(name, fallback = "") {
  const parts = String(name || "")
    .replace(/[^\p{L}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return fallback;
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || fallback;
}

export function getDefaultProfile(role) {
  return {
    name: role?.name || "",
    title: role?.label || "",
    email: role?.id ? `${role.id}@deptdesk.edu` : "",
    office: "",
    phone: "",
    status: "available",
    statusNote: "",
  };
}

export function getProfile(role, storedProfile) {
  const defaults = getDefaultProfile(role);
  if (!isPlainObject(storedProfile)) return defaults;
  return { ...defaults, ...storedProfile };
}

