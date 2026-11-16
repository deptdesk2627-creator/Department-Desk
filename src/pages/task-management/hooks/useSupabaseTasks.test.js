import { act, renderHook, waitFor } from "@testing-library/react";
import { supabase } from "../../../supabase/supabaseClient";
import { useSupabaseTasks } from "./useSupabaseTasks";

jest.mock("../../../supabase/supabaseClient", () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

const DB_TASK = {
  task_id: 15,
  task_name: "Prepare report",
  priority_level: "High",
  status: "In progress",
  due_date: "2026-11-20",
  tasks_user_id: 7,
  description: null,
  completed_at: null,
  created_at: "2026-11-15T08:00:00.000Z",
  updated_at: "2026-11-15T08:00:00.000Z",
};

let taskQueries;

function createQuery(table) {
  let insertedRow;
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn(() =>
      Promise.resolve({
        data: table === "tasks" ? [DB_TASK] : [],
        error: null,
      }),
    ),
    maybeSingle: jest.fn(() =>
      Promise.resolve({
        data: table === "users" ? { user_id: 7 } : { task_id: 22 },
        error: null,
      }),
    ),
    insert: jest.fn((row) => {
      insertedRow = row;
      return query;
    }),
    single: jest.fn(() =>
      Promise.resolve({
        data: { ...insertedRow, task_id: 22 },
        error: null,
      }),
    ),
    update: jest.fn(() => query),
    delete: jest.fn(() => query),
  };
  if (table === "tasks") taskQueries.push(query);
  return query;
}

beforeEach(() => {
  jest.clearAllMocks();
  taskQueries = [];
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "auth-user-7" } },
    error: null,
  });
  supabase.from.mockImplementation(createQuery);
});

test("loads tasks and persists create, update, and delete operations", async () => {
  const setTasks = jest.fn();
  const { result } = renderHook(() => useSupabaseTasks({ tasks: [], setTasks }));

  await waitFor(() => expect(result.current.isReady).toBe(true));
  expect(setTasks).toHaveBeenCalledWith([
    expect.objectContaining({
      id: DB_TASK.task_id,
      title: DB_TASK.task_name,
      priority: DB_TASK.priority_level,
      status: DB_TASK.status,
    }),
  ]);
  expect(supabase.from).toHaveBeenCalledWith("users");
  expect(supabase.from).toHaveBeenCalledWith("tasks");
  expect(taskQueries[0].eq).toHaveBeenCalledWith("tasks_user_id", 7);

  let createdTask;
  await act(async () => {
    createdTask = await result.current.persistTaskAdd({
      title: "Plan event",
      priority: "Medium",
      status: "Not started",
      due: "2026-11-30",
    });
  });
  expect(createdTask).toEqual(
    expect.objectContaining({ id: 22, title: "Plan event" }),
  );
  expect(taskQueries[1].insert).toHaveBeenCalledWith(
    expect.objectContaining({
      task_name: "Plan event",
      tasks_user_id: 7,
      due_date: "2026-11-30",
    }),
  );

  await act(async () => {
    await result.current.persistTaskUpdate(22, {
      status: "Done",
      done: true,
    });
  });
  expect(taskQueries[2].update).toHaveBeenCalledWith(
    expect.objectContaining({ status: "Done", completed_at: expect.any(String) }),
  );
  expect(taskQueries[2].eq).toHaveBeenCalledWith("task_id", 22);

  await act(async () => {
    await result.current.persistTaskDelete(22);
  });
  expect(taskQueries[3].delete).toHaveBeenCalled();
  expect(taskQueries[3].eq).toHaveBeenCalledWith("task_id", 22);
});
