// Help & FAQ content. Each section lists the roles that should see it so
// Faculty & Staff only get answers about the supplies portal.

const ADMIN_ROLES = ["secretary", "dean"];
const ALL_ROLES = ["secretary", "dean", "staff"];

export const WORKFLOW_GUIDES = [
  {
    id: "outgoing",
    title: "Outgoing requests flow",
    description: "Requests and documents sent from our office to another unit.",
    steps: ["Pending", "Under Review", "Action Needed", "Approved", "Archived"],
  },
  {
    id: "incoming",
    title: "Incoming documents flow",
    description:
      "Documents received from other offices for signature, filing, or release.",
    steps: [
      "Received",
      "For Signature",
      "Signed by Office",
      "Sent Out",
      "Archived",
    ],
  },
  {
    id: "cabinets",
    title: "Physical cabinet assignments",
    description:
      "Where signed or filed physical copies are stored in the Cabinet Locator.",
    cabinets: [
      "CICT Cabinet 3 (D1–D4 · College Staff)",
      "CICT Cabinet 4 (D1–D4 · College Sec)",
      "College Dean Cabinet (Instruction, Research & Extension, Administration)",
    ],
  },
];

export const KEYBOARD_SHORTCUTS = [
  { keys: "Ctrl + K", label: "Focus the global search bar from anywhere" },
  { keys: "Esc", label: "Close open modals, detail drawers, or top-bar menus" },
  { keys: "↑ / ↓", label: "Move through items in the profile dropdown menu" },
  { keys: "Enter", label: "Submit active forms or activate the focused action" },
];

export const FAQ_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting started",
    roles: ALL_ROLES,
    items: [
      {
        q: "What can my role do?",
        a: "The Secretary is the main administrator: she logs requests and documents, manages tasks, and runs the inventory. The Dean can monitor requests and documents (view only), create and update tasks, and review inventory. Faculty & Staff use the Office Supplies portal to borrow, use, and return supplies. Open My profile to see exactly what your role can do.",
        page: "profile",
        actionLabel: "Open My profile",
      },
      {
        q: "Where is my data saved?",
        a: "Inventory masterlist and transactions sync with Supabase, while workspace preferences and backups are managed under Settings → Data & backup. The Secretary can download JSON backups or CSV reports at any time.",
        page: "settings",
        actionLabel: "Open Settings",
      },
      {
        q: "How does the search bar work?",
        a: "The search bar at the top looks through requests, tasks, and supplies and filters the page you are on. Press Ctrl + K to jump straight to it. Faculty & Staff only see supplies in search results.",
      },
      {
        q: "How do I switch to dark mode or compact tables?",
        a: "Use the sun/moon switch in the top bar, or go to Settings → Appearance & layout to configure light/dark mode, table density, and default workspace views.",
        page: "settings",
        actionLabel: "Open Settings",
      },
    ],
  },
  {
    id: "transactions",
    title: "Transactions & requests",
    roles: ADMIN_ROLES,
    page: "transactions",
    actionLabel: "Open Request Tracker",
    items: [
      {
        q: "What is the difference between Outgoing and Incoming?",
        a: "Outgoing requests are documents or service requests our office sends to another office. Incoming documents are received from other offices and may need our review, signature, or release.",
      },
      {
        q: "What do the outgoing statuses mean?",
        a: "Pending: logged but not yet acted on. Under Review: being processed by the receiving office. Action Needed: waiting on something from us or the requester. Approved: finished. Archived: kept for records only.",
      },
      {
        q: "How do I track an incoming document?",
        a: "Incoming documents move through Received → For Signature → Signed by Office → Sent Out → Archived. You can also record who signed it (Secretary, Dean, or both) and where it was forwarded.",
      },
      {
        q: "How does the Cabinet Locator work?",
        a: "Switch to Cabinet Locator in the Request Tracker to see physical folders grouped by CICT Cabinet 3 (College Staff), CICT Cabinet 4 (College Sec), and the College Dean Cabinet. Documents still in progress appear in the Unfiled tray until assigned to a drawer.",
      },
      {
        q: "How can I filter requests by office, category, or cabinet?",
        a: "Use the search bar and dropdowns directly above the status filter pills in the Request Tracker to filter by office, category, or specific cabinet drawer, and click Clear filters to reset.",
      },
      {
        q: "Why can't the Dean edit requests?",
        a: "The Dean has a monitoring role so that document histories stay accurate. New entries and updates are made by the Secretary.",
        roles: ["dean", "secretary"],
      },
    ],
  },
  {
    id: "tasks",
    title: "Tasks",
    roles: ADMIN_ROLES,
    page: "tasks",
    actionLabel: "Open Task Management",
    items: [
      {
        q: "How do I add a task?",
        a: "Go to Task Management and use the add task button. Give it a title, priority, and due date so it shows up in the right filters and on the Dashboard.",
      },
      {
        q: "Can I update several tasks at once?",
        a: "Yes. Select tasks with the checkboxes in the table view, then mark them complete or delete them together.",
      },
      {
        q: "How do I find overdue or urgent work?",
        a: "Use the priority, status, and due date filters in Task Management. High-priority open tasks are also counted in the task summary.",
      },
    ],
  },
  {
    id: "inventory",
    title: "Supplies & inventory",
    roles: ALL_ROLES,
    page: "inventory",
    staffPage: "staff-inventory",
    actionLabel: "Open Supplies & Inventory",
    items: [
      {
        q: "What is the difference between Usable and Borrowable items?",
        a: "Usable items are consumables such as bond paper — they are used up and deducted from stock. Borrowable items are equipment such as keyboards or projectors — they are borrowed and must be returned.",
      },
      {
        q: "How do I borrow or use a supply?",
        a: "Open Office Supplies, find the item, and choose Borrow or Use. Enter the quantity and a short reason. The request is saved to your history right away.",
        roles: ["staff"],
      },
      {
        q: "How do I return an item?",
        a: "Choose Return on the item you borrowed. You can only return up to the quantity still borrowed by you. If a student assistant or representative returns it for you, type their name in “Returned by”. Once submitted, the secretary must confirm the return before available stock is restored.",
        roles: ["staff"],
      },
      {
        q: "When is an item marked low on stock?",
        a: "An item is low on stock when its quantity reaches the low-stock level set for that item. Low-stock items are highlighted on the Dashboard and in notifications.",
        roles: ADMIN_ROLES,
      },
      {
        q: "Where can I see who borrowed or used something?",
        a: "Open Supply & Inventory and switch to the records view. Every borrow, use, and return is logged with the person, quantity, and date.",
        roles: ADMIN_ROLES,
      },
    ],
  },
];

export function getFaqForRole(roleId) {
  return FAQ_SECTIONS.filter((section) => section.roles.includes(roleId))
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || item.roles.includes(roleId),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

