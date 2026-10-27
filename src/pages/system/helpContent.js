// Help & FAQ content. Each section lists the roles that should see it so
// Faculty & Staff only get answers about the supplies portal.

const ADMIN_ROLES = ["secretary", "dean"];
const ALL_ROLES = ["secretary", "dean", "staff"];

export const FAQ_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting started",
    roles: ALL_ROLES,
    items: [
      {
        q: "What can my role do?",
        a: "The Secretary is the main administrator: she logs requests and documents, manages tasks, and runs the inventory. The Dean can monitor requests and documents (view only), create and update tasks, and review inventory. Faculty & Staff use the Office Supplies portal to borrow, use, and return supplies. Open My profile to see exactly what your role can do.",
      },
      {
        q: "Where is my data saved?",
        a: "Right now DeptDesk saves everything in this browser on this computer. Clearing your browser data, using private mode, or switching to another computer or browser will not show the same records. The Secretary can download a backup under Settings → Data & backup.",
      },
      {
        q: "How does the search bar work?",
        a: "The search bar at the top looks through requests, tasks, and supplies and filters the page you are on. Faculty & Staff only see supplies in search results.",
      },
      {
        q: "How do I switch to dark mode?",
        a: "Use the sun/moon switch in the top bar, or go to Settings → Appearance. You can also choose whether the sidebar starts expanded or collapsed.",
      },
    ],
  },
  {
    id: "transactions",
    title: "Transactions & requests",
    roles: ADMIN_ROLES,
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
        a: "Choose Return on the item you borrowed. You can only return up to the quantity still borrowed by you. If a student assistant or representative returns it for you, type their name in “Returned by”.",
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

