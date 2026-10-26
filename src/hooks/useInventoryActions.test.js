import { act, renderHook } from "@testing-library/react";
import { useInventoryActions } from "./useInventoryActions";

test("validates stock actions and records successful borrow/return operations", () => {
  const initialInventory = [
    {
      id: "supply-1",
      productId: "PRD-0001",
      name: "Paper",
      quantity: 5,
      unit: "ream",
    },
  ];
  const initialRecords = [];
  let inventory = initialInventory;
  let records = initialRecords;
  const setInventory = jest.fn((update) => {
    inventory = update(inventory);
  });
  const setRecords = jest.fn((update) => {
    records = update(records);
  });
  const { result, rerender } = renderHook(() =>
    useInventoryActions({
      inventory,
      records,
      setInventory,
      setRecords,
    }),
  );

  act(() => result.current.openAction(initialInventory[0], "Borrow"));
  act(() => result.current.setQuantity("6"));
  act(() => result.current.submitAction({ preventDefault: jest.fn() }));
  expect(result.current.error).toBe(
    "The quantity cannot exceed the available stock.",
  );
  expect(inventory[0].quantity).toBe(5);

  act(() => result.current.setPersonName("Prof. Juan Dela Cruz"));
  act(() => result.current.setQuantity("2"));
  act(() => result.current.submitAction({ preventDefault: jest.fn() }));
  expect(inventory[0].quantity).toBe(3);
  expect(records[0]).toMatchObject({
    status: "Borrowed",
    quantity: 2,
    person: "Prof. Juan Dela Cruz",
  });

  rerender();
  act(() => result.current.openAction(inventory[0], "Return"));
  act(() => result.current.setQuantity("3"));
  act(() => result.current.submitAction({ preventDefault: jest.fn() }));
  expect(result.current.error).toBe(
    "The return quantity cannot exceed the borrowed balance.",
  );

  act(() => result.current.setPersonName("Prof. Juan Dela Cruz"));
  act(() => result.current.setQuantity("2"));
  act(() => result.current.submitAction({ preventDefault: jest.fn() }));
  expect(inventory[0].quantity).toBe(5);
  expect(records[0]).toMatchObject({
    status: "Returned",
    quantity: 2,
    person: "Prof. Juan Dela Cruz",
  });
});

test("enforces usable-only vs borrowable-only product rules", () => {
  const usableItem = {
    id: "supply-1",
    productId: "PRD-0001",
    name: "Bond Paper",
    usageType: "Usable",
    quantity: 10,
    unit: "reams",
  };
  const borrowableItem = {
    id: "supply-2",
    productId: "PRD-0002",
    name: "Keyboard",
    usageType: "Borrowable",
    quantity: 4,
    unit: "pcs",
  };
  const setInventory = jest.fn();
  const setRecords = jest.fn();

  const { result } = renderHook(() =>
    useInventoryActions({
      inventory: [usableItem, borrowableItem],
      records: [],
      setInventory,
      setRecords,
    }),
  );

  act(() => result.current.openAction(usableItem, "Borrow"));
  act(() => result.current.submitAction({ preventDefault: jest.fn() }));
  expect(result.current.error).toMatch(/usable only/i);
  expect(setInventory).not.toHaveBeenCalled();

  act(() => result.current.openAction(borrowableItem, "Use"));
  act(() => result.current.submitAction({ preventDefault: jest.fn() }));
  expect(result.current.error).toMatch(/borrowable only/i);
  expect(setInventory).not.toHaveBeenCalled();
});
