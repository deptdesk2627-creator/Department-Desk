import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import Inventory from "./Inventory";
import { supabase } from "../../supabase/supabaseClient";
import { mapInventoryTransactions } from "../../utils/inventory";

jest.mock("../../supabase/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const SAMPLE_INVENTORY = [
  {
    id: 1,
    productId: "PRD-0001",
    name: "Folders",
    quantity: 32,
    unit: "Boxes",
    lowStockAt: 5,
    unitCost: 50,
  },
];

const SAMPLE_RECORDS = [
  {
    id: "REC-1792648790538-7",
    dateTime: "2026-10-22T13:59:00.000Z",
    person: "Prof. Ezekiel Ygan",
    productId: "PRD-0001",
    productName: "Folders",
    quantity: 30,
    unit: "Boxes",
    status: "Borrowed",
  },
  {
    id: "REC-1792648510294-4",
    dateTime: "2026-10-22T13:42:00.000Z",
    person: "Dr. Maria Santos",
    productId: "PRD-0002",
    productName: "A4 Bond Paper (Sub 20)",
    quantity: 2,
    unit: "Reams",
    unitCost: 50,
    status: "Used",
  },
];

function mockMasterlistResponse(data = [], error = null, savedItem = null) {
  const query = {
    select: jest.fn(),
    is: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    eq: jest.fn(),
    single: jest.fn().mockResolvedValue({ data: savedItem, error }),
    maybeSingle: jest.fn().mockResolvedValue({ data: savedItem, error }),
    order: jest.fn().mockResolvedValue({ data, error }),
  };
  query.select.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  supabase.from.mockReturnValue(query);
  return query;
}

function createTableQuery({
  rows = [],
  singleRow = null,
  maybeSingleRow = null,
  error = null,
} = {}) {
  const query = {};
  ["select", "is", "insert", "update", "eq", "order"].forEach((method) => {
    query[method] = jest.fn().mockReturnValue(query);
  });
  query.order.mockResolvedValue({ data: rows, error });
  query.single = jest.fn().mockResolvedValue({ data: singleRow, error });
  query.maybeSingle = jest.fn().mockResolvedValue({
    data: maybeSingleRow,
    error,
  });
  return query;
}

function InventoryWithState(props) {
  const [inventory, setInventory] = useState(props.inventory || []);
  const [records, setRecords] = useState(props.records || []);
  return (
    <Inventory
      {...props}
      inventory={inventory}
      setInventory={setInventory}
      records={records}
      setRecords={setRecords}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockMasterlistResponse();
});

test("renders bento metrics and switches between Master list and Transaction folder tabs", async () => {
  await act(async () => {
    render(
      <Inventory
        inventory={SAMPLE_INVENTORY}
        setInventory={jest.fn()}
        records={SAMPLE_RECORDS}
        setRecords={jest.fn()}
      />,
    );
  });

  expect(
    screen.getByRole("heading", { name: /supply & inventory/i }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /reset inventory/i }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(/tracked products/i)).toBeInTheDocument();
  expect(screen.getByText(/transaction records/i)).toBeInTheDocument();
  expect(screen.getByText(/recorded usage value/i)).toBeInTheDocument();

  // Master list tab is active by default
  const masterTab = screen.getByRole("tab", { name: /master list/i });
  const transactionTab = screen.getByRole("tab", { name: /transaction/i });
  expect(masterTab).toHaveAttribute("aria-selected", "true");
  expect(
    screen.getByPlaceholderText(/search product name, id, or stock level/i),
  ).toBeInTheDocument();
  expect(screen.getAllByText("Folders").length).toBeGreaterThan(0);
  expect(screen.getByText("32 Boxes")).toBeInTheDocument();

  // Switch to Transaction tab
  fireEvent.click(transactionTab);
  expect(transactionTab).toHaveAttribute("aria-selected", "true");
  expect(
    screen.getByPlaceholderText(/search borrower, record id, or product/i),
  ).toBeInTheDocument();
  expect(screen.getByText("REC-1792648790538-7")).toBeInTheDocument();
  expect(screen.getByText("Prof. Ezekiel Ygan")).toBeInTheDocument();

  // Filter transaction records by status
  const statusSelect = screen.getByRole("combobox", { name: /filter status/i });
  fireEvent.change(statusSelect, { target: { value: "Used" } });
  expect(screen.queryByText("REC-1792648790538-7")).not.toBeInTheDocument();
  expect(screen.getByText("Dr. Maria Santos")).toBeInTheDocument();
});

test("loads and renders secretary masterlist items from Supabase", async () => {
  const item = {
    item_id: 17,
    item_name: "Bond paper",
    stock_onhand: 120,
    unit: "reams",
    min_stock: 10,
    category: "Office supplies",
    classification: "Consumable",
    archived_at: null,
    created_at: "2026-10-12",
  };
  const query = mockMasterlistResponse([item]);

  await act(async () => {
    render(
      <InventoryWithState
        inventory={[]}
        records={[]}
        setRecords={jest.fn()}
      />,
    );
  });

  expect(await screen.findByText("Bond paper")).toBeInTheDocument();
  expect(screen.getByText("PRD-0017")).toBeInTheDocument();
  expect(screen.getByText("120 reams")).toBeInTheDocument();
  expect(
    screen.getByText("Office supplies · Consumable"),
  ).toBeInTheDocument();
  expect(supabase.from).toHaveBeenCalledWith("items_masterlist");
  expect(query.select).toHaveBeenCalledWith(
    "item_id, item_name, stock_onhand, unit, min_stock, category, classification, archived_at, created_at",
  );
  expect(query.is).toHaveBeenCalledWith("archived_at", null);
  expect(query.order).toHaveBeenCalledWith("item_name");
});

test("saves newly added masterlist items to Supabase", async () => {
  const savedItem = {
    item_id: 28,
    item_name: "Stapler",
    stock_onhand: 3,
    unit: "pieces",
    min_stock: 1,
    category: "Borrowable",
    classification: "Equipment",
    archived_at: null,
    created_at: "2026-11-13",
  };
  const query = mockMasterlistResponse([], null, savedItem);

  await act(async () => {
    render(
      <InventoryWithState
        inventory={[]}
        records={[]}
        setRecords={jest.fn()}
      />,
    );
  });

  fireEvent.click(screen.getByRole("button", { name: /add product/i }));
  const formDialog = within(screen.getByRole("dialog"));
  fireEvent.change(formDialog.getByLabelText(/product name/i), {
    target: { value: "Stapler" },
  });
  fireEvent.change(formDialog.getByLabelText(/product rule/i), {
    target: { value: "Borrowable" },
  });
  fireEvent.change(formDialog.getByLabelText(/^unit$/i), {
    target: { value: "pieces" },
  });
  fireEvent.change(formDialog.getByLabelText(/starting quantity/i), {
    target: { value: "3" },
  });
  fireEvent.change(formDialog.getByLabelText(/low-stock level/i), {
    target: { value: "1" },
  });
  fireEvent.click(formDialog.getByRole("button", { name: /add product/i }));

  expect(await screen.findByText("Stapler")).toBeInTheDocument();
  expect(query.insert).toHaveBeenCalledWith({
    item_name: "Stapler",
    stock_onhand: 3,
    unit: "pieces",
    min_stock: 1,
    category: "Borrowable",
    classification: "Equipment",
    archived_at: null,
    created_at: expect.any(String),
  });
});

test("loads transaction rows and borrower usernames from Supabase", async () => {
  const item = {
    item_id: 17,
    item_name: "Projector",
    stock_onhand: 3,
    unit: "pieces",
    min_stock: 1,
    category: "Borrowable",
    classification: "Equipment",
    archived_at: null,
    created_at: "2026-10-12",
  };
  const user = { user_id: 42, username: "Prof. Test User" };
  const transaction = {
    transaction_id: 99,
    item_id: 17,
    is_issued_to: 42,
    purpose: "Class presentation",
    quantity: 2,
    action_type: "Borrow",
    return_date: null,
    borrow_date: "2026-11-14",
    status: "Borrowed",
    unit: "pieces",
    created_at: "2026-11-14T08:30:00.000Z",
    recieved_by: null,
    returned_by: null,
  };
  supabase.from.mockImplementation((table) => {
    if (table === "items_masterlist") {
      return createTableQuery({ rows: [item] });
    }
    if (table === "users") return createTableQuery({ rows: [user] });
    if (table === "inventory_transactions") {
      return createTableQuery({ rows: [transaction] });
    }
    throw new Error(`Unexpected Supabase table: ${table}`);
  });

  await act(async () => {
    render(
      <InventoryWithState
        inventory={[]}
        records={[]}
        setRecords={jest.fn()}
      />,
    );
  });

  fireEvent.click(screen.getByRole("tab", { name: /transaction/i }));
  expect(await screen.findByText("Prof. Test User")).toBeInTheDocument();
  expect(screen.getByText("99")).toBeInTheDocument();
  const transactionSection = screen.getByRole("region", {
    name: "Transaction records",
  });
  expect(within(transactionSection).getByText("Projector")).toBeInTheDocument();
  expect(
    within(transactionSection).getByText("Class presentation"),
  ).toBeInTheDocument();
});

test("reconstructs partial returns from persisted transaction rows", () => {
  const item = {
    item_id: 17,
    item_name: "Projector",
    category: "Borrowable",
    classification: "Equipment",
  };
  const user = { user_id: 42, username: "Prof. Test User" };
  const records = mapInventoryTransactions(
    [
      {
        transaction_id: 1,
        item_id: 17,
        is_issued_to: 42,
        purpose: "Class presentation",
        quantity: 2,
        action_type: "Borrow",
        return_date: null,
        borrow_date: "2026-11-14",
        status: "Borrowed",
        unit: "pieces",
        created_at: "2026-11-14T08:30:00.000Z",
        recieved_by: null,
        returned_by: null,
      },
      {
        transaction_id: 2,
        item_id: 17,
        is_issued_to: 42,
        purpose: "Returning one item",
        quantity: 1,
        action_type: "Return",
        return_date: "2026-11-14",
        borrow_date: "2026-11-14",
        status: "Returned",
        unit: "pieces",
        created_at: "2026-11-14T10:30:00.000Z",
        recieved_by: null,
        returned_by: "Prof. Test User",
      },
    ],
    new Map([[17, item]]),
    new Map([[42, user]]),
  );

  expect(records[0]).toMatchObject({
    id: 1,
    returnedQuantity: 1,
  });
  expect(records[1]).toMatchObject({
    id: 2,
    status: "Returned",
    isPartialReturn: true,
    borrowedQuantity: 2,
    cumulativeReturnedQuantity: 1,
    remainingQuantity: 1,
    person: "Prof. Test User",
  });
});

test("loads and saves secretary inventory transactions in Supabase", async () => {
  const item = {
    item_id: 17,
    item_name: "Projector",
    stock_onhand: 5,
    unit: "pieces",
    min_stock: 1,
    category: "Borrowable",
    classification: "Equipment",
    archived_at: null,
    created_at: "2026-10-12",
  };
  const user = { user_id: 42, username: "Prof. Test User" };
  const savedTransaction = {
    transaction_id: 99,
    item_id: 17,
    is_issued_to: 42,
    purpose: "Class presentation",
    quantity: 2,
    action_type: "Borrow",
    return_date: null,
    borrow_date: "2026-11-14",
    status: "Borrowed",
    unit: "pieces",
    created_at: "2026-11-14T08:30:00.000Z",
    recieved_by: null,
    returned_by: null,
  };
  const itemQuery = createTableQuery({
    rows: [item],
    maybeSingleRow: { item_id: 17, stock_onhand: 3 },
  });
  const userQuery = createTableQuery({ rows: [user] });
  const transactionQuery = createTableQuery({
    rows: [],
    singleRow: savedTransaction,
  });
  supabase.from.mockImplementation((table) => {
    if (table === "items_masterlist") return itemQuery;
    if (table === "users") return userQuery;
    if (table === "inventory_transactions") return transactionQuery;
    throw new Error(`Unexpected Supabase table: ${table}`);
  });

  await act(async () => {
    render(
      <InventoryWithState
        inventory={[]}
        records={[]}
        setRecords={jest.fn()}
      />,
    );
  });

  fireEvent.click(await screen.findByRole("button", { name: /^borrow$/i }));
  const actionDialog = within(screen.getByRole("dialog"));
  fireEvent.change(actionDialog.getByLabelText(/borrowed by/i), {
    target: { value: user.username },
  });
  fireEvent.change(actionDialog.getByLabelText(/quantity/i), {
    target: { value: "2" },
  });
  fireEvent.change(actionDialog.getByLabelText(/remark \/ reason/i), {
    target: { value: "Class presentation" },
  });
  fireEvent.click(
    actionDialog.getByRole("button", { name: /record borrow/i }),
  );

  expect(
    await screen.findByRole("heading", { name: /supply & equipment slip/i }),
  ).toBeInTheDocument();
  expect(itemQuery.update).toHaveBeenCalledWith({ stock_onhand: 3 });
  expect(transactionQuery.insert).toHaveBeenCalledWith({
    item_id: 17,
    is_issued_to: 42,
    purpose: "Class presentation",
    quantity: 2,
    action_type: "Borrow",
    return_date: null,
    borrow_date: expect.any(String),
    status: "Borrowed",
    unit: "pieces",
    created_at: expect.any(String),
    recieved_by: null,
    returned_by: null,
  });

  fireEvent.click(screen.getByRole("tab", { name: /transaction/i }));
  const transactionSection = screen.getByRole("region", {
    name: "Transaction records",
  });
  expect(await within(transactionSection).findByText("99")).toBeInTheDocument();
  expect(
    within(transactionSection).getByText("Prof. Test User"),
  ).toBeInTheDocument();
});

test("persists a partial return and displays it as a new transaction row", async () => {
  const item = {
    item_id: 17,
    item_name: "Projector",
    stock_onhand: 3,
    unit: "pieces",
    min_stock: 1,
    category: "Borrowable",
    classification: "Equipment",
    archived_at: null,
    created_at: "2026-10-12",
  };
  const user = { user_id: 42, username: "Prof. Test User" };
  const borrowTransaction = {
    transaction_id: 88,
    item_id: 17,
    is_issued_to: 42,
    purpose: "Class presentation",
    quantity: 2,
    action_type: "Borrow",
    return_date: null,
    borrow_date: "2026-11-14",
    status: "Borrowed",
    unit: "pieces",
    created_at: "2026-11-14T08:30:00.000Z",
    recieved_by: null,
    returned_by: null,
  };
  const savedReturn = {
    transaction_id: 89,
    item_id: 17,
    is_issued_to: 42,
    purpose: "Returning one item",
    quantity: 1,
    action_type: "Return",
    return_date: "2026-11-14",
    borrow_date: "2026-11-14",
    status: "Returned",
    unit: "pieces",
    created_at: "2026-11-14T10:30:00.000Z",
    recieved_by: null,
    returned_by: "Prof. Test User",
  };
  const itemQuery = createTableQuery({
    rows: [item],
    maybeSingleRow: { item_id: 17, stock_onhand: 4 },
  });
  const userQuery = createTableQuery({ rows: [user] });
  const transactionQuery = createTableQuery({
    rows: [borrowTransaction],
    singleRow: savedReturn,
  });
  supabase.from.mockImplementation((table) => {
    if (table === "items_masterlist") return itemQuery;
    if (table === "users") return userQuery;
    if (table === "inventory_transactions") return transactionQuery;
    throw new Error(`Unexpected Supabase table: ${table}`);
  });

  await act(async () => {
    render(
      <InventoryWithState
        inventory={[]}
        records={[]}
        setRecords={jest.fn()}
      />,
    );
  });

  fireEvent.click(await screen.findByRole("button", { name: /^return$/i }));
  const actionDialog = within(screen.getByRole("dialog"));
  fireEvent.change(actionDialog.getByLabelText(/borrowed by/i), {
    target: { value: user.username },
  });
  fireEvent.change(actionDialog.getByLabelText(/quantity/i), {
    target: { value: "1" },
  });
  fireEvent.change(actionDialog.getByLabelText(/returned by/i), {
    target: { value: "Office aide" },
  });
  fireEvent.change(actionDialog.getByLabelText(/condition \/ remark/i), {
    target: { value: "Returning one item" },
  });
  fireEvent.click(
    actionDialog.getByRole("button", { name: /record return/i }),
  );

  expect(
    await screen.findByRole("heading", { name: /supply & equipment slip/i }),
  ).toBeInTheDocument();
  expect(itemQuery.update).toHaveBeenCalledWith({ stock_onhand: 4 });
  expect(transactionQuery.insert).toHaveBeenCalledWith(
    expect.objectContaining({
      item_id: 17,
      is_issued_to: 42,
      quantity: 1,
      action_type: "Return",
      status: "Returned",
      returned_by: "Office aide",
    }),
  );

  fireEvent.click(screen.getByRole("tab", { name: /transaction/i }));
  const transactionSection = screen.getByRole("region", {
    name: "Transaction records",
  });
  expect(
    await within(transactionSection).findByText("89"),
  ).toBeInTheDocument();
  expect(
    within(transactionSection).getByText("Partial Return (1/2)"),
  ).toBeInTheDocument();
});

test("persists item use as a new inventory transaction row", async () => {
  const item = {
    item_id: 24,
    item_name: "Bond paper",
    stock_onhand: 5,
    unit: "reams",
    min_stock: 1,
    category: "Usable",
    classification: "Consumable",
    archived_at: null,
    created_at: "2026-10-12",
  };
  const user = { user_id: 42, username: "Prof. Test User" };
  const savedTransaction = {
    transaction_id: 90,
    item_id: 24,
    is_issued_to: 42,
    purpose: "Print class handouts",
    quantity: 2,
    action_type: "Use",
    return_date: null,
    borrow_date: null,
    status: "Used",
    unit: "reams",
    created_at: "2026-11-14T11:30:00.000Z",
    recieved_by: null,
    returned_by: null,
  };
  const itemQuery = createTableQuery({
    rows: [item],
    maybeSingleRow: { item_id: 24, stock_onhand: 3 },
  });
  const userQuery = createTableQuery({ rows: [user] });
  const transactionQuery = createTableQuery({
    rows: [],
    singleRow: savedTransaction,
  });
  supabase.from.mockImplementation((table) => {
    if (table === "items_masterlist") return itemQuery;
    if (table === "users") return userQuery;
    if (table === "inventory_transactions") return transactionQuery;
    throw new Error(`Unexpected Supabase table: ${table}`);
  });

  await act(async () => {
    render(
      <InventoryWithState
        inventory={[]}
        records={[]}
        setRecords={jest.fn()}
      />,
    );
  });

  fireEvent.click(await screen.findByRole("button", { name: /^use$/i }));
  const actionDialog = within(screen.getByRole("dialog"));
  fireEvent.change(actionDialog.getByLabelText(/used by/i), {
    target: { value: user.username },
  });
  fireEvent.change(actionDialog.getByLabelText(/quantity/i), {
    target: { value: "2" },
  });
  fireEvent.change(actionDialog.getByLabelText(/remark \/ purpose/i), {
    target: { value: "Print class handouts" },
  });
  fireEvent.click(actionDialog.getByRole("button", { name: /record use/i }));

  expect(
    await screen.findByRole("heading", { name: /supply & equipment slip/i }),
  ).toBeInTheDocument();
  expect(itemQuery.update).toHaveBeenCalledWith({ stock_onhand: 3 });
  expect(transactionQuery.insert).toHaveBeenCalledWith(
    expect.objectContaining({
      item_id: 24,
      is_issued_to: 42,
      quantity: 2,
      action_type: "Use",
      status: "Used",
      purpose: "Print class handouts",
    }),
  );
});

test("opens item details from the master list actions", async () => {
  const setInventory = jest.fn();
  const updatedItem = {
    item_id: 1,
    item_name: "Folders",
    stock_onhand: 24,
    unit: "Packs",
    min_stock: 8,
    category: "Usable",
    classification: "Item",
    archived_at: null,
    created_at: "2026-10-12",
  };
  const query = mockMasterlistResponse([], null, updatedItem);
  await act(async () => {
    render(
      <Inventory
        inventory={SAMPLE_INVENTORY}
        setInventory={setInventory}
        records={[
          {
            ...SAMPLE_RECORDS[0],
            remarks: "Department workshop",
          },
        ]}
        setRecords={jest.fn()}
      />,
    );
  });

  fireEvent.click(
    screen.getByRole("button", { name: "Open item details for Folders" }),
  );

  const detailsDialog = within(screen.getByRole("dialog"));
  expect(detailsDialog.getByText("PRD-0001")).toBeInTheDocument();
  expect(detailsDialog.getByText("32 Boxes")).toBeInTheDocument();
  expect(detailsDialog.getByText("Minimum stock")).toBeInTheDocument();
  expect(detailsDialog.getByText("Usable")).toBeInTheDocument();
  expect(detailsDialog.getByText("Item")).toBeInTheDocument();
  expect(detailsDialog.getByText("Prof. Ezekiel Ygan")).toBeInTheDocument();
  expect(detailsDialog.getByText("Department workshop")).toBeInTheDocument();
  expect(
    detailsDialog.getByRole("img", { name: "Usage trend for Folders" }),
  ).toBeInTheDocument();

  fireEvent.click(detailsDialog.getByRole("button", { name: "Edit stock details" }));
  fireEvent.change(detailsDialog.getByRole("spinbutton", { name: "Stock on hand" }), {
    target: { value: "24" },
  });
  fireEvent.change(detailsDialog.getByRole("textbox", { name: "Unit" }), {
    target: { value: "Packs" },
  });
  fireEvent.change(detailsDialog.getByRole("spinbutton", { name: "Minimum stock" }), {
    target: { value: "8" },
  });
  fireEvent.click(detailsDialog.getByRole("button", { name: "Save changes" }));

  expect(await screen.findByText("24 Packs")).toBeInTheDocument();
  expect(query.update).toHaveBeenCalledWith({
    stock_onhand: 24,
    unit: "Packs",
    min_stock: 8,
  });
  expect(query.eq).toHaveBeenCalledWith("item_id", 1);
  const inventoryUpdate = setInventory.mock.calls[setInventory.mock.calls.length - 1][0];
  expect(inventoryUpdate(SAMPLE_INVENTORY)[0]).toMatchObject({
    quantity: 24,
    unit: "Packs",
    lowStockAt: 8,
  });
  expect(detailsDialog.getByText("8 Packs")).toBeInTheDocument();
});
