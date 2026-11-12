import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import StaffInventory from "./Inventory";
import { supabase } from "../../supabase/supabaseClient";

jest.mock("../../supabase/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const SAMPLE_INVENTORY = [
  {
    id: "supply-1",
    productId: "PRD-0001",
    name: "Folders",
    quantity: 32,
    unit: "Boxes",
  },
  {
    id: "supply-2",
    productId: "PRD-0002",
    name: "Ballpoint pens",
    quantity: 18,
    unit: "Pieces",
  },
];

function mockMasterlistResponse(data = [], error = null) {
  const query = {
    select: jest.fn(),
    is: jest.fn(),
    order: jest.fn().mockResolvedValue({ data, error }),
  };
  query.select.mockReturnValue(query);
  query.is.mockReturnValue(query);
  supabase.from.mockReturnValue(query);
  return query;
}

function StaffInventoryWithState(props) {
  const [inventory, setInventory] = useState(props.inventory || []);
  return (
    <StaffInventory
      {...props}
      inventory={inventory}
      setInventory={setInventory}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockMasterlistResponse();
});

test("filters available supplies by name or product ID", async () => {
  await act(async () => {
    render(
      <StaffInventory
        inventory={SAMPLE_INVENTORY}
        setInventory={jest.fn()}
        records={[]}
        setRecords={jest.fn()}
        profile={{ name: "Prof. Juan Dela Cruz", email: "juan@deptdesk.edu" }}
      />,
    );
  });

  expect(screen.queryByText(/recording as/i)).not.toBeInTheDocument();
  const search = screen.getByRole("searchbox", { name: /search supplies/i });
  expect(screen.getByText("Folders")).toBeInTheDocument();
  expect(screen.getByText("Ballpoint pens")).toBeInTheDocument();

  fireEvent.change(search, { target: { value: "prd-0002" } });
  expect(screen.queryByText("Folders")).not.toBeInTheDocument();
  expect(screen.getByText("Ballpoint pens")).toBeInTheDocument();

  fireEvent.change(search, { target: { value: "FOLDER" } });
  expect(screen.getByText("Folders")).toBeInTheDocument();
  expect(screen.queryByText("Ballpoint pens")).not.toBeInTheDocument();
});

test("loads active items from the Supabase masterlist into inventory state", async () => {
  const item = {
    item_id: 17,
    item_name: "Bond paper",
    stock_onhand: 120,
    unit: "reams",
    min_stock: 10,
    category: "Office supplies",
    classification: "Usable",
    archived_at: null,
    created_at: "2026-10-12",
  };
  const query = mockMasterlistResponse([item]);

  await act(async () => {
    render(
      <StaffInventoryWithState
        inventory={[]}
        records={[]}
        setRecords={jest.fn()}
      />,
    );
  });

  expect(await screen.findByText("Bond paper")).toBeInTheDocument();
  expect(screen.getByText("17")).toBeInTheDocument();
  expect(screen.getByText("120 reams")).toBeInTheDocument();
  expect(screen.getByText("Office supplies · Usable")).toBeInTheDocument();
  expect(supabase.from).toHaveBeenCalledWith("items_masterlist");
  expect(query.select).toHaveBeenCalledWith(
    "item_id, item_name, stock_onhand, unit, min_stock, category, classification, archived_at, created_at",
  );
  expect(query.is).toHaveBeenCalledWith("archived_at", null);
  expect(query.order).toHaveBeenCalledWith("item_name");
});

test("automatically uses logged-in account credentials when recording supplies", async () => {
  let savedRecords = [];
  const setRecords = jest.fn((updater) => {
    savedRecords =
      typeof updater === "function" ? updater(savedRecords) : updater;
  });
  await act(async () => {
    render(
      <StaffInventory
        inventory={SAMPLE_INVENTORY}
        setInventory={jest.fn()}
        records={savedRecords}
        setRecords={setRecords}
        profile={{ name: "Prof. Maria Clara", email: "maria@deptdesk.edu" }}
      />,
    );
  });

  const borrowButtons = screen.getAllByRole("button", { name: /^borrow$/i });
  expect(borrowButtons[0]).not.toBeDisabled();
  fireEvent.click(borrowButtons[0]);

  fireEvent.change(screen.getByLabelText(/remark \/ reason for borrowing/i), {
    target: { value: "Class activity" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /record borrow & view receipt/i }),
  );

  expect(savedRecords).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        person: "Prof. Maria Clara",
        productName: "Folders",
        status: "Borrowed",
      }),
    ]),
  );
});
