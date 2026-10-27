import { act, render, renderHook, screen } from "@testing-library/react";
import InventoryReceiptModal from "../pages/inventory/components/InventoryReceiptModal";
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
  act(() => result.current.setRemarks("Department faculty meeting"));
  act(() => result.current.submitAction({ preventDefault: jest.fn() }));
  expect(inventory[0].quantity).toBe(3);
  expect(records[0]).toMatchObject({
    status: "Borrowed",
    quantity: 2,
    person: "Prof. Juan Dela Cruz",
    remarks: "Department faculty meeting",
  });
  expect(result.current.receiptRecord).toEqual(records[0]);

  act(() => result.current.closeReceipt());
  expect(result.current.receiptRecord).toBeNull();

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

test("enforces usable-only vs borrowable-only product rules and required remarks", () => {
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
      requireRemarks: true,
    }),
  );

  act(() => result.current.openAction(borrowableItem, "Borrow"));
  act(() => result.current.setPersonName("Prof. Clara"));
  act(() => result.current.submitAction({ preventDefault: jest.fn() }));
  expect(result.current.error).toMatch(/remark or purpose/i);

  act(() => result.current.openAction(usableItem, "Borrow"));
  act(() => result.current.setRemarks("Needed for class"));
  act(() => result.current.submitAction({ preventDefault: jest.fn() }));
  expect(result.current.error).toMatch(/usable only/i);
  expect(setInventory).not.toHaveBeenCalled();

  act(() => result.current.openAction(borrowableItem, "Use"));
  act(() => result.current.setRemarks("Needed for class"));
  act(() => result.current.submitAction({ preventDefault: jest.fn() }));
  expect(result.current.error).toMatch(/borrowable only/i);
  expect(setInventory).not.toHaveBeenCalled();
});

test("renders digital receipt with product, remark, dates, and blank return date line for borrowable items", () => {
  const record = {
    id: "REC-2026-1",
    dateTime: "2026-10-27T01:10:00.000Z",
    productId: "PRD-0002",
    productName: "Mechanical Keyboard",
    usageType: "Borrowable",
    quantity: 1,
    unit: "pcs",
    status: "Borrowed",
    person: "Prof. Juan Dela Cruz",
    remarks: "Borrowed for Computer Lab 2 lecture",
  };

  render(
    <InventoryReceiptModal
      record={record}
      inventory={[]}
      onClose={jest.fn()}
    />,
  );

  expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
  expect(
    screen.getByText("Borrowed for Computer Lab 2 lecture"),
  ).toBeInTheDocument();
  expect(
    screen.getByLabelText("Borrowable item return section"),
  ).toBeInTheDocument();
  expect(screen.getByTestId("receipt-return-date-line")).toBeInTheDocument();
});

test("links borrow and return dates on the receipt when an item is returned", () => {
  const borrowRecord = {
    id: "REC-2026-10",
    dateTime: "2026-10-27T01:00:00.000Z",
    productId: "PRD-0002",
    productName: "Mechanical Keyboard",
    usageType: "Borrowable",
    quantity: 1,
    unit: "pcs",
    status: "Borrowed",
    person: "Prof. Juan Dela Cruz",
    remarks: "Borrowed for Computer Lab 2 lecture",
  };
  const returnRecord = {
    id: "REC-2026-11",
    dateTime: "2026-10-27T03:30:00.000Z",
    returnedAt: "2026-10-27T03:30:00.000Z",
    borrowedAt: "2026-10-27T01:00:00.000Z",
    borrowRecordId: "REC-2026-10",
    borrowRemarks: "Borrowed for Computer Lab 2 lecture",
    returnRemarks: "Returned in good condition",
    productId: "PRD-0002",
    productName: "Mechanical Keyboard",
    usageType: "Borrowable",
    quantity: 1,
    unit: "pcs",
    status: "Returned",
    person: "Prof. Juan Dela Cruz",
    remarks: "Returned in good condition",
  };

  render(
    <InventoryReceiptModal
      record={returnRecord}
      inventory={[]}
      records={[returnRecord, borrowRecord]}
      onClose={jest.fn()}
    />,
  );

  expect(
    screen.getByText("Borrowed for Computer Lab 2 lecture"),
  ).toBeInTheDocument();
  expect(screen.getByTestId("receipt-return-date-line").textContent).toMatch(
    /2026/,
  );
});

test("keeps final return date blank on partial return (e.g. 15 of 30 monoblocks returned by SA Jeremy) until all 30 are returned", () => {
  let inventory = [
    {
      id: "supply-3",
      productId: "PRD-0003",
      name: "Monoblock Chair",
      usageType: "Borrowable",
      quantity: 50,
      unit: "pcs",
    },
  ];
  let records = [];
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
      requireRemarks: true,
    }),
  );

  // 1. Prof. Juan Dela Cruz borrows 30 monoblocks
  act(() => result.current.openAction(inventory[0], "Borrow"));
  act(() => result.current.setPersonName("Prof. Juan Dela Cruz"));
  act(() => result.current.setQuantity("30"));
  act(() => result.current.setRemarks("Department general assembly"));
  act(() => result.current.submitAction({ preventDefault: jest.fn() }));

  expect(inventory[0].quantity).toBe(20);
  expect(records[0].quantity).toBe(30);
  expect(records[0].returnedAt).toBeUndefined();

  // 2. SA Jeremy returns only 15 pcs on behalf of Prof. Juan Dela Cruz
  rerender();
  act(() => result.current.openAction(inventory[0], "Return"));
  act(() => result.current.setPersonName("Prof. Juan Dela Cruz"));
  act(() => result.current.setReturnedBy("SA Jeremy"));
  act(() => result.current.setQuantity("15"));
  act(() => result.current.setRemarks("First batch brought back"));
  act(() => result.current.submitAction({ preventDefault: jest.fn() }));

  expect(inventory[0].quantity).toBe(35);
  // Partial return must NOT set a final returnedAt timestamp!
  expect(records[0]).toMatchObject({
    status: "Returned",
    quantity: 15,
    borrowedQuantity: 30,
    cumulativeReturnedQuantity: 15,
    remainingQuantity: 15,
    isPartialReturn: true,
    returnedAt: null,
    person: "Prof. Juan Dela Cruz",
    returnedBy: "SA Jeremy",
  });
  // Original borrow record also has returnedAt: null and returnedQuantity: 15
  expect(records[1].returnedQuantity).toBe(15);
  expect(records[1].returnedAt).toBeNull();

  const { unmount } = render(
    <InventoryReceiptModal
      record={records[0]}
      inventory={inventory}
      records={records}
      onClose={jest.fn()}
    />,
  );

  expect(screen.getByText("Partially Returned (15/30)")).toBeInTheDocument();
  expect(
    screen.getAllByText(/SA Jeremy \(for Prof\. Juan Dela Cruz\)/i).length,
  ).toBeGreaterThanOrEqual(1);
  // Final return date line must remain blank while 15 pcs are still out
  expect(
    screen.getByTestId("receipt-return-date-line").textContent.trim(),
  ).toBe("");
  unmount();

  // 3. Remaining 15 pcs are returned -> now 30/30 complete, so returnedAt is stamped!
  rerender();
  act(() => result.current.openAction(inventory[0], "Return"));
  act(() => result.current.setPersonName("Prof. Juan Dela Cruz"));
  act(() => result.current.setReturnedBy("SA Jeremy"));
  act(() => result.current.setQuantity("15"));
  act(() => result.current.setRemarks("Remaining 15 chairs returned"));
  act(() => result.current.submitAction({ preventDefault: jest.fn() }));

  expect(inventory[0].quantity).toBe(50);
  expect(records[0].isPartialReturn).toBe(false);
  expect(records[0].remainingQuantity).toBe(0);
  expect(records[0].returnedAt).toBeTruthy();

  render(
    <InventoryReceiptModal
      record={records[0]}
      inventory={inventory}
      records={records}
      onClose={jest.fn()}
    />,
  );

  expect(screen.getByText("Returned (30/30)")).toBeInTheDocument();
  expect(
    screen.getByTestId("receipt-return-date-line").textContent.trim(),
  ).not.toBe("");
});
