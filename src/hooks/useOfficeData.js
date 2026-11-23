import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isItemCleared, isRecordCleared } from "../constants/system";
import { fetchTransactionsSnapshot } from "../pages/transactions/hooks/useSupabaseTransactions";
import { supabase } from "../supabase/supabaseClient";
import {
  INVENTORY_TRANSACTION_COLUMNS,
  MASTERLIST_COLUMNS,
  mapInventoryTransactions,
  mapMasterlistItem,
} from "../utils/inventory";
import { useStoredState } from "./useStoredState";

const EMPTY_ARRAY = [];
const TASK_COLUMNS =
  "task_id, task_name, priority_level, status, due_date, tasks_user_id, description, completed_at, created_at, updated_at";
const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

function mapTaskRow(row) {
  return {
    id: row.task_id,
    title: row.task_name,
    priority: row.priority_level || "Medium",
    status: row.status || "Not started",
    due: row.due_date || "",
    done: row.status === "Done",
    description: row.description || "",
  };
}

export function useOfficeData({
  isAuthenticated = false,
  roleId = "secretary",
} = {}) {
  const [requests, setRequests] = useStoredState(
    "officeflow.requests.v2",
    EMPTY_ARRAY,
  );
  const [tasks, setTasks] = useState(EMPTY_ARRAY);
  const [inventory, setInventory] = useStoredState(
    "officeflow.inventory.v5",
    EMPTY_ARRAY,
  );
  const [inventoryRecords, setInventoryRecords] = useStoredState(
    "officeflow.inventory-records.v5",
    EMPTY_ARRAY,
  );
  const [userAccounts, setUserAccounts] = useState(EMPTY_ARRAY);
  const [isReady, setIsReady] = useState(false);
  const syncGenerationRef = useRef(0);

  const syncFromSupabase = useCallback(
    async (isActive = () => true) => {
      if (
        typeof supabase?.auth?.getUser !== "function" ||
        typeof supabase?.from !== "function"
      ) {
        return;
      }

      const authResult = await supabase.auth.getUser();
      const authUserId = authResult?.data?.user?.id;
      if (!isActive() || authResult?.error || !authUserId) {
        return;
      }

      const userResult = await supabase
        .from("users")
        .select("user_id, username, auth_user_id")
        .eq("auth_user_id", authUserId)
        .maybeSingle();
      if (!isActive()) return;

      const linkedUser = !userResult?.error ? userResult?.data : null;

      const loaders = [];

      if (linkedUser?.user_id) {
        loaders.push(
          (async () => {
            const tasksQuery = supabase
              .from("tasks")
              .select(TASK_COLUMNS)
              .eq("tasks_user_id", linkedUser.user_id);
            const tasksResult =
              typeof tasksQuery?.order === "function"
                ? await tasksQuery.order("created_at", { ascending: false })
                : await tasksQuery;
            if (!isActive() || tasksResult?.error) return;

            const rows = (
              Array.isArray(tasksResult?.data) ? tasksResult.data : []
            ).filter((row) => !isRecordCleared(row.created_at));
            setTasks(rows.map(mapTaskRow));
          })(),
        );
      }

      loaders.push(
        (async () => {
          const masterQuery = supabase
            .from("items_masterlist")
            .select(MASTERLIST_COLUMNS)
            .is("archived_at", null);
          const itemsResult =
            typeof masterQuery?.order === "function"
              ? await masterQuery.order("item_name")
              : await masterQuery;
          if (!isActive()) return;

          const rawItems =
            !itemsResult?.error && Array.isArray(itemsResult?.data)
              ? itemsResult.data
              : null;
          if (rawItems) {
            setInventory(
              rawItems
                .filter((item) => !isItemCleared(item.item_id))
                .map(mapMasterlistItem),
            );
          }

          if (roleId === "staff" && !linkedUser?.user_id) {
            setInventoryRecords([]);
            return;
          }

          let txQuery = supabase
            .from("inventory_transactions")
            .select(INVENTORY_TRANSACTION_COLUMNS);
          if (roleId === "staff" && linkedUser?.user_id) {
            txQuery = txQuery.eq("is_issued_to", linkedUser.user_id);
          }
          const txPromise =
            typeof txQuery?.order === "function"
              ? txQuery.order("created_at", { ascending: false })
              : txQuery;

          let usersPromise;
          if (roleId === "staff") {
            usersPromise = Promise.resolve({
              data: linkedUser ? [linkedUser] : [],
              error: null,
            });
          } else {
            const usersQuery = supabase
              .from("users")
              .select("*");
            usersPromise =
              typeof usersQuery?.order === "function"
                ? usersQuery.order("username")
                : usersQuery;
          }

          const [transactionsResult, usersResult] = await Promise.all([
            txPromise,
            usersPromise,
          ]);
          if (!isActive()) return;

          const allUsersRows = Array.isArray(usersResult?.data)
            ? usersResult.data.filter((u) => u?.user_id && u?.username)
            : linkedUser
              ? [linkedUser]
              : [];
          if (roleId !== "staff") {
            setUserAccounts(
              allUsersRows.map((row) => ({
                id: row.user_id,
                userId: row.user_id,
                authUserId: row.auth_user_id || "",
                username: row.username || "User",
                email: row.email || "",
                role: row.role || "staff",
                approvalStatus: String(
                  row.approval_status || "approved",
                ).toLowerCase(),
                approvedBy: row.approved_by || "",
                approvedAt: row.approved_at || "",
                createdAt: row.created_at || "",
              })),
            );
          }

          if (transactionsResult?.error) return;

          const users = allUsersRows;
          const usersById = new Map(
            users.map((u) => [Number(u.user_id), u]),
          );
          const inventoryById = new Map(
            (rawItems || [])
              .map(mapMasterlistItem)
              .map((item) => [Number(item.item_id), item]),
          );
          const activeTransactions = (
            Array.isArray(transactionsResult?.data)
              ? transactionsResult.data
              : []
          ).filter((row) => !isRecordCleared(row.created_at));
          setInventoryRecords(
            mapInventoryTransactions(
              activeTransactions,
              inventoryById,
              usersById,
            ),
          );
        })(),
      );

      if (roleId === "staff") {
        setRequests([]);
      } else if (linkedUser?.user_id) {
        loaders.push(
          (async () => {
            const snapshot = await fetchTransactionsSnapshot();
            if (!isActive()) return;
            setRequests(snapshot.requests);
          })(),
        );
      }

      await Promise.allSettled(loaders);
    },
    [roleId, setInventory, setInventoryRecords, setRequests],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setIsReady(false);
      return undefined;
    }

    let isMounted = true;
    const generation = ++syncGenerationRef.current;
    const isActive = () => isMounted && syncGenerationRef.current === generation;
    setIsReady(false);

    let refreshTimer = null;

    const runSync = () =>
      syncFromSupabase(isActive).catch((error) => {
        if (isActive()) {
          console.error("Could not sync office data from Supabase.", error);
        }
      });

    runSync().finally(() => {
      if (isActive()) {
        setIsReady(true);
      }
    });

    const scheduleSync = () => {
      if (!isActive()) return;
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        runSync();
      }, 250);
    };

    let channel = null;
    if (typeof supabase?.channel === "function") {
      channel = supabase.channel(`office-data-sync-${roleId}`);
      if (roleId !== "staff") {
        channel = channel
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "transactions_ongoing" },
            scheduleSync,
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "transactions_incoming" },
            scheduleSync,
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "users" },
            scheduleSync,
          );
      }
      channel = channel
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tasks" },
          scheduleSync,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "items_masterlist" },
          scheduleSync,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "inventory_transactions" },
          scheduleSync,
        )
        .subscribe();
    }

    const handleVisibilityChange = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        scheduleSync();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", scheduleSync);
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      isMounted = false;
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", scheduleSync);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (channel) {
        if (typeof supabase.removeChannel === "function") {
          supabase.removeChannel(channel);
        } else if (typeof channel.unsubscribe === "function") {
          channel.unsubscribe();
        }
      }
    };
  }, [isAuthenticated, roleId, syncFromSupabase]);

  const safeTasks = useMemo(() => asArray(tasks), [tasks]);
  const safeInventory = useMemo(() => asArray(inventory), [inventory]);
  const safeInventoryRecords = useMemo(
    () => asArray(inventoryRecords),
    [inventoryRecords],
  );
  const safeUserAccounts = useMemo(
    () => asArray(userAccounts),
    [userAccounts],
  );
  const pendingAccounts = useMemo(
    () =>
      safeUserAccounts.filter(
        (account) => account.approvalStatus === "pending",
      ),
    [safeUserAccounts],
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
    isReady,
    requests: normalizedRequests,
    setRequests,
    tasks: safeTasks,
    setTasks,
    inventory: safeInventory,
    setInventory,
    inventoryRecords: safeInventoryRecords,
    setInventoryRecords,
    userAccounts: safeUserAccounts,
    setUserAccounts,
    pendingAccounts,
  };
}
