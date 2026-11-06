import { useEffect, useMemo } from "react";
import {
  COLLECTIONS,
  useFirestoreCollection,
} from "../firebase/firestoreService";

const EMPTY_ARRAY = [];
const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export function useOfficeData() {
  const [requests, setRequests] = useFirestoreCollection(
    COLLECTIONS.REQUESTS,
    "officeflow.requests.v2",
    EMPTY_ARRAY,
  );
  const [tasks, setTasks] = useFirestoreCollection(
    COLLECTIONS.TASKS,
    "officeflow.tasks.v2",
    EMPTY_ARRAY,
  );
  const [inventory, setInventory] = useFirestoreCollection(
    COLLECTIONS.INVENTORY,
    "officeflow.inventory.v5",
    EMPTY_ARRAY,
  );
  const [inventoryRecords, setInventoryRecords] = useFirestoreCollection(
    COLLECTIONS.INVENTORY_RECORDS,
    "officeflow.inventory-records.v5",
    EMPTY_ARRAY,
  );

  const safeTasks = useMemo(() => asArray(tasks), [tasks]);
  const safeInventory = useMemo(() => asArray(inventory), [inventory]);
  const safeInventoryRecords = useMemo(
    () => asArray(inventoryRecords),
    [inventoryRecords],
  );

  const normalizedRequests = useMemo(
    () =>
      asArray(requests).map((request) => ({
        ...request,
        dateTime: request.dateTime || request.history?.[0]?.dateTime || "",
        type: request.type || "Document",
        office: request.office || request.location || "",
        history: Array.isArray(request.history) ? request.history : [],
      })),
    [requests],
  );

  useEffect(() => {
    if (JSON.stringify(requests) !== JSON.stringify(normalizedRequests)) {
      setRequests(normalizedRequests);
    }
  }, [requests, normalizedRequests, setRequests]);

  return {
    requests: normalizedRequests,
    setRequests,
    tasks: safeTasks,
    setTasks,
    inventory: safeInventory,
    setInventory,
    inventoryRecords: safeInventoryRecords,
    setInventoryRecords,
  };
}
