import DeanDashboard from "./DeanDashboard";
import DeanInventory from "./DeanInventory";
import DeanTasks from "./DeanTasks";
import DeanTransactions from "./DeanTransactions";

// Dean (supervisor): monitors documents and inventory, manages tasks.
export function getDeanPages(context) {
  return {
    dashboard: <DeanDashboard {...context} />,
    transactions: <DeanTransactions {...context} />,
    tasks: <DeanTasks {...context} />,
    inventory: <DeanInventory {...context} />,
  };
}
