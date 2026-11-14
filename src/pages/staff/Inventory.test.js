import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import StaffInventory from "./Inventory";
import { supabase } from "../../supabase/supabaseClient";

jest.mock("../../supabase/supabaseClient", () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

const STAFF_USER = {
  user_id: 7,
  username: "Prof. Maria Clara",
  auth_user_id: "auth-user-7",
};
const MASTERLIST_ITEM = {
  item_id: 17,
  item_name: "Folders",
  stock_onhand: 32,
  unit: "Boxes",
  min_stock: 2,
  category: "Office supplies",
  classification: "Borrowable",
  archived_at: null,
  created_at: "2026-10-12",
};

let tableResponses;
let tableQueries;
let insertedTransactions;

function createQuery(table) {
  let operation = "select";
  let insertedRow;
  const query = {
    select: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn(() =>
      Promise.resolve(tableResponses[table] || { data: [], error: null }),
    ),
    maybeSingle: jest.fn(() => {
      if (table === "items_masterlist" && operation === "update") {
        return Promise.resolve({
          data: { item_id: MASTERLIST_ITEM.item_id, stock_onhand: 31 },
          error: null,
        });
      }
      return Promise.resolve(
        tableResponses[table] || { data: null, error: null },
      );
    }),
    update: jest.fn(() => {
      operation = "update";
      return query;
    }),
    insert: jest.fn((row) => {
      operation = "insert";
      insertedRow = row;
      insertedTransactions.push(row);
      return query;
    }),
    single: jest.fn(() =>
      Promise.resolve({
        data: {
          ...insertedRow,
          transaction_id: 91,
          created_at: insertedRow.created_at,
        },
        error: null,
      }),
    ),
  };
  tableQueries[table] = query;
  return query;
}

function mockMasterlistResponse(data = [], error = null) {
  tableResponses.items_masterlist = { data, error };
  return tableQueries.items_masterlist;
}

function StaffInventoryWithState(props) {
  const [inventory, setInventory] = useState(props.inventory || []);
  const [records, setRecords] = useState(props.records || []);
  return (
    <StaffInventory
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
  tableResponses = {
    items_masterlist: { data: [MASTERLIST_ITEM], error: null },
    users: { data: STAFF_USER, error: null },
    inventory_transactions: { data: [], error: null },
  };
  tableQueries = {};
  insertedTransactions = [];
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: STAFF_USER.auth_user_id } },
    error: null,
  });
  supabase.from.mockImplementation((table) => createQuery(table));
});

test("filters available supplies by name or product ID", async () => {
  await act(async () => {
    render(
      <StaffInventoryWithState
        inventory={[]}
        records={[]}
        profile={{ name: "Prof. Juan Dela Cruz", email: "juan@deptdesk.edu" }}
      />,
    );
  });

  const search = screen.getByRole("searchbox", { name: /search supplies/i });
  expect(screen.getByText("Folders")).toBeInTheDocument();

  fireEvent.change(search, { target: { value: "prd-0017" } });
  expect(screen.getAllByText("Folders")).toHaveLength(2);

  fireEvent.change(search, { target: { value: "missing" } });
  expect(screen.queryByText("Folders")).not.toBeInTheDocument();
});

test("loads active items and the linked user's transactions from Supabase", async () => {
  tableResponses.inventory_transactions = {
    data: [
      {
        transaction_id: 5,
        item_id: 17,
        is_issued_to: STAFF_USER.user_id,
        purpose: "Class activity",
        quantity: 2,
        action_type: "Borrow",
        return_date: null,
        borrow_date: "2026-10-12",
        status: "Borrowed",
        unit: "Boxes",
        created_at: "2026-10-12T10:00:00",
        recieved_by: null,
        returned_by: null,
      },
      {
        transaction_id: 6,
        item_id: 17,
        is_issued_to: 8,
        purpose: "Other user's record",
        quantity: 1,
        action_type: "Borrow",
        return_date: null,
        borrow_date: "2026-10-12",
        status: "Borrowed",
        unit: "Boxes",
        created_at: "2026-10-12T11:00:00",
      },
    ],
    error: null,
  };
  mockMasterlistResponse([MASTERLIST_ITEM]);

  await act(async () => {
    render(<StaffInventoryWithState inventory={[]} records={[]} />);
  });

  expect(screen.getByText("Folders")).toBeInTheDocument();
  expect(screen.getByText("17")).toBeInTheDocument();
  expect(screen.getByText("2 Boxes borrowed")).toBeInTheDocument();
  expect(screen.getByText("Prof. Maria Clara")).toBeInTheDocument();
  expect(screen.queryByText("Other user's record")).not.toBeInTheDocument();
  expect(supabase.auth.getUser).toHaveBeenCalled();
  expect(supabase.from).toHaveBeenCalledWith("users");
  expect(tableQueries.users.eq).toHaveBeenCalledWith(
    "auth_user_id",
    STAFF_USER.auth_user_id,
  );
  expect(supabase.from).toHaveBeenCalledWith("inventory_transactions");
});

test("persists a staff borrow with the linked public user ID", async () => {
  await act(async () => {
    render(<StaffInventoryWithState inventory={[]} records={[]} />);
  });

  fireEvent.click(screen.getByRole("button", { name: /^borrow$/i }));
  fireEvent.change(screen.getByLabelText(/remark \/ reason for borrowing/i), {
    target: { value: "Class activity" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /record borrow & view receipt/i }),
  );

  await waitFor(() => {
    expect(insertedTransactions).toHaveLength(1);
  });
  expect(insertedTransactions[0]).toEqual(
    expect.objectContaining({
      item_id: MASTERLIST_ITEM.item_id,
      is_issued_to: STAFF_USER.user_id,
      purpose: "Class activity",
      quantity: 1,
      action_type: "Borrow",
      status: "Borrowed",
      unit: "Boxes",
    }),
  );
  expect(tableQueries.items_masterlist.update).toHaveBeenCalledWith({
    stock_onhand: 31,
  });
  expect(await screen.findByText("Supply & Equipment Slip")).toBeInTheDocument();
});

test("persists a staff use action and deducts masterlist stock", async () => {
  mockMasterlistResponse([
    { ...MASTERLIST_ITEM, classification: "Usable" },
  ]);
  await act(async () => {
    render(<StaffInventoryWithState inventory={[]} records={[]} />);
  });

  fireEvent.click(screen.getByRole("button", { name: /^use$/i }));
  fireEvent.change(screen.getByLabelText(/remark \/ purpose of use/i), {
    target: { value: "Printer refill" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /record use & view receipt/i }),
  );

  await waitFor(() => {
    expect(insertedTransactions).toHaveLength(1);
  });
  expect(insertedTransactions[0]).toEqual(
    expect.objectContaining({
      item_id: MASTERLIST_ITEM.item_id,
      is_issued_to: STAFF_USER.user_id,
      purpose: "Printer refill",
      quantity: 1,
      action_type: "Use",
      status: "Used",
    }),
  );
  expect(tableQueries.items_masterlist.update).toHaveBeenCalledWith({
    stock_onhand: 31,
  });
});

test("persists a partial return and shows the updated return balance", async () => {
  tableResponses.inventory_transactions = {
    data: [
      {
        transaction_id: 44,
        item_id: 17,
        is_issued_to: STAFF_USER.user_id,
        purpose: "Workshop",
        quantity: 3,
        action_type: "Borrow",
        return_date: null,
        borrow_date: "2026-10-12",
        status: "Borrowed",
        unit: "Boxes",
        created_at: "2026-10-12T10:00:00",
        recieved_by: null,
        returned_by: null,
      },
    ],
    error: null,
  };

  await act(async () => {
    render(<StaffInventoryWithState inventory={[]} records={[]} />);
  });

  fireEvent.click(screen.getByRole("button", { name: /^return$/i }));
  fireEvent.change(screen.getByLabelText(/^quantity/i), {
    target: { value: "1" },
  });
  fireEvent.change(screen.getByLabelText(/condition \/ remark on return/i), {
    target: { value: "Good condition" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /record return & view receipt/i }),
  );

  await waitFor(() => {
    expect(insertedTransactions).toHaveLength(1);
  });
  expect(insertedTransactions[0]).toEqual(
    expect.objectContaining({
      item_id: MASTERLIST_ITEM.item_id,
      is_issued_to: STAFF_USER.user_id,
      quantity: 1,
      action_type: "Return",
      status: "Returned",
      borrow_date: "2026-10-12",
      returned_by: null,
    }),
  );
  expect(await screen.findByText("Partial Return (1/3)")).toBeInTheDocument();
});
