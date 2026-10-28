// Front-end only role rules. When a backend is added later, the server
// should enforce these same rules — this file only controls what the UI shows.

export const ROLES = {
  secretary: {
    id: "secretary",
    label: "Secretary",
    name: "Ma'am Aubrey",
    initials: "MA",
    description: "Main Administrator",
    pages: ["dashboard", "transactions", "tasks", "inventory"],
    can: {
      editDocuments: true,
      createRequests: true,
      createTasks: true,
      editTasks: true,
      manageInventory: true,
      recordInventory: true,
    },
  },
  dean: {
    id: "dean",
    label: "Dean",
    name: "Ma'am Beth",
    initials: "MB",
    description: "Supervisor",
    pages: ["dashboard", "transactions", "tasks", "inventory"],
    can: {
      editDocuments: false, // monitor only; cannot modify document histories
      createRequests: false,
      createTasks: true,
      editTasks: true,
      manageInventory: false, // review statistics only
      recordInventory: false,
    },
  },
  staff: {
    id: "staff",
    label: "Faculty & Staff",
    name: "Faculty / Staff",
    initials: "FS",
    description: "Inventory Portal",
    pages: ["staff-inventory"],
    can: {
      editDocuments: false,
      createRequests: false,
      createTasks: false,
      editTasks: false,
      manageInventory: false,
      recordInventory: true,
    },
  },
};

export const ROLE_LIST = Object.values(ROLES);

export function getRole(roleId) {
  return ROLES[roleId] || ROLES.secretary;
}

export function canAccessPage(roleId, page) {
  return (
    getRole(roleId).pages.includes(page) ||
    ["profile", "settings", "help"].includes(page)
  );
}

export function getHomePage(roleId) {
  return getRole(roleId).pages[0];
}
