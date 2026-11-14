import { persistInventoryTransaction } from "./inventory";

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
