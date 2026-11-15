import {
  canBorrowItem,
  canUseItem,
  getItemUsageType,
  mapMasterlistItem,
  persistInventoryTransaction,
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
