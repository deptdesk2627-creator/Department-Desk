import {
  canBorrowItem,
  canUseItem,
  confirmInventoryReturn,
  declineInventoryReturn,
  getItemUsageType,
  mapInventoryTransactions,
  mapMasterlistItem,
  PENDING_RETURN_STATUS,
  persistInventoryTransaction,
  RETURN_DECLINED_STATUS,
} from "./inventory";

test("the masterlist category determines usage when type fields conflict", () => {
  const item = mapMasterlistItem({
    item_id: 17,
    item_name: "Folders",
    category: "Borrowable",
    classification: "usable",
    stock_onhand: 32,
    unit: "Boxes",
    min_stock: 2,
  });

  expect(getItemUsageType(item)).toBe("Borrowable");
  expect(canUseItem(item)).toBe(false);
  expect(canBorrowItem(item)).toBe(true);
});

test("recognizes usable classification when category is not a usage type", () => {
  const item = mapMasterlistItem({
    item_id: 18,
    item_name: "Paper",
    category: "Office supplies",
    classification: " usable ",
    stock_onhand: 32,
    unit: "Reams",
    min_stock: 2,
  });

  expect(getItemUsageType(item)).toBe("Usable");
  expect(canUseItem(item)).toBe(true);
  expect(canBorrowItem(item)).toBe(false);
});

function createQuery(response) {
  const query = {};
  ["select", "update", "eq", "is"].forEach((method) => {
    query[method] = jest.fn().mockReturnValue(query);
  });
  query.maybeSingle = jest.fn().mockResolvedValue(response);
  return query;
}

test("reports the current Supabase stock when a cached quantity is stale", async () => {
  const updateQuery = createQuery({ data: null, error: null });
  const currentItemQuery = createQuery({
    data: { stock_onhand: 100, archived_at: null },
    error: null,
  });
  const supabaseClient = {
    from: jest
      .fn()
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(currentItemQuery),
  };

  await expect(
    persistInventoryTransaction({
      supabaseClient,
      item: { item_id: 17, stock_onhand: 199 },
      recipientId: 7,
      actionType: "Borrow",
      amount: 1,
      record: {},
    }),
  ).rejects.toThrow(
    "Stock changed in Supabase from 199 to 100. Reload the page and try again.",
  );
  expect(supabaseClient.from).toHaveBeenNthCalledWith(2, "items_masterlist");
});

test("maps Pending Return without crediting returnedQuantity until confirmed", () => {
  const item = {
    item_id: 17,
    item_name: "Projector",
    category: "Borrowable",
    classification: "Equipment",
  };
  const user = { user_id: 42, username: "Prof. Maria Clara" };
  const mapped = mapInventoryTransactions(
    [
      {
        transaction_id: 1,
        item_id: 17,
        is_issued_to: 42,
        purpose: "Seminar",
        quantity: 3,
        action_type: "Borrow",
        return_date: null,
        borrow_date: "2026-11-16",
        status: "Borrowed",
        unit: "pcs",
        created_at: "2026-11-16T08:00:00.000Z",
        recieved_by: null,
        returned_by: null,
      },
      {
        transaction_id: 2,
        item_id: 17,
        is_issued_to: 42,
        purpose: "Returning 2 pcs",
        quantity: 2,
        action_type: "Return",
        return_date: null,
        borrow_date: "2026-11-16",
        status: PENDING_RETURN_STATUS,
        unit: "pcs",
        created_at: "2026-11-16T10:00:00.000Z",
        recieved_by: null,
        returned_by: null,
      },
    ],
    new Map([[17, item]]),
    new Map([[42, user]]),
  );

  expect(mapped[0]).toMatchObject({
    id: 1,
    returnedQuantity: 0,
    pendingReturnQuantity: 2,
    returnedAt: null,
  });
  expect(mapped[1]).toMatchObject({
    id: 2,
    status: PENDING_RETURN_STATUS,
    isPendingConfirmation: true,
    borrowedQuantity: 3,
    cumulativeReturnedQuantity: 0,
    remainingQuantity: 3,
  });
});

test("confirmInventoryReturn updates the transaction and increments stock_onhand", async () => {
  const readItemQuery = createQuery({
    data: { item_id: 17, stock_onhand: 5, archived_at: null },
    error: null,
  });
  const updateTxQuery = createQuery({
    data: {
      transaction_id: 55,
      status: "Returned",
      return_date: "2026-11-17",
      recieved_by: "Ma'am Aubrey",
    },
    error: null,
  });
  const updateStockQuery = createQuery({
    data: { item_id: 17, stock_onhand: 7 },
    error: null,
  });
  const supabaseClient = {
    from: jest
      .fn()
      .mockReturnValueOnce(readItemQuery)
      .mockReturnValueOnce(updateTxQuery)
      .mockReturnValueOnce(updateStockQuery),
  };

  const result = await confirmInventoryReturn({
    supabaseClient,
    record: { id: 55, itemId: 17, quantity: 2, status: PENDING_RETURN_STATUS },
    item: { item_id: 17, stock_onhand: 5 },
    receivedBy: "Ma'am Aubrey",
  });

  expect(result.updatedStock).toBe(7);
  expect(updateTxQuery.update).toHaveBeenCalledWith(
    expect.objectContaining({
      status: "Returned",
      recieved_by: "Ma'am Aubrey",
    }),
  );
  expect(updateStockQuery.update).toHaveBeenCalledWith({ stock_onhand: 7 });
});

test("declineInventoryReturn marks the return as Return Declined without modifying stock", async () => {
  const updateTxQuery = createQuery({
    data: {
      transaction_id: 55,
      status: RETURN_DECLINED_STATUS,
      recieved_by: "Ma'am Aubrey",
      purpose: "Returning [Declined: Not yet handed over]",
    },
    error: null,
  });
  const supabaseClient = {
    from: jest.fn().mockReturnValueOnce(updateTxQuery),
  };

  const result = await declineInventoryReturn({
    supabaseClient,
    record: {
      id: 55,
      itemId: 17,
      quantity: 2,
      remarks: "Returning",
      status: PENDING_RETURN_STATUS,
    },
    receivedBy: "Ma'am Aubrey",
    reason: "Not yet handed over",
  });

  expect(result.status).toBe(RETURN_DECLINED_STATUS);
  expect(supabaseClient.from).toHaveBeenCalledTimes(1);
  expect(supabaseClient.from).toHaveBeenCalledWith("inventory_transactions");
});
