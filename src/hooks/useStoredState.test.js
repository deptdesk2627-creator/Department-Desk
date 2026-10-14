import { act, renderHook } from "@testing-library/react";
import { useStoredState } from "./useStoredState";

beforeEach(() => {
  window.localStorage.clear();
});

test("loads from and saves to local storage", () => {
  window.localStorage.setItem("stored-state-test", JSON.stringify(["saved"]));

  const { result } = renderHook(() => useStoredState("stored-state-test", []));
  expect(result.current[0]).toEqual(["saved"]);

  act(() => result.current[1](["updated"]));
  expect(window.localStorage.getItem("stored-state-test")).toBe(
    JSON.stringify(["updated"]),
  );
});

test("syncs matching storage events across tabs and resets on storage clear", () => {
  const { result } = renderHook(() => useStoredState("stored-state-test", []));

  act(() => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "stored-state-test",
        newValue: JSON.stringify(["from another tab"]),
        storageArea: window.localStorage,
      }),
    );
  });
  expect(result.current[0]).toEqual(["from another tab"]);

  act(() => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: null,
        newValue: null,
        storageArea: window.localStorage,
      }),
    );
  });
  expect(result.current[0]).toEqual([]);
});
