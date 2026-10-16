import { useEffect, useMemo } from "react";
import {
  initialInventory,
  initialRequests,
  initialTasks,
} from "../utils/mockData";
import { useStoredState } from "./useStoredState";

const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export function useOfficeData() {
  const [requests, setRequests] = useStoredState(
    "officeflow.requests.v2",
    initialRequests,
  );
  const [tasks, setTasks] = useStoredState("officeflow.tasks.v2", initialTasks);
  const [inventory, setInventory] = useStoredState(
    "officeflow.inventory.v5",
    initialInventory,
  );
  const [inventoryRecords, setInventoryRecords] = useStoredState(
    "officeflow.inventory-records.v5",
    [],
  );

  const safeTasks = useMemo(() => asArray(tasks), [tasks]);
  const safeInventory = useMemo(() => asArray(inventory), [inventory]);
  const safeInventoryRecords = useMemo(
    () => asArray(inventoryRecords),
    [inventoryRecords],
  );

  const normalizedRequests = useMemo(
    () =>
      asArray(requests).map((request) => {
        const sample = initialRequests.find((item) => item.id === request.id);
        return {
          ...sample,
          ...request,
          dateTime:
            request.dateTime ||
            sample?.dateTime ||
            request.history?.[0]?.dateTime ||
            "",
          type: request.type || sample?.type || "Document",
          office: request.office || request.location || sample?.location || "",
          history: Array.isArray(request.history)
            ? request.history
            : sample?.history || [],
        };
      }),
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
