import { act, renderHook } from "@testing-library/react";
import { useTodoListManager } from "./useTodoListManager";

beforeEach(() => {
  window.localStorage.clear();
});

test("loads custom lists and synchronizes list changes across tabs", () => {
  window.localStorage.setItem(
    "officeflow.todo-lists",
    JSON.stringify([{ id: "custom", name: "Custom List" }]),
  );
  window.localStorage.setItem("officeflow.active-list-id", "custom");

  const { result } = renderHook(() => useTodoListManager(jest.fn()));
  expect(result.current.lists).toEqual([
    { id: "custom", name: "Custom List" },
  ]);
  expect(result.current.activeListId).toBe("custom");

  act(() => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "officeflow.todo-lists",
        newValue: JSON.stringify([{ id: "remote", name: "Remote List" }]),
      }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "officeflow.active-list-id",
        newValue: "remote",
      }),
    );
  });

  expect(result.current.lists).toEqual([
    { id: "remote", name: "Remote List" },
  ]);
  expect(result.current.activeListId).toBe("remote");
});
