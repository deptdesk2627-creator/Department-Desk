import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../../supabase/supabaseClient";

const TASK_COLUMNS =
  "task_id, task_name, priority_level, status, due_date, tasks_user_id, description, completed_at, created_at, updated_at";

function mapTask(row) {
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

function toTaskRow(task, userId) {
  const status = task.status || "Not started";
  const now = new Date().toISOString();
  return {
    task_name: String(task.title || "").trim(),
    priority_level: task.priority || "Medium",
    status,
    due_date: task.due || now.slice(0, 10),
    tasks_user_id: userId,
    description: task.description || null,
    completed_at: status === "Done" ? now : null,
    created_at: now,
    updated_at: now,
  };
}

function toTaskUpdate(changes) {
  const update = { updated_at: new Date().toISOString() };
  if (Object.prototype.hasOwnProperty.call(changes, "title")) {
    update.task_name = String(changes.title || "").trim();
  }
  if (Object.prototype.hasOwnProperty.call(changes, "priority")) {
    update.priority_level = changes.priority;
  }
  if (Object.prototype.hasOwnProperty.call(changes, "due")) {
    update.due_date = changes.due || new Date().toISOString().slice(0, 10);
  }
  if (Object.prototype.hasOwnProperty.call(changes, "status")) {
    update.status = changes.status;
    update.completed_at =
      changes.status === "Done" ? new Date().toISOString() : null;
  }
  return update;
}

export function useSupabaseTasks({ tasks = [], setTasks, isDemo = false }) {
  const initialTasks = useRef(Array.isArray(tasks) ? tasks : []);
  const writeQueue = useRef(Promise.resolve());
  const loadRequest = useRef(null);
  const [tasksUserId, setTasksUserId] = useState(isDemo ? "demo" : null);
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const fetchTasks = useCallback(async () => {
    const authResult = await supabase.auth.getUser();
    if (authResult.error) throw authResult.error;
    const authUserId = authResult.data?.user?.id;
    if (!authUserId) throw new Error("Sign in to load tasks.");

    const userResult = await supabase
      .from("users")
      .select("user_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    if (userResult.error) throw userResult.error;
    if (!userResult.data?.user_id) {
      throw new Error("Your account is not linked in public.users.");
    }

    const tasksResult = await supabase
      .from("tasks")
      .select(TASK_COLUMNS)
      .order("created_at", { ascending: false });
    if (tasksResult.error) throw tasksResult.error;

    let rows = Array.isArray(tasksResult.data) ? tasksResult.data : [];
    if (!rows.length && initialTasks.current.length) {
      const legacyRows = initialTasks.current
        .filter((task) => String(task?.title || "").trim())
        .map((task) => toTaskRow(task, userResult.data.user_id));
      if (legacyRows.length) {
        const importResult = await supabase
          .from("tasks")
          .insert(legacyRows)
          .select(TASK_COLUMNS);
        if (importResult.error) throw importResult.error;
        rows = Array.isArray(importResult.data) ? importResult.data : [];
      }
    }

    return { rows, userId: userResult.data.user_id };
  }, []);

  useEffect(() => {
    if (isDemo) {
      setTasksUserId("demo");
      setIsLoading(false);
      setError("");
      return undefined;
    }

    let isMounted = true;
    setIsLoading(true);
    setError("");
    if (!loadRequest.current || loadRequest.current.token !== reloadToken) {
      loadRequest.current = {
        token: reloadToken,
        promise: fetchTasks(),
      };
    }

    loadRequest.current.promise
      .then(({ rows, userId }) => {
        if (!isMounted) return;
        setTasksUserId(userId);
        setTasks(rows.map(mapTask));
      })
      .catch((loadError) => {
        if (!isMounted) return;
        console.error("Could not load tasks from Supabase.", loadError);
        setError(`Could not load tasks: ${loadError.message}`);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [fetchTasks, reloadToken, setTasks]);

  const persistTaskAdd = useCallback(
    async (task) => {
      if (!tasksUserId) throw new Error("Tasks are not ready to be saved.");
      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert(toTaskRow(task, tasksUserId))
        .select(TASK_COLUMNS)
        .single();
      if (insertError) throw insertError;
      if (!data) throw new Error("Supabase did not return the saved task.");
      setError("");
      return mapTask(data);
    },
    [tasksUserId],
  );

  const persistTaskUpdate = useCallback(
    (taskId, changes) => {
      const update = toTaskUpdate(changes);
      const operation = writeQueue.current.then(async () => {
        const { data, error: updateError } = await supabase
          .from("tasks")
          .update(update)
          .eq("task_id", taskId)
          .select("task_id")
          .maybeSingle();
        if (updateError) throw updateError;
        if (!data) throw new Error("The task was not found or could not be updated.");
      });
      writeQueue.current = operation.catch(() => {});
      return operation.then(() => setError("")).catch((saveError) => {
        setError(`Could not update task: ${saveError.message}`);
        reload();
      });
    },
    [reload],
  );

  const persistTaskDelete = useCallback(
    (taskId) => {
      const operation = writeQueue.current.then(async () => {
        const { data, error: deleteError } = await supabase
          .from("tasks")
          .delete()
          .eq("task_id", taskId)
          .select("task_id")
          .maybeSingle();
        if (deleteError) throw deleteError;
        if (!data) throw new Error("The task was not found or could not be deleted.");
      });
      writeQueue.current = operation.catch(() => {});
      return operation.then(() => setError("")).catch((deleteError) => {
        setError(`Could not delete task: ${deleteError.message}`);
        reload();
      });
    },
    [reload],
  );

  function reportAddError(addError) {
    setError(`Could not create task: ${addError.message}`);
  }

  return {
    error,
    isReady: Boolean(tasksUserId),
    isLoading,
    persistTaskAdd,
    persistTaskDelete,
    persistTaskUpdate,
    reportAddError,
    reload,
  };
}
